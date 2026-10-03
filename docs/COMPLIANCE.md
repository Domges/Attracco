# Attracco — mappa di conformità (prima versione)

Documento di lavoro per la validazione legale. Descrive le scelte di progettazione adottate nel codice e i punti che restano da verificare o completare. I riferimenti normativi sono indicati per orientamento e vanno verificati sulla fonte primaria (Normattiva, EUR-Lex, Gazzetta Ufficiale) prima del go-live; alcuni testi possono essere stati modificati di recente.

**Assunzione sulla legge applicabile.** Il gestore della piattaforma e i fornitori sono stabiliti in Italia e i servizi sono eseguiti in Puglia; i clienti sono consumatori residenti in Italia, in altri Stati UE o extra-UE. Le condizioni scelgono la legge italiana, ma per i consumatori residenti in altri Stati restano applicabili le norme imperative dello Stato di residenza nei limiti dell'art. 6, par. 2, Reg. (CE) 593/2008 (Roma I), quando il professionista dirige l'attività verso quello Stato (sito in inglese, pagamento in euro da clienti esteri: il requisito andrà valutato). GDPR, AI Act e DSA si applicano in quanto il titolare e la piattaforma sono stabiliti nell'UE, indipendentemente dalla legge scelta dalle parti.

## 1. Qualificazione della piattaforma e struttura contrattuale

Il modello è quello del **marketplace**: il contratto di servizio è concluso tra cliente e fornitore; Attracco gestisce la piattaforma e incassa una commissione dal fornitore. Nel codice questo si traduce in tre scelte. La prima: ogni scheda servizio espone identità, P.IVA, abilitazioni e polizza del fornitore e dichiara che il fornitore è un professionista (obbligo informativo per i mercati online introdotto dalla direttiva Omnibus, art. 49-bis Cod. Consumo; tracciabilità degli operatori commerciali ex art. 30 DSA). La seconda: il pagamento è una destination charge Stripe Connect con `on_behalf_of` impostato sul fornitore, così che il fornitore risulti merchant of record e il denaro non transiti su conti di Attracco. La terza: ogni servizio è prenotato e pagato con un checkout separato.

Il punto da validare con priorità è il **Codice del Turismo** (D.Lgs. 79/2011, artt. 32 ss., come modificato dal D.Lgs. 62/2018 di recepimento della dir. (UE) 2015/2302). Il transfer NCC è un servizio di trasporto passeggeri; chef e uscite in barca possono essere "altri servizi turistici". Se il cliente acquista sulla stessa piattaforma un transfer e un'esperienza, occorre escludere che la combinazione configuri un pacchetto turistico o un servizio turistico collegato, ipotesi che richiederebbe requisiti da agenzia di viaggio, garanzia per l'insolvenza e informative standard. La scelta dei checkout separati e dell'assenza di prezzo combinato riduce il rischio ma non lo elimina per definizione, perché la nozione di servizio turistico collegato guarda anche alla facilitazione dell'acquisto mirato di un ulteriore servizio entro 24 ore. Il concierge è istruito a non presentare offerte combinate; resta da decidere se limitare tecnicamente l'acquisto di più categorie in finestra ravvicinata o se strutturarsi per gestirle.

Dal lato pagamenti, la struttura Stripe Connect fa sì che i fondi siano detenuti e trasferiti dal PSP autorizzato; Attracco non presta servizi di pagamento e non è soggetto obbligato antiriciclaggio in quanto tale. La verifica KYC dei fornitori è svolta da Stripe sugli account connessi. Da verificare: contratto Stripe Connect (entità contraente, ripartizione delle responsabilità su chargeback, rimborsi e obblighi DAC7 di comunicazione dei venditori, che Stripe non assolve per conto della piattaforma).

## 2. Tutela del consumatore

Le informazioni precontrattuali (art. 49 Cod. Consumo) sono rese nella scheda servizio e nel riepilogo: identità del fornitore, caratteristiche, prezzo finale comprensivo di imposte, condizioni di cancellazione, modalità di pagamento, durata. Il prezzo mostrato in chat è sempre quello calcolato dal server sul catalogo e il modulo lo ricalcola al momento del pagamento.

