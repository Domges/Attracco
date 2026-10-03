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

  // Fornitori. Termini facoltativi: se non impostati, la relativa pulizia è saltata.
  const appMonths = Number(process.env.PROVIDER_APPLICATION_RETENTION_MONTHS);
  if (Number.isInteger(appMonths) && appMonths >= 1) {
    // Candidature mai attivate, non accolte o ritirate: cancellate con documenti e registro.
    const apps = await sql`
      DELETE FROM providers
      WHERE status IN ('rejected', 'withdrawn') AND activated_at IS NULL
        AND updated_at < now() - make_interval(months => ${appMonths})
      RETURNING id`;
    // Documenti sostituiti o respinti: non più necessari alla verifica.
    const docs = await sql`
      DELETE FROM provider_documents
      WHERE status IN ('superseded', 'rejected') AND created_at < now() - make_interval(months => ${appMonths})
      RETURNING id`;
    console.log(`Cancellate ${apps.length} candidature fornitori e ${docs.length} documenti superati.`);
  } else {
    console.log("PROVIDER_APPLICATION_RETENTION_MONTHS non impostato: candidature fornitori non trattate.");
  }

  const providerMonths = Number(process.env.PROVIDER_RETENTION_MONTHS);
  if (Number.isInteger(providerMonths) && providerMonths >= 1) {
    // Fornitori cessati: restano i dati identificativi e fiscali (ragione sociale, P.IVA, codice
    // fiscale, sede, data di nascita) necessari agli obblighi contabili e DAC7, compreso l'obbligo di
    // conservazione della documentazione DAC7 [durata da verificare]; il termine va fissato di
    // conseguenza. Si eliminano recapiti personali, note e documenti.
    const ended = await sql`
      UPDATE providers SET
        contact_name = 'anonimizzato', email = 'anonimizzato', phone = 'anonimizzato', pec = NULL,
        admin_notes = NULL, terms_accepted_ip = NULL,
        onboarding_token_hash = NULL, onboarding_token_expires_at = NULL,
        anonymized_at = now(), updated_at = now()
      WHERE status = 'withdrawn' AND activated_at IS NOT NULL AND anonymized_at IS NULL
        AND updated_at < now() - make_interval(months => ${providerMonths})
      RETURNING id`;
    if (ended.length) {
      await sql`DELETE FROM provider_documents WHERE provider_id IN ${sql(ended.map((r) => r.id))}`;
    }
    console.log(`Anonimizzati ${ended.length} fornitori cessati.`);
  } else {
    console.log("PROVIDER_RETENTION_MONTHS non impostato: fornitori cessati non trattati.");
  }
} finally {
  await sql.end();
}
