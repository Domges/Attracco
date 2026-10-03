import { z } from "zod";
import { PUGLIA_AREAS } from "@/data/catalog";
import { db } from "@/lib/db";
import { PROVIDER_PRIVACY_VERSION } from "@/lib/legal";
import { isValidItalianVat } from "@/lib/providers/rules";
import { logProviderEvent } from "@/lib/providers/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Candidatura pubblica dei fornitori. Raccoglie solo i dati necessari a
// valutare la candidatura; i dati fiscali completi (DAC7) e i documenti sono
// richiesti dopo, tramite il link personale di onboarding.
const Body = z.object({
  category: z.enum(["chef", "driver", "sailing"]),
  legalForm: z.enum(["individual", "company"]),
  legalName: z.string().trim().min(2).max(200),
  vatNumber: z.string().trim().max(20).refine(isValidItalianVat),
  registeredOffice: z.string().trim().min(5).max(300),
  contactName: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{6,20}$/),
  website: z.union([z.url().max(300), z.literal("")]).optional().default(""),
  areas: z.array(z.enum(PUGLIA_AREAS)).min(1).max(PUGLIA_AREAS.length),
  offerDescription: z.string().trim().min(30).max(3000),
  isTrader: z.literal(true),
  privacyAcknowledged: z.literal(true),
  // Campo esca anti-spam: deve restare vuoto.
  company: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`partner-apply:${clientIp(req)}`, 5, 3_600_000)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const b = parsed.data;
  // Bot: risposta di successo senza salvare nulla.
  if (b.company) return Response.json({ ok: true });
  const vat = b.vatNumber.replace(/^IT/i, "");

  const [existing] = await db()<{ id: string }[]>`
    SELECT id FROM providers WHERE vat_number = ${vat} AND category = ${b.category} AND status IN ('applied','onboarding','active','suspended')`;
  if (existing) return Response.json({ ok: true });

  const [row] = await db()<{ id: string }[]>`
    INSERT INTO providers (
      category, legal_form, legal_name, vat_number, registered_office, contact_name, email, phone,
      website, areas, offer_description, privacy_version
    ) VALUES (
      ${b.category}, ${b.legalForm}, ${b.legalName}, ${vat}, ${b.registeredOffice}, ${b.contactName}, ${b.email.toLowerCase()}, ${b.phone},
      ${b.website || null}, ${b.areas}, ${b.offerDescription}, ${PROVIDER_PRIVACY_VERSION}
    ) RETURNING id`;
  await logProviderEvent(row.id, "applied", { privacy: PROVIDER_PRIVACY_VERSION, declared_trader: true });
  // Risposta identica per candidature nuove e già presenti: non rivela chi è registrato.
  return Response.json({ ok: true });
}
