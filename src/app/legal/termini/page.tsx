import Link from "next/link";
import { LegalDoc } from "@/components/LegalDoc";
import { OPERATOR, TERMS_VERSION } from "@/lib/legal";

export const metadata = { title: "Termini e condizioni — Attracco" };

export default function Terms() {
  return (
    <LegalDoc
      version={TERMS_VERSION}
      it={
        <>
          <h1>Termini e condizioni d&apos;uso e di prenotazione</h1>
          <h2>1. Chi siamo e ruolo di Attracco</h2>
          <p>
            Il sito attracco.app è gestito da {OPERATOR.name}, P.IVA {OPERATOR.vatNumber}, sede {OPERATOR.registeredOffice} (&laquo;Attracco&raquo;).
            Attracco gestisce un mercato online che mette in contatto i turisti (&laquo;Cliente&raquo;) con professionisti indipendenti
            (&laquo;Fornitori&raquo;) che offrono in Puglia servizi di chef privato, noleggio con conducente (NCC) ed esperienze in barca a vela.
          </p>
          <p>
            Il contratto per l&apos;erogazione del servizio è concluso direttamente tra Cliente e Fornitore, che ne è l&apos;unico responsabile.
            Per ogni servizio sono indicati identità, partita IVA e abilitazioni del Fornitore. Attracco non è parte del contratto di servizio, non
            è un&apos;agenzia di viaggio e non vende pacchetti turistici né servizi turistici collegati: ogni servizio è prenotato e pagato
            separatamente.
          </p>
          <h2>2. Il concierge AI</h2>
          <p>
            Il sito offre un assistente basato su intelligenza artificiale che aiuta a scegliere i servizi (vedi{" "}
            <Link href="/legal/concierge-ai">Concierge AI</Link>). Le sue risposte hanno carattere informativo: fanno fede esclusivamente il prezzo
            e le condizioni mostrati nella scheda del servizio e nel riepilogo di prenotazione.
          </p>
          <h2>3. Prenotazione e conclusione del contratto</h2>
          <p>
            Compilando il modulo e autorizzando il pagamento, il Cliente invia una richiesta di prenotazione vincolante. L&apos;importo è
            pre-autorizzato sulla carta ma non addebitato. Il Fornitore conferma o rifiuta entro 48 ore: con la conferma il contratto si
            intende concluso e l&apos;importo è addebitato; in caso di rifiuto o mancata risposta la pre-autorizzazione è annullata senza costi.
            La conferma è comunicata via email.
          </p>
          <h2>4. Prezzi</h2>
          <p>
            I prezzi sono espressi in euro e sono finali per il Cliente, comprensivi di IVA ove dovuta e di ogni onere. Non sono applicati costi
            aggiuntivi da Attracco al Cliente. Attracco riceve dal Fornitore una commissione sul prezzo del servizio. [Verificare: regime IVA della
            commissione e del servizio per ciascun Fornitore.]
          </p>
          <h2>5. Pagamento</h2>
          <p>
            I pagamenti sono gestiti da Stripe Payments Europe Ltd. [verificare entità Stripe contraente], prestatore di servizi di pagamento
            autorizzato, tramite pagina di pagamento sicura con autenticazione forte del cliente. Attracco non riceve né conserva i dati della
            carta. L&apos;importo è accreditato al Fornitore al netto della commissione di Attracco.
          </p>
          <h2>6. Cancellazione e modifiche</h2>
          <p>
            Ciascun servizio indica nella propria scheda le condizioni di cancellazione da parte del Cliente, che si applicano a seguito della
            conferma. Se il Fornitore annulla un servizio confermato, il Cliente ha diritto al rimborso integrale. Per le uscite in barca a vela lo
            skipper può annullare o riprogrammare l&apos;uscita per ragioni di sicurezza o meteo: in tal caso il Cliente sceglie tra nuova data e
            rimborso integrale. Le richieste di cancellazione vanno inviate a {OPERATOR.email} indicando il codice di prenotazione.
          </p>
          <h2>7. Diritto di recesso</h2>
          <p>
            Trattandosi di servizi riguardanti le attività del tempo libero da prestare in una data o in un periodo determinati, il diritto di
            recesso di 14 giorni previsto dal Codice del Consumo non si applica (art. 59, comma 1, lett. n), D.Lgs. 206/2005). Per i servizi di
            trasporto passeggeri (NCC) la disciplina del recesso non si applica in base all&apos;art. 47 del Codice del Consumo. [Da verificare
            sulla fonte primaria per ciascuna categoria di servizio, in particolare per le cooking class.] Restano ferme le condizioni di
            cancellazione del punto 6.
          </p>
          <h2>8. Obblighi del Cliente</h2>
          <p>
            Il Cliente deve essere maggiorenne, fornire dati veritieri e comunicare per tempo eventuali esigenze (es. allergie, mobilità ridotta,
            bagagli voluminosi). Per i servizi di chef privato, il Cliente mette a disposizione una cucina funzionante.
          </p>
          <h2>9. Responsabilità</h2>
          <p>
            Il Fornitore risponde dell&apos;esecuzione del servizio e del possesso di licenze, abilitazioni e assicurazioni richieste. Attracco
            verifica in fase di selezione la documentazione dei Fornitori [descrivere la procedura di verifica] e risponde del corretto
            funzionamento della piattaforma e della gestione della prenotazione. Nessuna clausola delle presenti condizioni esclude o limita la
            responsabilità per dolo o colpa grave, per danni alla persona o i diritti riconosciuti al consumatore da norme inderogabili.
          </p>
          <h2>10. Recensioni e contenuti</h2>
          <p>
            [Se saranno introdotte recensioni: indicare come se ne verifica la provenienza da clienti che hanno effettivamente fruito del
            servizio.] Chiunque può segnalare contenuti illegali presenti sul sito scrivendo a {OPERATOR.email}.
          </p>
          <h2>11. Reclami e risoluzione delle controversie</h2>
          <p>
            I reclami possono essere inviati a {OPERATOR.email}; rispondiamo entro [n.] giorni. Il Cliente consumatore può ricorrere a un
            organismo di risoluzione alternativa delle controversie (ADR) [indicare l&apos;organismo eventualmente scelto].
          </p>
          <h2>12. Legge applicabile e foro</h2>
          <p>
            Le presenti condizioni sono regolate dalla legge italiana. Se il Cliente è un consumatore residente in un altro Stato, conserva la
            protezione delle norme imperative del proprio Stato di residenza (art. 6 Reg. CE 593/2008). Per le controversie con consumatori è
            competente il giudice del luogo di residenza o domicilio del consumatore, fatte salve le regole del Reg. UE 1215/2012.
          </p>
        </>
      }
      en={
        <>
          <h1>Terms of use and booking</h1>
          <h2>1. Who we are and Attracco&apos;s role</h2>
          <p>
            attracco.app is operated by {OPERATOR.name}, VAT {OPERATOR.vatNumber}, registered office {OPERATOR.registeredOffice}
            (&quot;Attracco&quot;). Attracco runs an online marketplace connecting tourists (&quot;Customer&quot;) with independent professionals
            (&quot;Providers&quot;) offering private chef, chauffeur-driven hire (NCC) and sailing services in Puglia, Italy.
          </p>
          <p>
            The service contract is concluded directly between Customer and Provider, who is solely responsible for it. Each service shows the
            Provider&apos;s identity, VAT number and licences. Attracco is not a party to the service contract, is not a travel agency and does not
            sell package travel or linked travel arrangements: each service is booked and paid for separately.
          </p>
          <h2>2. The AI concierge</h2>
          <p>
            The site offers an artificial intelligence assistant to help you choose services (see <Link href="/legal/concierge-ai">AI concierge</Link>).
            Its answers are for information only: only the price and terms shown on the service page and booking summary apply.
          </p>
          <h2>3. Booking and conclusion of the contract</h2>
          <p>
            By submitting the form and authorising payment, the Customer sends a binding booking request. The amount is pre-authorised on the card
            but not charged. The Provider confirms or declines within 48 hours: on confirmation the contract is concluded and the card is charged;
            if declined or unanswered, the authorisation is released at no cost. Confirmation is sent by email.
          </p>
          <h2>4. Prices</h2>
          <p>
            Prices are in euro and final, including VAT where applicable and all charges. Attracco charges the Customer no extra fees. Attracco
            receives a commission from the Provider.
          </p>
          <h2>5. Payment</h2>
          <p>
            Payments are processed by Stripe, a licensed payment service provider, on a secure page with strong customer authentication. Attracco
            never receives or stores card data. The amount is paid to the Provider minus Attracco&apos;s commission.
          </p>
          <h2>6. Cancellations and changes</h2>
          <p>
            Each service page states the Customer cancellation terms that apply after confirmation. If the Provider cancels a confirmed service, the
            Customer is fully refunded. For sailing trips the skipper may cancel or reschedule for safety or weather reasons; the Customer then
            chooses between a new date and a full refund. Send cancellation requests to {OPERATOR.email} quoting your booking reference.
          </p>
          <h2>7. Right of withdrawal</h2>
          <p>
            As these are leisure services to be provided on a specific date or period, the 14-day right of withdrawal does not apply (Art. 59(1)(n)
            Italian Consumer Code; Art. 16(l) Directive 2011/83/EU). For passenger transport services (NCC) withdrawal rules do not apply (Art. 47
            Italian Consumer Code). The cancellation terms in section 6 still apply.
          </p>
          <h2>8. Customer obligations</h2>
          <p>
            Customers must be at least 18, provide accurate details and inform the Provider in good time of any needs (e.g. allergies, reduced
            mobility, bulky luggage). For private chef services, the Customer provides a working kitchen.
          </p>
          <h2>9. Liability</h2>
          <p>
            The Provider is liable for performing the service and for holding the required licences and insurance. Attracco checks Providers&apos;
            documents when onboarding them and is liable for the platform and booking handling. Nothing in these terms excludes or limits liability
            for wilful misconduct or gross negligence, personal injury, or consumer rights under mandatory law.
          </p>
          <h2>10. Reviews and content</h2>
          <p>Anyone can report illegal content on the site by writing to {OPERATOR.email}.</p>
          <h2>11. Complaints and disputes</h2>
          <p>
            Send complaints to {OPERATOR.email}; we reply within [n.] days. Consumers may refer disputes to an alternative dispute resolution (ADR)
            body [name the chosen ADR body, if any].
          </p>
          <h2>12. Governing law and jurisdiction</h2>
          <p>
            These terms are governed by Italian law. Consumers resident in another country keep the protection of the mandatory rules of their
            country of residence (Art. 6 Rome I Regulation). Consumers may bring proceedings in the courts of their place of residence, subject to
            Regulation (EU) 1215/2012.
          </p>
        </>
      }
    />
  );
}
