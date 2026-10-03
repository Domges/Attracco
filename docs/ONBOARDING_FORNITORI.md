# Onboarding dei fornitori — procedura operativa

## Il flusso

1. **Candidatura** — il fornitore compila il modulo su `attracco.app/partner` (categoria, forma giuridica, ragione sociale, P.IVA con controllo formale, sede, referente, zone servite, descrizione dell'offerta, dichiarazione di agire come professionista, presa visione dell'informativa fornitori). La candidatura compare in `/admin/fornitori` con stato «Candidatura ricevuta».
2. **Valutazione** — dalla scheda del fornitore in back-office: «Avvia onboarding» genera un **link personale** valido 30 giorni (mostrato una sola volta, nel database resta solo l'hash) oppure «Non accogliere» con motivazione.
3. **Invio del link** — le email transazionali non sono ancora implementate: il link va copiato e inviato dall'indirizzo di Attracco all'email della candidatura (modello sotto). «Nuovo link onboarding» invalida il precedente.
4. **Area di onboarding del fornitore** (`/partner/onboarding/<token>`), quattro passaggi riprendibili:
   - dati anagrafici e fiscali per contratto e DAC7 (codice fiscale, REA, data di nascita per le persone fisiche, PEC);
   - accettazione delle **Condizioni per i fornitori** con nome e ruolo del firmatario e seconda spunta di **approvazione specifica ex artt. 1341-1342 c.c.**; si registrano versione, data, firmatario e IP;
   - **documenti** per categoria (PDF/JPG/PNG fino a 4 MB, tipo verificato dal contenuto, conservati nel database);
   - **Stripe Connect**: crea l'account Express e apre la procedura Stripe (KYC e IBAN restano su Stripe). Al ritorno lo stato si aggiorna subito e poi via webhook `account.updated`.
5. **Verifica** — in back-office si scarica ogni documento, lo si segna «Verificato» (con data di scadenza per polizze, HACCP, ruolo conducenti, titolo skipper, certificato di sicurezza) oppure «Respingi» con motivo, che il fornitore vede nella sua area.
6. **Collegamento al catalogo** — si associa il fornitore alla voce di `src/data/catalog.ts` (stessa categoria) e si aggiornano lì ragione sociale, P.IVA, sede, abilitazioni e polizza mostrate ai clienti, con le schede dei servizi.
7. **Attivazione** — «Attiva» è possibile solo con la checklist completa: dati, condizioni nella versione vigente, documenti verificati e non scaduti, Stripe abilitato a incassi e bonifici, collegamento al catalogo. Da quel momento le prenotazioni dei suoi servizi usano il suo account Stripe.
8. **Gestione** — «Sospendi» (con motivazione: le prenotazioni dei suoi servizi vengono rifiutate con «provider_unavailable») e «Cessa rapporto». Ogni azione finisce nel registro della scheda.

## Variabili e configurazione

- `npm run db:migrate` crea le nuove tabelle (`providers`, `provider_documents`, `provider_events`); lo schema è idempotente.
- Webhook Stripe: oltre all'endpoint della piattaforma, creare sullo stesso URL `https://attracco.app/api/stripe/webhook` un endpoint **Connect** («eventi degli account connessi») con l'evento `account.updated`, e copiarne il segreto in `STRIPE_CONNECT_WEBHOOK_SECRET`.
- In Stripe, prima di invitare fornitori: completare il profilo della piattaforma Connect, il branding della procedura di onboarding e le impostazioni sulla responsabilità per i saldi negativi.
- `PROVIDER_APPLICATION_RETENTION_MONTHS` e `PROVIDER_RETENTION_MONTHS` per lo script di retention (da definire con il DPO; senza valore la pulizia dei fornitori è saltata).
- I fornitori del catalogo senza onboarding continuano a usare le variabili `STRIPE_ACCOUNT_*`; un fornitore registrato tramite onboarding prevale sulla variabile.

## Modello di email con il link

> Oggetto: Attracco — completa la tua adesione
>
> Gentile [nome referente],
>
> grazie per la candidatura di [ragione sociale]. Ti invitiamo a completare l'adesione ad Attracco da questo link personale, valido fino al [data]:
>
> [link]
>
> Dovrai inserire i dati fiscali, leggere e accettare le Condizioni per i fornitori, caricare i documenti richiesti e configurare gli incassi con Stripe. Puoi interrompere e riprendere in qualsiasi momento. Il link è personale: non inoltrarlo.
>
> Per qualsiasi domanda rispondi a questa email.
>
> [firma]

## Prima di invitare il primo fornitore

- [ ] Validare e finalizzare `/legal/fornitori` e `/legal/privacy-fornitori`, poi impostare `PROVIDER_DOCS_DRAFT = false` in `src/lib/legal.ts`
- [ ] Completare in `src/lib/legal.ts` `OPERATOR`, `PROVIDER_FEE_TEXT` (coerente con `PLATFORM_FEE_BPS`) e `PROVIDER_FORUM`
- [ ] Validare l'elenco dei documenti per categoria in `src/lib/providers/rules.ts`
- [ ] Definire i tempi di verifica documentale indicati nella pagina di onboarding (`[n. giorni lavorativi da definire]`)
- [ ] Deploy con database migrato, webhook Connect configurato e chiavi Stripe live
- [ ] Prova completa in modalità test di Stripe (account Express di prova, documento, attivazione, prenotazione)
