import Link from "next/link";
import { notFound } from "next/navigation";
import { PROVIDERS } from "@/data/catalog";
import { db } from "@/lib/db";
import { canActivate, CATEGORY_LABEL, documentKind, STATUS_LABEL } from "@/lib/providers/rules";
import { checklistFor, getProviderRow, listDocuments } from "@/lib/providers/server";
import { CatalogLink, DocumentActions, NotesForm, ProviderActions } from "./ProviderAdminActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fornitore — Back-office Attracco", robots: { index: false, follow: false } };

const DOC_STATUS: Record<string, string> = {
  pending: "da verificare",
  verified: "verificato",
  rejected: "respinto",
  superseded: "sostituito",
};

function fmt(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleString("it-IT", { timeZone: "Europe/Rome" }) : "—";
}

export default async function ProviderAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const provider = await getProviderRow((await params).id);
  if (!provider) notFound();
  const docs = await listDocuments(provider.id);
  const checklist = checklistFor(provider, docs);
  const events = await db()<{ kind: string; detail: Record<string, unknown>; created_at: Date }[]>`
    SELECT kind, detail, created_at FROM provider_events WHERE provider_id = ${provider.id} ORDER BY created_at DESC LIMIT 100`;
  const p = provider;

  return (
    <section>
      <p><Link href="/admin/fornitori">← Fornitori</Link></p>
      <span className="eyebrow">{CATEGORY_LABEL[p.category]}</span>
      <h1 style={{ marginTop: 6 }}>{p.legal_name}</h1>
      <p>
        <span className={p.status === "active" ? "status ok" : p.status === "suspended" ? "status warn" : "status"}>{STATUS_LABEL[p.status]}</span>
        {p.status_reason && <span className="muted"> — {p.status_reason}</span>}
      </p>

      <ProviderActions id={p.id} status={p.status} canActivate={canActivate(checklist)} hasStripe={Boolean(p.stripe_account_id)} />

      <div className="admin-grid" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Dati</h3>
          <dl className="facts">
            <dt>Forma</dt><dd>{p.legal_form === "individual" ? "Ditta individuale / professionista" : "Società"}</dd>
            <dt>P.IVA</dt><dd>{p.vat_number}</dd>
            <dt>Codice fiscale</dt><dd>{p.tax_code ?? "—"}</dd>
            <dt>REA</dt><dd>{p.rea ?? "—"}</dd>
            {p.legal_form === "individual" && (<><dt>Data di nascita</dt><dd>{p.birth_date ? new Date(p.birth_date).toLocaleDateString("it-IT") : "—"}</dd></>)}
            <dt>Sede</dt><dd>{p.registered_office}</dd>
            <dt>Referente</dt><dd>{p.contact_name}</dd>
            <dt>Email</dt><dd><a href={`mailto:${p.email}`}>{p.email}</a></dd>
            <dt>Telefono</dt><dd>{p.phone}</dd>
            <dt>PEC</dt><dd>{p.pec ?? "—"}</dd>
            <dt>Sito</dt><dd>{p.website ?? "—"}</dd>
            <dt>Zone</dt><dd>{p.areas.join(", ")}</dd>
            <dt>Candidatura</dt><dd>{fmt(p.applied_at)} (informativa {p.privacy_version})</dd>
            <dt>Condizioni</dt>
            <dd>{p.terms_accepted_at ? `v. ${p.terms_version}, ${fmt(p.terms_accepted_at)}, ${p.terms_accepted_by}` : "non accettate"}</dd>
            <dt>Stripe</dt>
            <dd>
              {p.stripe_account_id ?? "—"}
              {p.stripe_account_id && (
                <div className="muted">
                  incassi {p.stripe_charges_enabled ? "sì" : "no"} · bonifici {p.stripe_payouts_enabled ? "sì" : "no"} · aggiornato {fmt(p.stripe_synced_at)}
                  {p.stripe_requirements_due.length > 0 && <> · richiesti: {p.stripe_requirements_due.join(", ")}</>}
                </div>
              )}
            </dd>
            <dt>Link onboarding</dt><dd>{p.onboarding_token_expires_at ? `valido fino al ${fmt(p.onboarding_token_expires_at)}` : "—"}</dd>
          </dl>
          <h3 style={{ marginTop: 20 }}>Descrizione dell&apos;offerta</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{p.offer_description}</p>
        </div>

        <div>
          <div className="card">
            <h3>Requisiti per l&apos;attivazione</h3>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {checklist.map((i) => (
                <li key={i.id}>
                  {i.done ? "✓" : "○"} {i.label}
                  {i.detail && <span className="muted"> ({i.detail})</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ marginTop: 24 }}>
            <h3>Fornitore del catalogo</h3>
            <p className="muted">
              Collega il fornitore alla voce di <code>src/data/catalog.ts</code> dei suoi servizi: le prenotazioni useranno il suo account
              Stripe solo quando è attivo. Prima della pubblicazione, aggiorna nel catalogo ragione sociale, P.IVA, sede, abilitazioni e polizza.
            </p>
            <CatalogLink id={p.id} current={p.catalog_provider_id} options={PROVIDERS.map((c) => ({ id: c.id, label: `${c.id} — ${c.legalName}` }))} />
          </div>
          <div className="card" style={{ marginTop: 24 }}>
            <h3>Note interne</h3>
            <NotesForm id={p.id} notes={p.admin_notes ?? ""} />
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: "1.8rem", marginTop: 40 }}>Documenti</h2>
      <div className="table-scroll">
        <table className="admin">
          <thead>
            <tr><th>Tipo</th><th>File</th><th>Caricato</th><th>Stato</th><th>Scadenza</th><th>Azioni</th></tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const kind = documentKind(p.category, d.kind);
              return (
                <tr key={d.id}>
                  <td>{kind?.label ?? d.kind}</td>
                  <td>
                    <a href={`/api/admin/providers/${p.id}/documents/${d.id}`}>{d.filename}</a>
                    <div className="muted">{Math.ceil(d.size_bytes / 1024)} KB · sha256 {d.sha256.slice(0, 12)}…</div>
                  </td>
                  <td>{fmt(d.created_at)}<div className="muted">da {d.uploaded_by === "provider" ? "fornitore" : "admin"}</div></td>
                  <td>{DOC_STATUS[d.status]}{d.review_note && <div className="muted">{d.review_note}</div>}</td>
                  <td>{d.expires_on ? new Date(d.expires_on).toLocaleDateString("it-IT") : "—"}</td>
                  <td>{d.status === "pending" ? <DocumentActions providerId={p.id} documentId={d.id} needsExpiry={Boolean(kind?.expires)} /> : "—"}</td>
                </tr>
              );
            })}
            {docs.length === 0 && <tr><td colSpan={6} className="muted">Nessun documento caricato.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "1.8rem", marginTop: 40 }}>Registro</h2>
      <div className="table-scroll">
        <table className="admin">
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td style={{ whiteSpace: "nowrap" }}>{fmt(e.created_at)}</td>
                <td>{e.kind}</td>
                <td className="muted">{Object.keys(e.detail).length ? JSON.stringify(e.detail) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
