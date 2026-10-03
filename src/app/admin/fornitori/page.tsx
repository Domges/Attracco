import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORY_LABEL, STATUS_LABEL, type ProviderStatus } from "@/lib/providers/rules";
import type { ProviderRow } from "@/lib/providers/server";

// Back-office: candidature e fornitori. Accesso protetto da HTTP Basic Auth (src/proxy.ts).
export const dynamic = "force-dynamic";
export const metadata = { title: "Fornitori — Back-office Attracco", robots: { index: false, follow: false } };

const ORDER: ProviderStatus[] = ["applied", "onboarding", "active", "suspended", "rejected", "withdrawn"];

export default async function ProvidersAdminPage() {
  const rows = await db()<(ProviderRow & { pending_docs: number })[]>`
    SELECT p.*, (SELECT count(*)::int FROM provider_documents d WHERE d.provider_id = p.id AND d.status = 'pending') AS pending_docs
    FROM providers p WHERE p.anonymized_at IS NULL ORDER BY p.created_at DESC LIMIT 500`;
  const counts = Object.fromEntries(ORDER.map((s) => [s, rows.filter((r) => r.status === s).length]));

  return (
    <section>
      <h1>Fornitori</h1>
      <p className="muted">
        {ORDER.filter((s) => counts[s]).map((s) => `${STATUS_LABEL[s]}: ${counts[s]}`).join(" · ") || "Nessuna candidatura."} Pagina pubblica
        di candidatura: <Link href="/partner">/partner</Link>.
      </p>
      <div className="table-scroll">
        <table className="admin">
          <thead>
            <tr>
              <th>Fornitore</th>
              <th>Categoria</th>
              <th>Zone</th>
              <th>Stato</th>
              <th>Documenti da verificare</th>
              <th>Stripe</th>
              <th>Ricevuta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/fornitori/${p.id}`}>{p.legal_name}</Link>
                  <div className="muted">P.IVA {p.vat_number} · {p.contact_name}</div>
                </td>
                <td>{CATEGORY_LABEL[p.category]}</td>
                <td>{p.areas.join(", ")}</td>
                <td>{STATUS_LABEL[p.status]}</td>
                <td>{p.pending_docs || "—"}</td>
                <td>{p.stripe_account_id ? (p.stripe_charges_enabled && p.stripe_payouts_enabled ? "attivo" : "incompleto") : "—"}</td>
                <td>{new Date(p.created_at).toLocaleDateString("it-IT")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
