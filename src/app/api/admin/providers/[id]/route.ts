import { z } from "zod";
import { PROVIDERS, SERVICES } from "@/data/catalog";
import { db } from "@/lib/db";
import { ADMIN_TRANSITIONS, canActivate, documentKind } from "@/lib/providers/rules";
import {
  checklistFor,
  getProviderRow,
  issueOnboardingLink,
  listDocuments,
  logProviderEvent,
  refreshStripeAccount,
  todayIso,
} from "@/lib/providers/server";

export const runtime = "nodejs";

// Azioni del back-office sui fornitori (protette da HTTP Basic Auth in src/proxy.ts).
// Sospensione, rifiuto e cessazione richiedono una motivazione, che viene
// registrata e va comunicata al fornitore (art. 4 Reg. (UE) 2019/1150).
const reason = z.string().trim().min(5).max(1000);
const uuid = z.string().regex(/^[0-9a-f-]{36}$/);

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start_onboarding") }),
  z.object({ action: z.literal("reissue_link") }),
  z.object({ action: z.literal("set_catalog"), catalogProviderId: z.string().max(80).nullable() }),
  z.object({ action: z.literal("verify_document"), documentId: uuid, expiresOn: z.iso.date().nullable().optional() }),
  z.object({ action: z.literal("reject_document"), documentId: uuid, note: reason }),
  z.object({ action: z.literal("sync_stripe") }),
  z.object({ action: z.literal("activate") }),
  z.object({ action: z.literal("suspend"), reason }),
  z.object({ action: z.literal("reject"), reason }),
  z.object({ action: z.literal("withdraw"), reason }),
  z.object({ action: z.literal("notes"), notes: z.string().max(5000) }),
]);

function fail(error: string, status = 409) {
  return Response.json({ error }, { status });
}

async function setStatus(id: string, action: keyof typeof ADMIN_TRANSITIONS, why?: string): Promise<boolean> {
  const t = ADMIN_TRANSITIONS[action];
  const sql = db();
  const rows = await sql`
    UPDATE providers SET status = ${t.to}, status_reason = ${why ?? null},
      activated_at = ${t.to === "active" ? sql`coalesce(activated_at, now())` : sql`activated_at`},
      updated_at = now()
    WHERE id = ${id} AND status IN ${sql(t.from)}
    RETURNING id`;
  if (rows.length === 0) return false;
  await logProviderEvent(id, `status:${t.to}`, { by: "admin", reason: why });
  return true;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const provider = await getProviderRow((await params).id);
  if (!provider) return fail("not_found", 404);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  const a = parsed.data;
  const id = provider.id;

  switch (a.action) {
    case "start_onboarding": {
      if (!(await setStatus(id, "start_onboarding"))) return fail("invalid_state");
      const link = await issueOnboardingLink(id);
      return Response.json({ ok: true, url: link.url, expiresAt: link.expiresAt });
    }
    case "reissue_link": {
      if (!["onboarding", "active", "suspended"].includes(provider.status)) return fail("invalid_state");
      const link = await issueOnboardingLink(id);
      return Response.json({ ok: true, url: link.url, expiresAt: link.expiresAt });
    }
    case "set_catalog": {
      if (a.catalogProviderId !== null) {
        const catalog = PROVIDERS.find((p) => p.id === a.catalogProviderId);
        if (!catalog) return fail("unknown_catalog_provider", 400);
        const categories = new Set(SERVICES.filter((s) => s.providerId === catalog.id).map((s) => s.category));
        if (categories.size > 0 && !categories.has(provider.category)) return fail("category_mismatch", 400);
        const [taken] = await db()`SELECT id FROM providers WHERE catalog_provider_id = ${a.catalogProviderId} AND id <> ${id}`;
        if (taken) return fail("catalog_provider_taken");
      }
      if (provider.status === "active" && a.catalogProviderId === null) return fail("invalid_state");
      await db()`UPDATE providers SET catalog_provider_id = ${a.catalogProviderId}, updated_at = now() WHERE id = ${id}`;
      await logProviderEvent(id, "catalog_linked", { catalog_provider_id: a.catalogProviderId });
      break;
    }
    case "verify_document": {
      const [doc] = await db()<{ kind: string; status: string }[]>`
        SELECT kind, status FROM provider_documents WHERE id = ${a.documentId} AND provider_id = ${id}`;
      if (!doc) return fail("not_found", 404);
      if (doc.status !== "pending") return fail("invalid_state");
      const kind = documentKind(provider.category, doc.kind);
      const expires = a.expiresOn ?? null;
      if (kind?.expires && (!expires || expires < todayIso())) return fail("expiry_required", 400);
      await db().begin(async (sql) => {
        await sql`
          UPDATE provider_documents SET status = 'superseded'
          WHERE provider_id = ${id} AND kind = ${doc.kind} AND status = 'verified' AND id <> ${a.documentId}`;
        await sql`
          UPDATE provider_documents SET status = 'verified', expires_on = ${expires}, reviewed_at = now(), review_note = NULL
          WHERE id = ${a.documentId}`;
        await logProviderEvent(id, "document_verified", { document: a.documentId, kind: doc.kind, expires_on: expires }, sql);
      });
      break;
    }
    case "reject_document": {
      const rows = await db()`
        UPDATE provider_documents SET status = 'rejected', review_note = ${a.note}, reviewed_at = now()
        WHERE id = ${a.documentId} AND provider_id = ${id} AND status = 'pending' RETURNING id`;
      if (rows.length === 0) return fail("invalid_state");
      await logProviderEvent(id, "document_rejected", { document: a.documentId, note: a.note });
      break;
    }
    case "sync_stripe": {
      if (!provider.stripe_account_id) return fail("no_stripe_account");
      await refreshStripeAccount(provider);
      break;
    }
    case "activate": {
      const checklist = checklistFor(provider, await listDocuments(id));
      if (!canActivate(checklist)) {
        return Response.json({ error: "checklist_incomplete", missing: checklist.filter((i) => !i.done).map((i) => i.label) }, { status: 409 });
      }
      if (!(await setStatus(id, "activate"))) return fail("invalid_state");
      break;
    }
    case "suspend":
    case "reject":
    case "withdraw": {
      if (!(await setStatus(id, a.action, a.reason))) return fail("invalid_state");
      // Il link di onboarding non serve più a un fornitore non accolto o cessato.
      if (a.action !== "suspend") {
        await db()`UPDATE providers SET onboarding_token_hash = NULL, onboarding_token_expires_at = NULL WHERE id = ${id}`;
      }
      break;
    }
    case "notes": {
      await db()`UPDATE providers SET admin_notes = ${a.notes || null}, updated_at = now() WHERE id = ${id}`;
      break;
    }
  }
  return Response.json({ ok: true });
}
