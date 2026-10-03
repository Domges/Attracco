import { z } from "zod";
import { db } from "@/lib/db";
import { PROVIDER_TERMS_VERSION } from "@/lib/legal";
import { logProviderEvent, providerByToken } from "@/lib/providers/server";
import { clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Accettazione delle Condizioni per i fornitori e approvazione specifica delle
// clausole elencate (artt. 1341-1342 c.c.), registrate con versione, firmatario,
// data e indirizzo IP a fini probatori.
const Body = z.object({
  version: z.string().max(20),
  signerName: z.string().trim().min(2).max(120),
  signerRole: z.string().trim().min(2).max(120),
  acceptTerms: z.literal(true),
  approveSpecificClauses: z.literal(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const provider = await providerByToken((await params).token);
  if (!provider) return Response.json({ error: "not_found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  if (parsed.data.version !== PROVIDER_TERMS_VERSION) return Response.json({ error: "terms_outdated" }, { status: 409 });

  const signer = `${parsed.data.signerName} (${parsed.data.signerRole})`;
  const now = new Date();
  await db()`
    UPDATE providers SET
      terms_version = ${PROVIDER_TERMS_VERSION}, terms_accepted_at = ${now}, specific_clauses_approved_at = ${now},
      terms_accepted_by = ${signer}, terms_accepted_ip = ${clientIp(req)}, updated_at = now()
    WHERE id = ${provider.id}`;
  await logProviderEvent(provider.id, "terms_accepted", { version: PROVIDER_TERMS_VERSION, signer, specific_clauses: true });
  return Response.json({ ok: true });
}