Il **diritto di recesso** è escluso per i servizi del tempo libero con data determinata (art. 59, comma 1, lett. n) Cod. Consumo) e il modulo richiede una presa d'atto espressa, registrata con timestamp (`waiver_acknowledged_at`). Per il transfer NCC il riferimento è l'esclusione dei servizi di trasporto passeggeri dall'ambito delle norme sui contratti a distanza (art. 47 Cod. Consumo, in attuazione dell'art. 3, par. 3, lett. k), dir. 2011/83/UE). Da verificare in particolare per le cooking class, dove l'inquadramento come attività del tempo libero appare sostenibile ma andrebbe confermato. Se in futuro fossero offerti servizi con diritto di recesso, andrà implementata la funzione di recesso online introdotta dalla dir. (UE) 2023/2673 [verificare stato del recepimento e data di applicazione].

La pre-autorizzazione con conferma entro 48 ore evita addebiti per servizi poi non disponibili; le condizioni chiariscono che il contratto si conclude con la conferma. Le clausole di responsabilità non escludono dolo, colpa grave e danni alla persona: la disciplina delle clausole vessatorie nei contratti B2C (artt. 33-36 Cod. Consumo) prevale sulla doppia sottoscrizione ex art. 1341 c.c., che non sana la vessatorietà verso il consumatore. Le penali di cancellazione (50% per lo chef dopo 72 ore, ad esempio) vanno valutate come caparra/penale alla luce dell'art. 33, comma 2, lett. e) e f) Cod. Consumo e, per i clienti esteri, delle norme imperative del paese di residenza.

La piattaforma europea ODR non va più indicata: il Reg. (UE) 524/2013 è stato abrogato e la piattaforma dismessa nel 2025 [verificare data esatta e obblighi residui]; nelle condizioni è previsto il rinvio all'eventuale organismo ADR scelto.

## 3. Protezione dei dati personali

Il principio guida è la **minimizzazione**. Il concierge non raccoglie dati personali: il prompt gli vieta di chiederli o ripeterli, le conversazioni non sono salvate lato server (lo storico vive nel browser e viene inviato a ogni messaggio, con limiti di lunghezza) e l'avviso in chat invita a non inserirli. I dati necessari sono raccolti solo dal modulo, con informativa e versioni dei documenti registrate su ogni prenotazione.

