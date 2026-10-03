import { z } from "zod";
import { db } from "@/lib/db";
import { isPlausibleTaxCode } from "@/lib/providers/rules";
import { logProviderEvent, providerByToken } from "@/lib/providers/server";

export const runtime = "nodejs";

// Dati anagrafici e fiscali necessari per il contratto e per la comunicazione
// DAC7 dei venditori (D.Lgs. 32/2023, di recepimento della dir. (UE) 2021/514).
const Body = z.object({
  taxCode: z.string().trim().toUpperCase().refine(isPlausibleTaxCode),
  rea: z.string().trim().max(40).optional().default(""),
  birthDate: z.iso.date().optional().or(z.literal("")).default(""),
  registeredOffice: z.string().trim().min(5).max(300),
  pec: z.union([z.email().max(200), z.literal("")]).optional().default(""),
  contactName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{6,20}$/),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const provider = await providerByToken((await params).token);
  if (!provider) return Response.json({ error: "not_found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const b = parsed.data;
  if (provider.legal_form === "individual" && !b.birthDate) {
    return Response.json({ error: "invalid_request", issues: ["birthDate"] }, { status: 400 });
  }
  if (provider.legal_form === "company" && !b.rea) {
    return Response.json({ error: "invalid_request", issues: ["rea"] }, { status: 400 });
  }
  await db()`
    UPDATE providers SET
      tax_code = ${b.taxCode}, rea = ${b.rea || null},
      birth_date = ${provider.legal_form === "individual" ? b.birthDate : null},
      registered_office = ${b.registeredOffice}, pec = ${b.pec || null},
      contact_name = ${b.contactName}, phone = ${b.phone},
      profile_completed_at = now(), updated_at = now()
    WHERE id = ${provider.id}`;
  await logProviderEvent(provider.id, "profile_updated");
  return Response.json({ ok: true });
}
