import { LegalDoc } from "@/components/LegalDoc";
import { OPERATOR, PRIVACY_VERSION } from "@/lib/legal";

export const metadata = { title: "Informativa privacy — Attracco" };

export default function Privacy() {
  return (
    <LegalDoc
      version={PRIVACY_VERSION}
      it={
        <>
          <h1>Informativa sul trattamento dei dati personali</h1>
          <p>Ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (&laquo;GDPR&raquo;).</p>
          <h2>1. Titolare del trattamento</h2>
          <p>
            {OPERATOR.name}, {OPERATOR.registeredOffice}, P.IVA {OPERATOR.vatNumber}. Contatto privacy: {OPERATOR.privacyEmail}. [Indicare il
            DPO, se designato.]
          </p>
          <h2>2. Dati trattati, finalità e basi giuridiche</h2>
          <p>
            <strong>Prenotazione.</strong> Nome, email, telefono, indirizzo di partenza (per i transfer), data, località, numero di ospiti e note:
            per gestire la richiesta e il contratto con il Fornitore (art. 6.1.b GDPR) e per adempiere agli obblighi contabili e fiscali (art.
            6.1.c).
          </p>
          <p>
            <strong>Allergie e intolleranze.</strong> Facoltative, solo per i servizi di chef: sono dati relativi alla salute, trattati solo con il
            tuo consenso esplicito (art. 9.2.a), comunicati al solo chef e cancellati 7 giorni dopo il servizio. Puoi revocare il consenso in
            qualsiasi momento scrivendo a {OPERATOR.privacyEmail}, senza pregiudicare la liceità del trattamento precedente.
          </p>
          <p>
            <strong>Chat con il concierge AI.</strong> I messaggi che scrivi sono inviati al fornitore del modello di intelligenza artificiale per
            generare la risposta, sulla base delle misure precontrattuali da te richieste (art. 6.1.b) e del nostro legittimo interesse a offrire
            un servizio di assistenza (art. 6.1.f). Attracco non salva le conversazioni: lo storico resta nel tuo browser fino alla chiusura della
            pagina. Ti chiediamo di non inserire in chat dati personali o sanitari.
          </p>
          <p>
            <strong>Pagamento.</strong> I dati della carta sono raccolti direttamente da Stripe; Attracco riceve solo l&apos;esito e gli
            identificativi della transazione.
          </p>
          <p>
            <strong>Sicurezza.</strong> Indirizzo IP e log tecnici, per prevenire abusi e frodi e garantire la sicurezza del sito (art. 6.1.f).
          </p>
          <h2>3. Destinatari</h2>
          <p>
            Il Fornitore che eroga il servizio prenotato, titolare autonomo per l&apos;esecuzione del contratto; Stripe [entità da confermare],
            per i pagamenti, [titolare autonomo / responsabile — verificare qualificazione nei termini Stripe]; Anthropic [entità da confermare],
            fornitore del modello AI del concierge, responsabile del trattamento; [hosting: fornitore e region da confermare]; [database: fornitore
            e region da confermare]; consulenti e autorità ove previsto dalla legge. I responsabili sono vincolati da accordo ex art. 28 GDPR.
          </p>
          <h2>4. Trasferimenti fuori dallo Spazio economico europeo</h2>
          <p>
            Alcuni fornitori (es. per il modello AI e i pagamenti) possono trattare dati negli Stati Uniti. Il trasferimento avviene sulla base
            della decisione di adeguatezza EU-US Data Privacy Framework, per i fornitori certificati, o di clausole contrattuali tipo della
            Commissione europea. [Verificare per ciascun fornitore la certificazione DPF e/o le SCC sottoscritte.]
          </p>
          <h2>5. Conservazione</h2>
          <p>
            Dati di prenotazione: [n.] mesi dopo la data del servizio, poi anonimizzati; documentazione contabile: 10 anni (art. 2220 c.c.);
            allergie e intolleranze: 7 giorni dopo il servizio; log di sicurezza: [n.] giorni; conversazioni con il concierge: non conservate da
            Attracco, conservate dal fornitore del modello per [periodo da verificare nei termini commerciali del fornitore] ai soli fini di
            sicurezza e prevenzione abusi.
          </p>
          <h2>6. Decisioni automatizzate</h2>
          <p>
            Il concierge AI fornisce suggerimenti; non adotta decisioni che producono effetti giuridici nei tuoi confronti. Ogni prenotazione è
            confermata o rifiutata dal Fornitore.
          </p>
          <h2>7. I tuoi diritti</h2>
          <p>
            Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti al trattamento basato sul legittimo interesse (artt.
            15-22 GDPR) scrivendo a {OPERATOR.privacyEmail}. Hai diritto di proporre reclamo al Garante per la protezione dei dati personali
            (www.garanteprivacy.it) o all&apos;autorità del tuo Stato di residenza.
          </p>
          <h2>8. Minori</h2>
          <p>Il servizio di prenotazione è riservato ai maggiorenni.</p>
        </>
      }
      en={
        <>
          <h1>Privacy notice</h1>
          <p>Under Articles 13 and 14 of Regulation (EU) 2016/679 (&quot;GDPR&quot;).</p>
          <h2>1. Controller</h2>
          <p>
            {OPERATOR.name}, {OPERATOR.registeredOffice}, VAT {OPERATOR.vatNumber}. Privacy contact: {OPERATOR.privacyEmail}.
          </p>
          <h2>2. Data, purposes and legal bases</h2>
          <p>
            <strong>Booking.</strong> Name, email, phone, pick-up address (transfers), date, location, number of guests and notes: to handle your
            request and the contract with the Provider (Art. 6(1)(b)) and to meet accounting and tax obligations (Art. 6(1)(c)).
          </p>
          <p>
            <strong>Allergies and intolerances.</strong> Optional, chef services only: this is health data, processed only with your explicit
            consent (Art. 9(2)(a)), shared only with the chef and deleted 7 days after the service. You can withdraw consent at any time by writing
            to {OPERATOR.privacyEmail}.
          </p>
          <p>
            <strong>AI concierge chat.</strong> Your messages are sent to the AI model provider to generate replies, as pre-contractual steps you
            requested (Art. 6(1)(b)) and in our legitimate interest in offering assistance (Art. 6(1)(f)). Attracco does not store conversations:
            the history stays in your browser until you close the page. Please don&apos;t share personal or health data in the chat.
          </p>
          <p>
            <strong>Payment.</strong> Card data is collected directly by Stripe; Attracco only receives the outcome and transaction identifiers.
          </p>
          <p>
            <strong>Security.</strong> IP address and technical logs, to prevent abuse and fraud (Art. 6(1)(f)).
          </p>
          <h2>3. Recipients</h2>
          <p>
            The Provider performing the booked service (independent controller); Stripe (payments); Anthropic (AI model provider for the
            concierge, processor); our hosting and database providers; advisers and authorities where required by law. Processors are bound by Art.
            28 GDPR agreements.
          </p>
          <h2>4. Transfers outside the EEA</h2>
          <p>
            Some providers may process data in the United States, under the EU-US Data Privacy Framework adequacy decision for certified providers
            or European Commission standard contractual clauses.
          </p>
          <h2>5. Retention</h2>
          <p>
            Booking data: [n.] months after the service date, then anonymised; accounting records: 10 years; allergies: 7 days after the service;
            security logs: [n.] days; concierge chats: not stored by Attracco.
          </p>
          <h2>6. Automated decisions</h2>
          <p>The AI concierge only makes suggestions; every booking is confirmed or declined by the Provider.</p>
          <h2>7. Your rights</h2>
          <p>
            You can request access, rectification, erasure, restriction, portability and object to processing based on legitimate interest
            (Arts. 15-22 GDPR) by writing to {OPERATOR.privacyEmail}. You may lodge a complaint with the Italian Data Protection Authority
            (www.garanteprivacy.it) or the authority of your country of residence.
          </p>
          <h2>8. Minors</h2>
          <p>Bookings are reserved for adults.</p>
        </>
      }
    />
  );
}
