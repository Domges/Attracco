import { getService } from "@/data/catalog";
import { db, type BookingRow } from "@/lib/db";
import { formatEuro } from "@/lib/pricing";
import { AdminActions } from "./AdminActions";

// Back-office: elenco prenotazioni e azioni di conferma/rifiuto/rimborso.
// Accesso protetto da HTTP Basic Auth (src/proxy.ts).
export const dynamic = "force-dynamic";
export const metadata = { title: "Back-office — Attracco", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const rows = await db()<BookingRow[]>`
    SELECT * FROM bookings WHERE status <> 'pending_payment' OR created_at > now() - interval '1 day'
    ORDER BY created_at DESC LIMIT 200`;
  return (
    <section>
      <h1>Prenotazioni</h1>
      <p className="muted">
        Le prenotazioni &laquo;authorized&raquo; hanno la carta pre-autorizzata: confermare entro 48 ore (l&apos;autorizzazione Stripe scade
        dopo [n. giorni da verificare per circuito]). I dati su allergie sono visibili solo per il servizio e cancellati 7 giorni dopo.
      </p>
      <div className="table-scroll">
        <table className="admin">
          <thead>
            <tr>
              <th>Rif.</th>
              <th>Servizio</th>
              <th>Data</th>
              <th>Ospiti</th>
              <th>Cliente</th>
              <th>Importo</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>{b.public_ref}</td>
                <td>
                  {getService(b.service_id)?.title.it ?? b.service_id}
                  <div className="muted">{b.area}{b.pickup_address ? ` · ${b.pickup_address}` : ""}</div>
                  {b.notes && <div className="muted">Note: {b.notes}</div>}
                  {b.dietary_notes && <div>Allergie: {b.dietary_notes}</div>}
                </td>
                <td>
                  {new Date(b.service_date).toISOString().slice(0, 10)} {b.start_time}
                </td>
                <td>{b.guests}</td>
                <td>
                  {b.customer_name}
                  <div className="muted">{b.customer_email} · {b.customer_phone}</div>
                </td>
                <td>
                  {formatEuro(b.amount_cents)}
                  <div className="muted">fee {formatEuro(b.platform_fee_cents)}</div>
                </td>
                <td>{b.status}</td>
                <td>
                  <AdminActions id={b.id} status={b.status} amountCents={b.amount_cents} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