Le **allergie e intolleranze** sono dati relativi alla salute (art. 9 GDPR). Il modulo le chiede solo per i servizi di chef, con un consenso esplicito separato; il server rifiuta la richiesta se il campo è compilato senza consenso e il database impone il vincolo con un `CHECK`. Lo script di retention cancella il campo 7 giorni dopo il servizio. Da valutare se lo chef, che riceve il dato, sia titolare autonomo (soluzione adottata nell'informativa) e come gli venga comunicato in sicurezza.

Il fornitore del modello (Anthropic) è inquadrato come **responsabile del trattamento** per i messaggi della chat, con trasferimento verso gli Stati Uniti. Da verificare e documentare: accettazione del DPA commerciale, certificazione Data Privacy Framework e/o SCC, periodo di conservazione dei dati API e assenza di uso per l'addestramento secondo i termini commerciali vigenti, eventuale disponibilità di elaborazione in UE. Lo stesso esercizio va fatto per hosting, database e Stripe (che per alcune attività opera come titolare autonomo). Va redatto il registro dei trattamenti (art. 30) e valutata la necessità di una DPIA: il trattamento di dati sanitari non è su larga scala, ma l'uso di un sistema AI e i trasferimenti extra-UE meritano almeno una valutazione documentata.

I cookie sono solo tecnici (preferenza di lingua in `localStorage`), per cui non serve un banner; l'introduzione di analytics richiederà consenso preventivo.

## 4. Intelligenza artificiale

Il concierge è un sistema che interagisce direttamente con persone fisiche: l'art. 50, par. 1, Reg. (UE) 2024/1689 impone di informarle che interagiscono con un sistema AI. L'informazione è resa in chat prima del primo messaggio, nel messaggio di benvenuto, nella pagina dedicata `/legal/concierge-ai`, e il modello è istruito a dichiararsi AI se interrogato. L'uso (assistenza alla scelta di servizi turistici) non rientra nei casi ad alto rischio dell'Allegato III. Da verificare: data di applicazione dell'art. 50 alla luce delle proposte di semplificazione (cosiddetto Digital Omnibus) e la disciplina nazionale della L. 132/2025; obbligo di alfabetizzazione AI del personale (art. 4 AI Act).

Le salvaguardie tecniche sono parte della conformità: i tool sono in sola lettura sul catalogo; il modello non può creare prenotazioni, fissare prezzi o accedere a dati personali; ogni prenotazione è confermata da una persona; i messaggi dell'utente sono trattati come richieste e non come istruzioni (mitigazione del prompt injection); limiti di frequenza e di lunghezza contengono abusi e costi.

## 5. Requisiti di settore dei fornitori

Questi requisiti non sono verificabili dal codice e vanno gestiti in fase di onboarding contrattuale dei fornitori. Per il **NCC** (L. 21/1992 e successive modifiche, incluso il regime del foglio di servizio elettronico e gli obblighi relativi alla rimessa) occorre acquisire autorizzazione comunale, iscrizione al ruolo dei conducenti e polizza RCA per trasporto di persone; da verificare la compatibilità del modello di prenotazione (prezzo fisso concordato, partenza dalla rimessa) con le norme vigenti, oggetto di interventi legislativi e giurisprudenziali recenti. Per la **nautica** (D.Lgs. 171/2005, Codice della nautica da diporto) occorrono unità abilitata al noleggio, skipper con titolo idoneo e copertura assicurativa; va chiarito se il contratto sia noleggio o locazione, perché cambia l'allocazione delle responsabilità. Per lo **chef** a domicilio, formazione sull'igiene alimentare e gestione degli allergeni (Reg. (CE) 852/2004, Reg. (UE) 1169/2011) e inquadramento fiscale e amministrativo dell'attività (eventuale SCIA) [da verificare con il Comune].

Il contratto di adesione dei fornitori (P2B) dovrebbe coprire: commissioni, criteri di posizionamento nel catalogo e nelle risposte del concierge (Reg. (UE) 2019/1150), obblighi di conferma entro 48 ore, manleva per mancanza di titoli abilitativi, gestione dei dati dei clienti, obblighi DAC7.

## 6. Immagini

Il sito usa fotografie scaricate da Wikimedia Commons (`public/images/photos/`, elenco e licenze in `src/data/photo-credits.json`) e, come riserva, illustrazioni originali realizzate per Attracco (`public/images/illustrations/`), prive di diritti di terzi. Le otto foto attuali sono in pubblico dominio, CC BY o CC BY-SA, non ritraggono persone riconoscibili e non hanno beni culturali come soggetto principale (panorami di Polignano, Ostuni e Gallipoli, campagna con trulli e ulivi, piatti di orecchiette); la verifica è stata fatta visivamente su ciascuna immagine e va confermata da te prima della pubblicazione. Le fotografie si sostituiscono o si aggiungono indicando in `images.sources.json` il file di Wikimedia Commons e lanciando `npm run images:fetch`: lo script accetta solo pubblico dominio, CC0, CC BY e CC BY-SA, scarta i file con restrizioni non di copyright segnalate da Commons (diritti della personalità, marchi) e registra autore, licenza e fonte. Il sito pubblica l'attribuzione sotto la foto e nella pagina «Crediti immagini». Per le CC BY-SA lo share-alike riguarda la sola immagine eventualmente modificata, non il sito; ridimensionamento e ritaglio sono dichiarati nella pagina crediti.

Restano tre profili da valutare caso per caso, indipendentemente dalla licenza d'autore. Le persone riconoscibili richiedono il consenso alla diffusione del ritratto (artt. 96-97 L. 633/1941) e, per uso promozionale, la licenza Commons non basta. I beni culturali pubblici (ad esempio Castel del Monte, castelli e musei statali) sono soggetti, per la riproduzione a fini commerciali, alla concessione e ai canoni degli artt. 107-108 D.Lgs. 42/2004, con un orientamento giurisprudenziale recente restrittivo [verificare]: è preferibile scegliere paesaggi, borghi e mare, evitando beni culturali come soggetto principale. In Italia non è riconosciuta una libertà di panorama generale per opere protette, per cui vanno evitate opere d'arte o architetture contemporanee in primo piano. In alternativa a Commons si possono usare foto commissionate a un fotografo locale con cessione dei diritti per uso commerciale e web, che è la soluzione più pulita per un sito promozionale.

## 7. Onboarding dei fornitori

La procedura è descritta in `docs/ONBOARDING_FORNITORI.md`. Le scelte con rilievo giuridico sono cinque.

Le **Condizioni per i fornitori** (`/legal/fornitori`) sono strutturate sugli obblighi del Reg. (UE) 2019/1150: disponibilità prima dell'adesione, parametri di posizionamento (incluso il concierge AI), assenza di trattamento differenziato, motivazione delle limitazioni e sospensioni con effetto immediato, preavviso di 30 giorni per la cessazione da parte della piattaforma, preavviso di 15 giorni per le modifiche, accesso ai dati, gestione dei reclami e mediazione. I riferimenti agli articoli del regolamento sono omessi nel testo e vanno verificati sulla fonte primaria; per reclami interni e mediazione (artt. 11-12) va verificato se Attracco rientri nell'esenzione per le piccole imprese, ferma la scelta di offrirli comunque. La clausola di non aggiramento è tra parentesi quadre: portata e durata vanno valutate anche sotto il profilo antitrust.

L'**approvazione specifica ex artt. 1341-1342 c.c.** è raccolta con una seconda spunta separata, registrando versione, firmatario, data e IP. La sufficienza della doppia spunta online per le clausole vessatorie è oggetto di orientamenti giurisprudenziali non uniformi (alcuni richiedono la firma elettronica qualificata o avanzata) [verificare]; se si vuole maggiore certezza, le clausole più rilevanti (foro, limitazione di responsabilità, recesso e sospensione) possono essere fatte sottoscrivere con firma digitale in un documento separato.

I **dati DAC7** (codice fiscale, P.IVA, REA, sede, data di nascita per le persone fisiche) sono raccolti nell'onboarding; resta da verificare l'identificativo del conto finanziario (IBAN), che Attracco non riceve perché raccolto da Stripe, il regime dei solleciti prima della sospensione e i termini di conservazione [verificare D.Lgs. 32/2023 e provvedimenti attuativi].

I **documenti abilitativi** sono conservati nel database (region UE) per non aggiungere un ulteriore responsabile; contengono dati personali di terzi (conducenti, skipper), da qui l'impegno informativo nell'informativa fornitori. Le copie dei documenti d'identità non sono richieste: la verifica KYC è svolta da Stripe.

Per **Stripe Connect** gli account sono Express con `losses.payments = application`: la piattaforma risponde verso Stripe dei saldi negativi dei fornitori (contestazioni, rimborsi non coperti), da qui il diritto di rivalsa e compensazione nelle condizioni. Con le destination charge l'addebito avviene sull'account della piattaforma e i fondi sono trasferiti al fornitore: va verificato, alla luce della struttura contrattuale Stripe, che il flusso non configuri la detenzione di fondi per conto terzi da parte di Attracco e, in subordine, l'applicabilità dell'esclusione dell'agente commerciale (art. 3, lett. b) PSD2, come recepita nell'ordinamento italiano) [verificare]. Un'alternativa che elimina il dubbio sono le direct charge sull'account del fornitore, con l'effetto di trasferire al fornitore costi e contestazioni.

