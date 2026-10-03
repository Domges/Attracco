import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentUpload, ProfileForm, StripeButton, TermsForm } from "@/components/partner/OnboardingSteps";
import { PROVIDER_TERMS_VERSION } from "@/lib/legal";
import { CATEGORY_LABEL, documentState, MAX_DOCUMENT_BYTES, OPTIONAL_DOCUMENT, requiredDocuments } from "@/lib/providers/rules";
import { documentSnapshots, listDocuments, providerByToken, refreshStripeAccount, todayIso } from "@/lib/providers/server";

// Area personale di onboarding del fornitore, accessibile solo con il link ricevuto.
export const dynamic = "force-dynamic";
export const metadata = { title: "Adesione fornitore — Attracco", robots: { index: false, follow: false }, referrer: "no-referrer" };

const DOC_STATE: Record<string, { label: string; cls: string }> = {
  verified: { label: "Verificato", cls: "status ok" },
  pending: { label: "In verifica", cls: "status" },
  missing: { label: "Da caricare", cls: "status" },
  expired: { label: "Scaduto", cls: "status warn" },
  rejected: { label: "Da ricaricare", cls: "status warn" },
};

function Step({ title, done, children }: { title: string; done: boolean; children: React.ReactNode }) {
  return (
    <li>
      <h2>
        {title} <span className={done ? "status ok" : "status"}>{done ? "Completato" : "Da completare"}</span>
      </h2>
      {children}
    </li>
  );
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ stripe?: string }>;
}) {
  const { token } = await params;
  let provider = await providerByToken(token);
  if (!provider) notFound();

  // Ritorno da Stripe: aggiorna subito lo stato dell'account (il webhook può arrivare dopo).
  if ((await searchParams).stripe === "return" && provider.stripe_account_id) {
    await refreshStripeAccount(provider).catch((err) => console.error("stripe sync error", err));
    provider = (await providerByToken(token)) ?? provider;
  }

  const docs = await listDocuments(provider.id);
  const today = todayIso();
  const snaps = documentSnapshots(docs);
  const kinds = requiredDocuments(provider.category);
  const docsDone = kinds.every((k) => documentState(k, snaps, today) === "verified");
  const termsDone = provider.terms_version === PROVIDER_TERMS_VERSION && provider.specific_clauses_approved_at !== null;
  const stripeDone = provider.stripe_charges_enabled && provider.stripe_payouts_enabled;
  const rejectedNotes = new Map(docs.filter((d) => d.status === "rejected" && d.review_note).map((d) => [d.kind, d.review_note!]));

  return (
    <section className="legal" style={{ maxWidth: 860 }}>
      <span className="eyebrow">{CATEGORY_LABEL[provider.category]}</span>
      <h1>Adesione di {provider.legal_name}</h1>
      {provider.status === "active" && <p className="notice">Il tuo profilo è attivo. Da qui puoi aggiornare documenti in scadenza e dati.</p>}
      {provider.status === "suspended" && (
        <p className="notice">
          Il profilo è sospeso{provider.status_reason ? `: ${provider.status_reason}` : "."} Per chiarimenti rispondi all&apos;email con cui hai
          ricevuto questo link.
        </p>
      )}
      <p className="muted">
        Completa i quattro passaggi. Puoi interrompere e riprendere in qualsiasi momento con lo stesso link, valido fino al{" "}
        {provider.onboarding_token_expires_at?.toLocaleDateString("it-IT")}. Non inoltrarlo: dà accesso ai dati della tua attività.
      </p>

      <ol className="steps-list">
        <Step title="1. Dati della tua attività" done={provider.profile_completed_at !== null}>
          <p className="muted">
            Servono per il contratto e per la comunicazione annuale dei dati dei venditori all&apos;Agenzia delle Entrate prevista dalla
            normativa DAC7.
          </p>
          <ProfileForm
            token={token}
            legalForm={provider.legal_form}
            initial={{
              taxCode: provider.tax_code ?? "",
              rea: provider.rea ?? "",
              birthDate: provider.birth_date ? new Date(provider.birth_date).toISOString().slice(0, 10) : "",
              registeredOffice: provider.registered_office,
              pec: provider.pec ?? "",
              contactName: provider.contact_name,
              phone: provider.phone,
            }}
          />
        </Step>

        <Step title="2. Condizioni per i fornitori" done={termsDone}>
          {termsDone ? (
            <p>
              Accettate il {provider.terms_accepted_at?.toLocaleDateString("it-IT")} da {provider.terms_accepted_by} (versione{" "}
              {provider.terms_version}).{" "}
              <Link href="/legal/fornitori" target="_blank">
                Rileggi le condizioni
              </Link>
            </p>
          ) : (
            <TermsForm token={token} version={PROVIDER_TERMS_VERSION} previous={provider.terms_version} />
          )}
        </Step>

        <Step title="3. Documenti" done={docsDone}>
          <p className="muted">
            PDF, JPG o PNG, massimo {MAX_DOCUMENT_BYTES / 1024 / 1024} MB per file. Li verifichiamo entro [n. giorni lavorativi da definire];
            ti chiederemo di ricaricarli se illeggibili o scaduti.
          </p>
          {[...kinds, OPTIONAL_DOCUMENT].map((k) => {
            const state = k.id === OPTIONAL_DOCUMENT.id ? null : documentState(k, snaps, today);
            return (
              <div className="doc-row" key={k.id}>
                <div style={{ flex: "1 1 320px" }}>
                  <strong>{k.label}</strong> {state && <span className={DOC_STATE[state].cls}>{DOC_STATE[state].label}</span>}
                  <div className="muted" style={{ fontSize: ".88rem" }}>{k.help}</div>
                  {state === "rejected" && rejectedNotes.get(k.id) && (
                    <div className="error-text" style={{ fontSize: ".88rem" }}>Motivo: {rejectedNotes.get(k.id)}</div>
                  )}
                </div>
                <DocumentUpload token={token} kind={k.id} />
              </div>
            );
          })}
        </Step>

        <Step title="4. Incassi con Stripe" done={stripeDone}>
          <p className="muted">
            I pagamenti dei clienti sono gestiti da Stripe, istituto di pagamento autorizzato: Stripe verifica la tua identità e accredita gli
            incassi sul tuo conto, al netto della commissione di Attracco. Attracco non vede né conserva i tuoi dati bancari.
          </p>
          {provider.stripe_account_id && !stripeDone && provider.stripe_requirements_due.length > 0 && (
            <p className="notice">Stripe richiede ancora alcune informazioni. Riprendi la procedura per completarle.</p>
          )}
          {stripeDone ? (
            <p>Account Stripe attivo.</p>
          ) : termsDone ? (
            <StripeButton token={token} resume={Boolean(provider.stripe_account_id)} />
          ) : (
            <p className="muted">Disponibile dopo l&apos;accettazione delle condizioni.</p>
          )}
        </Step>
      </ol>
      <p className="muted">
        Quando tutti i passaggi sono completati e i documenti verificati, attiviamo il profilo e pubblichiamo i tuoi servizi. Per domande
        rispondi all&apos;email con cui hai ricevuto il link.
      </p>
    </section>
  );
}
