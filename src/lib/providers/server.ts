import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type postgres from "postgres";
import type Stripe from "stripe";
import type { Category } from "@/data/catalog";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { PROVIDER_TERMS_VERSION } from "@/lib/legal";
import { stripe } from "@/lib/stripe";
import {
  activationChecklist,
  type DocumentSnapshot,
  type DocumentStatus,
  type LegalForm,
  type ProviderSnapshot,
  type ProviderStatus,
} from "./rules";

export const ONBOARDING_LINK_DAYS = 30;

export interface ProviderRow {
  id: string;
  status: ProviderStatus;
  category: Category;
  catalog_provider_id: string | null;
  legal_form: LegalForm;
  legal_name: string;
  vat_number: string;
  tax_code: string | null;
  rea: string | null;
  registered_office: string;
  birth_date: Date | null;
  contact_name: string;
  email: string;
  phone: string;
  pec: string | null;
  website: string | null;
  areas: string[];
  offer_description: string;
  privacy_version: string;
  applied_at: Date;
  terms_version: string | null;
  terms_accepted_at: Date | null;
  specific_clauses_approved_at: Date | null;
  terms_accepted_by: string | null;
  profile_completed_at: Date | null;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  stripe_requirements_due: string[];
  stripe_synced_at: Date | null;
  onboarding_token_expires_at: Date | null;
  status_reason: string | null;
  admin_notes: string | null;
  activated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentRow {
  id: string;
  provider_id: string;
  kind: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  expires_on: Date | null;
  status: DocumentStatus;
  review_note: string | null;
  reviewed_at: Date | null;
  uploaded_by: "provider" | "admin";
  created_at: Date;
}

// Colonne dei documenti senza il contenuto binario.
const DOC_COLUMNS = [
  "id", "provider_id", "kind", "filename", "mime_type", "size_bytes", "sha256",
  "expires_on", "status", "review_note", "reviewed_at", "uploaded_by", "created_at",
];

export async function logProviderEvent(
  providerId: string,
  kind: string,
  detail: Record<string, unknown> = {},
  sql: postgres.Sql | postgres.TransactionSql = db(),
) {
  await sql`INSERT INTO provider_events (provider_id, kind, detail) VALUES (${providerId}, ${kind}, ${sql.json(detail as postgres.JSONValue)})`;
}

// --- Link di onboarding ----------------------------------------------------

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Genera un nuovo link personale (invalida il precedente). Il token in chiaro non viene salvato. */
export async function issueOnboardingLink(providerId: string): Promise<{ url: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ONBOARDING_LINK_DAYS * 86_400_000);
  await db()`
    UPDATE providers SET onboarding_token_hash = ${hashToken(token)}, onboarding_token_expires_at = ${expiresAt}, updated_at = now()
    WHERE id = ${providerId}`;
  await logProviderEvent(providerId, "onboarding_link_issued", { expires_at: expiresAt.toISOString() });
  return { url: `${env.siteUrl()}/partner/onboarding/${token}`, expiresAt };
}

/** Fornitore associato a un token valido, solo negli stati in cui l'onboarding è consentito. */
export async function providerByToken(token: string): Promise<ProviderRow | undefined> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return undefined;
  const [row] = await db()<ProviderRow[]>`
    SELECT * FROM providers
    WHERE onboarding_token_hash = ${hashToken(token)}
      AND onboarding_token_expires_at > now()
      AND status IN ('onboarding', 'active', 'suspended')`;
  return row;
}

// --- Lettura ---------------------------------------------------------------

export async function getProviderRow(id: string): Promise<ProviderRow | undefined> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return undefined;
  const [row] = await db()<ProviderRow[]>`SELECT * FROM providers WHERE id = ${id}`;
  return row;
}

export async function listDocuments(providerId: string): Promise<DocumentRow[]> {
  const sql = db();
  return sql<DocumentRow[]>`
    SELECT ${sql(DOC_COLUMNS)} FROM provider_documents
    WHERE provider_id = ${providerId} ORDER BY created_at DESC`;
}

function isoDate(d: Date | null): string | null {
  return d ? new Date(d).toISOString().slice(0, 10) : null;
}

export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
}

export function snapshot(p: ProviderRow): ProviderSnapshot {
  return {
    status: p.status,
    category: p.category,
    legalForm: p.legal_form,
    catalogProviderId: p.catalog_provider_id,
    profileCompletedAt: p.profile_completed_at,
    termsVersion: p.terms_version,
    termsAcceptedAt: p.terms_accepted_at,
    specificClausesApprovedAt: p.specific_clauses_approved_at,
    stripeAccountId: p.stripe_account_id,
    stripeChargesEnabled: p.stripe_charges_enabled,
    stripePayoutsEnabled: p.stripe_payouts_enabled,
  };
}

