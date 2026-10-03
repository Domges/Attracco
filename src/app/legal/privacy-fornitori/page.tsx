import { ProviderLegalDoc } from "@/components/ProviderLegalDoc";
import { OPERATOR, PROVIDER_PRIVACY_VERSION } from "@/lib/legal";

export const metadata = { title: "Informativa privacy per i fornitori — Attracco" };

// Informativa ex art. 13 GDPR per titolari di ditte individuali, legali
// rappresentanti, referenti e personale dei fornitori. BOZZA da validare.
export default function ProviderPrivacy() {
  return (
    <ProviderLegalDoc version={PROVIDER_PRIVACY_VERSION}>
      <h1>Informativa privacy per i fornitori</h1>
      <p>
        Ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (&laquo;GDPR&raquo;), per chi si candida o aderisce ad Attracco come
        fornitore: titolari di ditte individuali e professionisti, legali rappresentanti, referenti e persone indicate nei documenti (ad
        esempio conducenti e skipper).
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        {OPERATOR.name}, {OPERATOR.registeredOffice}, P.IVA {OPERATOR.vatNumber}. Contatto privacy: {OPERATOR.privacyEmail}. [Indicare il DPO,
        se designato.]
      </p>

      <h2>2. Dati, finalità e basi giuridiche</h2>
      <p>
        <strong>Candidatura.</strong> Ragione sociale, partita IVA, sede, nome del referente, email, telefono, sito web, zone servite e
        descrizione dell&apos;offerta, per valutare la candidatura su tua richiesta (misure precontrattuali, art. 6.1.b GDPR).
      </p>
      <p>
        <strong>Adesione e gestione del rapporto.</strong> Codice fiscale, numero REA, PEC, data di nascita (per le persone fisiche),
        documenti abilitativi e assicurativi e i dati personali in essi contenuti, nome e ruolo di chi accetta le condizioni, data, ora e
        indirizzo IP dell&apos;accettazione, stato dell&apos;account Stripe: per concludere ed eseguire il contratto (art. 6.1.b), verificare i
        requisiti dei servizi offerti ai clienti e provare l&apos;accettazione delle condizioni (legittimo interesse, art. 6.1.f).
      </p>
      <p>
        <strong>Obblighi di legge.</strong> Dati identificativi e fiscali e corrispettivi, per gli adempimenti contabili e fiscali e per la
        comunicazione all&apos;Agenzia delle Entrate prevista dalla normativa DAC7 (art. 6.1.c).
      </p>
      <p>
        <strong>Tutela dei diritti e sicurezza.</strong> Registro delle operazioni sul profilo (verifiche, sospensioni e relative
        motivazioni), per gestire reclami e contestazioni e difendere i diritti di Attracco (art. 6.1.f).
      </p>
      <p>
        I documenti d&apos;identità e le coordinate bancarie sono raccolti direttamente da Stripe nella procedura di verifica dell&apos;account;
        Attracco non li riceve.
      </p>

      <h2>3. Conferimento</h2>
      <p>
        I dati richiesti sono necessari per valutare la candidatura e concludere il contratto; quelli fiscali sono richiesti dalla legge.
        Senza di essi non è possibile aderire alla piattaforma.
      </p>

      <h2>4. Destinatari</h2>
      <p>
        Stripe [entità da confermare], per la verifica dell&apos;account e la gestione dei pagamenti, [titolare autonomo / responsabile —
        verificare qualificazione nei termini Stripe]; [hosting e database: fornitori e region da confermare], responsabili del trattamento;
        consulenti fiscali e legali; Agenzia delle Entrate e altre autorità quando previsto dalla legge. I clienti ricevono i dati del
        fornitore pubblicati nella scheda del servizio (ragione sociale, partita IVA, sede, abilitazioni), che la legge richiede di rendere
        noti ai consumatori.
      </p>

      <h2>5. Trasferimenti extra UE</h2>
      <p>
        [Indicare se e verso quali paesi, e il meccanismo di trasferimento (decisione di adeguatezza, clausole contrattuali tipo), in base
        ai fornitori scelti.]
      </p>

      <h2>6. Conservazione</h2>
      <p>
        Candidature non accolte o ritirate: [n.] mesi dalla decisione. Fornitori attivi: per la durata del rapporto; dopo la cessazione, i
        dati identificativi e fiscali, le accettazioni e il registro per [10 anni — verificare termini civilistici, fiscali e DAC7], mentre
        recapiti personali e documenti abilitativi sono cancellati dopo [n.] mesi. Le versioni sostituite dei documenti sono cancellate
        dopo [n.] mesi.
      </p>

      <h2>7. Diritti</h2>
      <p>
        Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti ai trattamenti basati sul legittimo interesse
        scrivendo a {OPERATOR.privacyEmail}. Puoi proporre reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).
      </p>
      <p>
        Se indichi nei documenti dati di altre persone (es. conducenti o skipper), ti impegni a fornire loro questa informativa.
      </p>
    </ProviderLegalDoc>
  );
}