## 8. Checklist operativa prima del go-live

- [ ] Completare i dati del gestore in `src/lib/legal.ts` (ragione sociale, P.IVA, REA, PEC, email privacy)
- [ ] Completare i dati reali di ciascun fornitore e servizio in `src/data/catalog.ts` (ragione sociale, P.IVA, licenze, polizze, prezzi IVA inclusa)
- [ ] Parere sulla qualificazione ai sensi del Codice del Turismo (pacchetti / servizi turistici collegati)
- [ ] Verifica esclusione del recesso per ciascuna categoria (art. 59 lett. n e art. 47 Cod. Consumo)
- [ ] Validare le penali di cancellazione per servizio
- [ ] Scegliere l'organismo ADR e aggiornare il punto 11 dei Termini
- [ ] DPA e meccanismi di trasferimento con Anthropic, Stripe, hosting e database; verificare retention dei dati API
- [ ] Registro dei trattamenti e valutazione documentata sulla DPIA
- [ ] Definire `RETENTION_MONTHS` e i tempi di conservazione dei log; schedulare `scripts/retention.mjs`
- [ ] Contratto fornitori (P2B, manleve, DAC7) e procedura di verifica documentale in onboarding
- [ ] Verificare art. 50 AI Act (tempistiche) e L. 132/2025
- [ ] Verificare entità Stripe contraente e termini Connect; attivare ricevute email
- [ ] Traduzione inglese dei testi legali rivista da un professionista
- [ ] Scegliere le foto (Commons o fotografo con cessione diritti) e verificare persone, beni culturali e opere protette
- [ ] Aggiornare `TERMS_VERSION` / `PRIVACY_VERSION` a ogni modifica dei testi
- [ ] Validare Condizioni e informativa per i fornitori, elenco documentale per categoria, commissione e foro; poi `PROVIDER_DOCS_DRAFT = false`
- [ ] Verificare la qualificazione del flusso destination charge (PSD2) e la responsabilità per saldi negativi degli account Express
- [ ] Verificare la validità dell'approvazione specifica online ex art. 1341 c.c. o prevedere la firma digitale
- [ ] Definire `PROVIDER_APPLICATION_RETENTION_MONTHS` e `PROVIDER_RETENTION_MONTHS`