export function documentSnapshots(docs: DocumentRow[]): DocumentSnapshot[] {
  return docs.map((d) => ({ kind: d.kind, status: d.status, expiresOn: isoDate(d.expires_on) }));
}

export function checklistFor(p: ProviderRow, docs: DocumentRow[]) {
  return activationChecklist(snapshot(p), documentSnapshots(docs), PROVIDER_TERMS_VERSION, todayIso());
}

// --- Stripe Connect --------------------------------------------------------

/** Crea (una sola volta) l'account Express del fornitore. */
export async function ensureStripeAccount(p: ProviderRow): Promise<string> {
  if (p.stripe_account_id) return p.stripe_account_id;
  const account = await stripe().accounts.create(
    {
      country: "IT",
      email: p.email,
      business_type: p.legal_form === "individual" ? "individual" : "company",
      // Account Express: Stripe raccoglie i dati e svolge la verifica KYC;
      // la piattaforma risponde dei saldi negativi (es. contestazioni non coperte).
      controller: {
        stripe_dashboard: { type: "express" },
        fees: { payer: "application" },
        losses: { payments: "application" },
        requirement_collection: "stripe",
      },
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: {
        name: p.legal_name,
        url: p.website ?? undefined,
        product_description: `Servizi turistici in Puglia venduti tramite Attracco (${p.category})`,
      },
      metadata: { attracco_provider_id: p.id },
    },
    { idempotencyKey: `connect-account-${p.id}` },
  );
  await db()`
    UPDATE providers SET stripe_account_id = ${account.id}, updated_at = now()
    WHERE id = ${p.id} AND stripe_account_id IS NULL`;
  await logProviderEvent(p.id, "stripe_account_created", { account: account.id });
  return account.id;
}

export async function stripeOnboardingUrl(p: ProviderRow, token: string): Promise<string> {
  const account = await ensureStripeAccount(p);
  const base = `${env.siteUrl()}/partner/onboarding/${token}`;
  const link = await stripe().accountLinks.create({
    account,
    type: "account_onboarding",
    refresh_url: `${env.siteUrl()}/api/partner/onboarding/${token}/stripe`,
    return_url: `${base}?stripe=return`,
    collection_options: { fields: "eventually_due" },
  });
  return link.url;
}

/** Aggiorna lo stato dell'account Stripe (da webhook account.updated o su richiesta). */
export async function syncStripeAccount(account: Stripe.Account): Promise<void> {
  const due = [...(account.requirements?.currently_due ?? []), ...(account.requirements?.past_due ?? [])];
  const rows = await db()<{ id: string; status: ProviderStatus }[]>`
    UPDATE providers SET
      stripe_charges_enabled = ${account.charges_enabled ?? false},
      stripe_payouts_enabled = ${account.payouts_enabled ?? false},
      stripe_details_submitted = ${account.details_submitted ?? false},
      stripe_requirements_due = ${[...new Set(due)]},
      stripe_synced_at = now(),
      updated_at = now()
    WHERE stripe_account_id = ${account.id}
    RETURNING id, status`;
  for (const row of rows) {
    await logProviderEvent(row.id, "stripe_account_synced", {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      due: due.length,
    });
    // Un fornitore attivo che perde l'abilitazione agli incassi non può ricevere prenotazioni:
    // lo si segnala nel registro; la sospensione resta una decisione motivata del back-office.
    if (row.status === "active" && !account.charges_enabled) {
      await logProviderEvent(row.id, "warning:stripe_charges_disabled");
    }
  }
}

export async function refreshStripeAccount(p: ProviderRow): Promise<void> {
  if (!p.stripe_account_id) return;
  await syncStripeAccount(await stripe().accounts.retrieve(p.stripe_account_id));
}

/**
 * Account Stripe di destinazione per un fornitore del catalogo. Se il fornitore
 * è stato registrato tramite onboarding, deve essere attivo e abilitato agli
 * incassi; altrimenti si usa la variabile d'ambiente indicata nel catalogo.
 */
export async function destinationAccount(catalogProviderId: string, envName: string): Promise<string | null> {
  const [row] = await db()<{ status: ProviderStatus; stripe_account_id: string | null; stripe_charges_enabled: boolean }[]>`
    SELECT status, stripe_account_id, stripe_charges_enabled FROM providers WHERE catalog_provider_id = ${catalogProviderId}`;
  if (row) {
    return row.status === "active" && row.stripe_account_id && row.stripe_charges_enabled ? row.stripe_account_id : null;
  }
  const id = process.env[envName];
  return id && id.startsWith("acct_") ? id : null;
}

export { PROVIDER_TERMS_VERSION };
