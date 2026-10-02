// Minimizzazione dei dati (art. 5.1.e GDPR): anonimizza i dati personali delle
// prenotazioni concluse da più di RETENTION_MONTHS mesi. Restano i dati
// economici e di servizio necessari agli obblighi contabili e fiscali.
// Da eseguire periodicamente (es. cron giornaliero).
import postgres from "postgres";

const months = Number(process.env.RETENTION_MONTHS);
if (!process.env.DATABASE_URL || !Number.isInteger(months) || months < 1) {
  console.error("Impostare DATABASE_URL e RETENTION_MONTHS (intero >= 1, definito con il DPO).");
  process.exit(1);
}
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  const rows = await sql`
    UPDATE bookings SET
      customer_name = 'anonimizzato',
      customer_email = 'anonimizzato',
      customer_phone = 'anonimizzato',
      pickup_address = NULL,
      notes = NULL,
      dietary_notes = NULL,
      anonymized_at = now(),
      updated_at = now()
    WHERE anonymized_at IS NULL
      AND service_date < (now() - make_interval(months => ${months}))::date
    RETURNING id`;
  // I dati sanitari non servono oltre l'erogazione: cancellati 7 giorni dopo il servizio.
  const health = await sql`
    UPDATE bookings SET dietary_notes = NULL, updated_at = now()
    WHERE dietary_notes IS NOT NULL AND service_date < (now() - interval '7 days')::date
    RETURNING id`;
  console.log(`Anonimizzate ${rows.length} prenotazioni; rimossi dati alimentari da ${health.length}.`);
} finally {
  await sql.end();
}
