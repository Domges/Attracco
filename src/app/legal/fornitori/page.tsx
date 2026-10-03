import Link from "next/link";
import { ProviderLegalDoc } from "@/components/ProviderLegalDoc";
import { OPERATOR, PROVIDER_FEE_TEXT, PROVIDER_FORUM, PROVIDER_TERMS_VERSION } from "@/lib/legal";

export const metadata = { title: "Condizioni per i fornitori — Attracco" };

// Condizioni generali di adesione dei fornitori (rapporto B2B). Struttura
// predisposta per gli obblighi informativi del Reg. (UE) 2019/1150 (P2B).
// BOZZA: il testo va validato prima dell'uso; i riferimenti normativi vanno
// verificati sulla fonte primaria.
export default function ProviderTerms() {
  return (
    <ProviderLegalDoc version={PROVIDER_TERMS_VERSION}>
      <h1>Condizioni per i fornitori</h1>
      <p>
        Le presenti condizioni regolano l&apos;adesione dei professionisti (&laquo;Fornitori&raquo;) alla piattaforma Attracco, gestita da{" "}
        {OPERATOR.name}, con sede in {OPERATOR.registeredOffice}, P.IVA {OPERATOR.vatNumber}, PEC {OPERATOR.pec} (&laquo;Attracco&raquo;).
        Sono rese disponibili al Fornitore prima dell&apos;adesione e restano consultabili in qualsiasi momento a questo indirizzo.
      </p>

      <h2>1. Definizioni</h2>
      <p>
        <strong>Piattaforma</strong>: il sito attracco.app, il concierge AI e il back-office. <strong>Cliente</strong>: il turista che
        prenota un Servizio. <strong>Servizio</strong>: la prestazione offerta dal Fornitore tramite la Piattaforma (servizio di chef a
        domicilio, noleggio con conducente, uscita in barca). <strong>Scheda</strong>: la descrizione del Servizio pubblicata sulla
        Piattaforma. <strong>Concierge</strong>: l&apos;assistente basato su intelligenza artificiale che aiuta il Cliente a scegliere i Servizi.
      </p>

      <h2>2. Natura del rapporto</h2>
      <p>
        Attracco presta al Fornitore un servizio di intermediazione online: promuove i Servizi, raccoglie le richieste di prenotazione e
        mette a disposizione il sistema di pagamento descritto all&apos;art. 7. Il contratto per l&apos;esecuzione del Servizio è concluso
        direttamente tra Cliente e Fornitore, che ne è l&apos;unica controparte e il venditore. Attracco non è parte di quel contratto, non
        organizza né vende pacchetti turistici e non agisce come agente, mandatario o rappresentante del Fornitore, salvo quanto
        previsto all&apos;art. 7 per la gestione dei pagamenti. Il rapporto non crea vincoli di subordinazione, esclusiva o società.
      </p>

      <h2>3. Requisiti e documenti</h2>
      <p>
        Il Fornitore dichiara e garantisce di agire come professionista o impresa, di possedere e mantenere per tutta la durata del
        rapporto i titoli abilitativi, le autorizzazioni, le iscrizioni e le coperture assicurative richiesti dalla normativa per i Servizi
        offerti, e di caricare sulla Piattaforma la documentazione richiesta, aggiornandola prima di ogni scadenza. La verifica
        documentale svolta da Attracco è finalizzata alla pubblicazione e non sostituisce né attenua la responsabilità del Fornitore per il
        possesso dei requisiti. Il Fornitore comunica senza ritardo ogni variazione, sospensione o revoca dei titoli.
      </p>

      <h2>4. Schede e contenuti</h2>
      <p>
        Le Schede sono redatte da Attracco sulla base delle informazioni del Fornitore e pubblicate solo dopo la sua approvazione. Il
        Fornitore determina il prezzo finale al Cliente, comprensivo di IVA e di ogni onere, le località servite, gli orari, la stagione e la
        politica di cancellazione, ed è responsabile della correttezza e completezza delle informazioni. Attracco può adattare la
        presentazione delle Schede (lingua, formato, traduzione) senza modificarne le condizioni economiche e contrattuali. Il Fornitore
        concede ad Attracco, per la durata del rapporto e per i soli fini della Piattaforma e della sua promozione, una licenza non
        esclusiva e gratuita sui contenuti forniti (testi, fotografie, marchi), garantendo di avere i diritti necessari, compresi i
        consensi delle persone ritratte.
      </p>

      <h2>5. Posizionamento e Concierge</h2>
      <p>
        I Servizi sono mostrati ai Clienti in base alla corrispondenza con la richiesta: categoria, località, data e stagione, orario e
        numero di ospiti. A parità di corrispondenza, l&apos;ordine è quello del catalogo [criterio di ordinamento da definire, es.
        data di pubblicazione o rotazione]. Il Concierge consulta il catalogo con gli stessi criteri e non riceve informazioni sulla
        commissione applicata. Non è previsto alcun posizionamento a pagamento; se in futuro fosse introdotto, sarà indicato in queste
        condizioni con le relative modalità. Attracco non offre Servizi propri in concorrenza con quelli dei Fornitori.
      </p>

      <h2>6. Prenotazioni</h2>
      <p>
        Il Cliente invia la richiesta e pre-autorizza il pagamento. Il Fornitore conferma o rifiuta tramite Attracco entro 48 ore e comunque
        prima della data del Servizio; il contratto con il Cliente si conclude con la conferma, che comporta l&apos;addebito. Il Fornitore si
        obbliga a eseguire i Servizi confermati personalmente o con proprio personale qualificato, nel rispetto della Scheda. Se non può
        eseguire un Servizio confermato, avvisa immediatamente Attracco e il Cliente; il Cliente è rimborsato integralmente e il Fornitore
        tiene indenne Attracco dai costi sostenuti. Le cancellazioni del Cliente sono regolate dalla politica indicata nella Scheda.
      </p>

      <h2>7. Corrispettivi e pagamenti</h2>
      <p>
        Per l&apos;intermediazione il Fornitore riconosce ad Attracco una commissione pari al {PROVIDER_FEE_TEXT}, oltre IVA se dovuta. Non
        sono previsti canoni di adesione. I pagamenti dei Clienti sono elaborati da Stripe [entità da confermare], prestatore di servizi
        di pagamento autorizzato, tramite l&apos;account Stripe del Fornitore, che accetta i termini contrattuali di Stripe per gli account
        connessi. La commissione è trattenuta al momento dell&apos;addebito e il residuo è accreditato al Fornitore secondo i tempi di
        Stripe. In caso di rimborso al Cliente l&apos;importo è stornato dal Fornitore e la commissione è restituita in proporzione.
        Attracco emette fattura per le commissioni [periodicità da definire]; il Fornitore emette verso il Cliente il documento fiscale
        dovuto per il Servizio.
      </p>
      <p>
        Le contestazioni di pagamento (chargeback) relative a Servizi non eseguiti o non conformi sono a carico del Fornitore. Attracco, che
        ne risponde verso Stripe, può recuperare gli importi stornando i trasferimenti relativi o compensandoli con trasferimenti
        successivi, dandone comunicazione motivata al Fornitore.
      </p>

      <h2>8. Obblighi del Fornitore</h2>
      <p>
        Il Fornitore esegue i Servizi con la diligenza professionale richiesta e nel rispetto della normativa di settore, tra cui, a
        titolo esemplificativo, le norme sul noleggio con conducente, sulla nautica da diporto, sull&apos;igiene degli alimenti e
        sull&apos;informazione sugli allergeni, nonché delle norme fiscali, previdenziali e di sicurezza. Il Fornitore non utilizza i dati dei
        Clienti ricevuti tramite la Piattaforma per finalità diverse dall&apos;esecuzione del Servizio. [Clausola di non aggiramento:
        per [12] mesi dalla prima prenotazione il Fornitore non conclude direttamente con lo stesso Cliente contratti per Servizi
        analoghi presentati tramite la Piattaforma. Da valutare: portata, durata e compatibilità con il diritto della concorrenza.] Il
        Fornitore resta libero di offrire i propri servizi tramite altri canali e a condizioni diverse.
      </p>

      <h2>9. Dati personali e accesso ai dati</h2>
      <p>
        Attracco e il Fornitore trattano i dati dei Clienti come titolari autonomi, ciascuno per le proprie finalità. Attracco comunica al
        Fornitore i dati necessari a eseguire il Servizio (nome, recapiti, dettagli della prenotazione e, per i servizi di chef, le
        informazioni su allergie e intolleranze fornite con consenso esplicito del Cliente). Il Fornitore li tratta in conformità al
        Regolamento (UE) 2016/679, con misure di sicurezza adeguate, e cancella i dati sanitari subito dopo il Servizio. Il Fornitore ha
        accesso ai dati delle proprie prenotazioni; i dati aggregati sull&apos;uso della Piattaforma restano di Attracco e non sono ceduti
        a terzi. I dati del Fornitore sono trattati secondo l&apos;<Link href="/legal/privacy-fornitori">informativa privacy per i fornitori</Link>.
      </p>

      <h2>10. Obblighi fiscali di comunicazione (DAC7)</h2>
      <p>
        Il Fornitore fornisce e mantiene aggiornati i dati identificativi e fiscali richiesti dalla normativa sullo scambio automatico di
        informazioni relative ai venditori sulle piattaforme digitali (dir. (UE) 2021/514, recepita con D.Lgs. 32/2023 [verificare]) e
        prende atto che Attracco li comunica all&apos;Agenzia delle Entrate insieme ai corrispettivi percepiti. In mancanza dei dati, dopo
        i solleciti previsti dalla normativa, Attracco sospende il Fornitore.
      </p>

      <h2>11. Responsabilità e manleva</h2>
      <p>
        Il Fornitore è l&apos;unico responsabile verso i Clienti e i terzi per l&apos;esecuzione dei Servizi e per i danni a persone e cose.
        Il Fornitore tiene indenne Attracco da ogni pretesa, sanzione, costo o danno, comprese le ragionevoli spese legali, derivante dalla
        mancanza dei requisiti di cui all&apos;art. 3, dalla non conformità dei Servizi, dalla violazione di queste condizioni o della
        normativa applicabile. Attracco risponde del funzionamento della Piattaforma nei limiti del dolo e della colpa grave e non
        garantisce un numero minimo di prenotazioni né la continuità ininterrotta della Piattaforma.
      </p>

      <h2>12. Durata, sospensione e cessazione</h2>
      <p>
        Il rapporto è a tempo indeterminato dall&apos;attivazione del profilo. Il Fornitore può recedere in qualsiasi momento con preavviso
        di [15] giorni, restando obbligato a eseguire i Servizi già confermati. Attracco può recedere con preavviso di almeno 30 giorni,
        comunicando le ragioni su supporto durevole.
      </p>
      <p>
        Attracco può limitare o sospendere la visibilità di uno o più Servizi, o sospendere il Fornitore, con effetto immediato e
        comunicando contestualmente le ragioni su supporto durevole, in caso di: documenti mancanti o scaduti; perdita di un titolo
        abilitativo o della copertura assicurativa; mancata abilitazione dell&apos;account Stripe; ripetute mancate conferme o cancellazioni;
        reclami fondati dei Clienti; mancata comunicazione dei dati di cui all&apos;art. 10; violazioni di legge o di queste condizioni. Il
        Fornitore può chiarire i fatti e chiedere la revoca della misura rispondendo alla comunicazione; Attracco risponde motivatamente.
        In caso di violazioni gravi o di obblighi di legge Attracco può risolvere il rapporto senza preavviso ai sensi dell&apos;art. 1456 c.c.,
        motivando la decisione. Restano salve le prenotazioni già confermate, salvo che la loro esecuzione esponga i Clienti a rischi.
      </p>

      <h2>13. Modifiche delle condizioni</h2>
      <p>
        Attracco comunica le modifiche via email con almeno 15 giorni di preavviso, o con il preavviso più lungo necessario quando il
        Fornitore deve adeguare i propri Servizi. Il Fornitore può recedere prima dell&apos;efficacia della modifica senza oneri. Il preavviso
        non si applica alle modifiche imposte da obblighi di legge o di autorità o necessarie per far fronte a rischi imprevisti per la
        sicurezza della Piattaforma o dei Clienti. Le nuove condizioni sono accettate tramite il link personale del Fornitore.
      </p>

      <h2>14. Reclami e mediazione</h2>
      <p>
        I reclami del Fornitore sono gestiti gratuitamente scrivendo a {OPERATOR.email}; Attracco risponde entro [30] giorni. Per la
        risoluzione stragiudiziale delle controversie le parti possono ricorrere a [organismo di mediazione da indicare], fermo restando il
        diritto di adire l&apos;autorità giudiziaria.
      </p>

      <h2>15. Riservatezza e comunicazioni</h2>
      <p>
        Le parti mantengono riservate le informazioni commerciali dell&apos;altra parte non pubbliche. Le comunicazioni avvengono via email agli
        indirizzi indicati in fase di adesione o via PEC; le comunicazioni del Fornitore ad Attracco vanno inviate a {OPERATOR.email} o{" "}
        {OPERATOR.pec}.
      </p>

      <h2>16. Legge applicabile e foro</h2>
      <p>
        Le presenti condizioni sono regolate dalla legge italiana. Per ogni controversia è competente in via esclusiva il {PROVIDER_FORUM}.
      </p>

      <h2>17. Approvazione specifica</h2>
      <p>
        Ai sensi degli artt. 1341 e 1342 c.c. il Fornitore approva specificamente le seguenti clausole: art. 2 (natura del rapporto); art. 6
        (obblighi di esecuzione e rimborsi); art. 7 (commissione, rimborsi, chargeback e compensazione); art. 8 (non aggiramento); art. 10
        (sospensione per mancata comunicazione dei dati); art. 11 (responsabilità, manleva e limitazione di responsabilità di Attracco); art.
        12 (recesso, sospensione e clausola risolutiva espressa); art. 13 (modifiche delle condizioni); art. 16 (foro esclusivo).
      </p>
    </ProviderLegalDoc>
  );
}
