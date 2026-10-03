# Attracco — concierge AI per la Puglia

Sito **attracco.app**: il turista chatta con un concierge AI, sceglie tra chef privato, autista NCC ed esperienze in barca a vela in Puglia, compila il modulo di prenotazione e paga online.

## Come funziona

1. **Concierge AI** (`/api/chat`): Claude (modello `claude-opus-5-5`) interroga il catalogo tramite tool in sola lettura (`search_services`, `get_service_details`, `prepare_booking`). Il prezzo è sempre calcolato dal server (`src/lib/pricing.ts`), mai dal modello. Quando la scelta è completa, la chat mostra una scheda con il pulsante **Prenota**.
2. **Modulo di prenotazione** (`/servizi/[id]`): raccoglie i dati del cliente, i consensi e, solo per lo chef, allergie/intolleranze con consenso esplicito separato.
3. **Pagamento** (`/api/bookings`): Stripe Checkout con **Stripe Connect** (destination charge, `on_behalf_of` = fornitore). La carta è solo **pre-autorizzata** (`capture_method: manual`).
4. **Conferma del fornitore** (`/admin`): il back-office conferma (addebito), rifiuta (sblocco dell'importo) o annulla e rimborsa. Stripe invia gli aggiornamenti di stato tramite webhook (`/api/stripe/webhook`).

```
Turista ──chat──▶ /api/chat ──▶ Claude ──tool──▶ catalogo + preventivo (server)
   │                                               │
   └──modulo──▶ /api/bookings ──▶ Postgres + Stripe Checkout (pre-autorizzazione)
                                         │
              /admin (conferma/rifiuto) ◀┴──▶ webhook Stripe ──▶ stato prenotazione
```

## Struttura

| Percorso | Contenuto |
|---|---|
| `src/data/catalog.ts` | Servizi, prezzi, aree della Puglia, fornitori (dati tra `[ ]` da completare) |
| `src/lib/pricing.ts` | Calcolo e validazione del preventivo (data, stagione, orario, area, ospiti) |
| `src/lib/concierge/` | Prompt di sistema, tool e loop del concierge |
| `src/app/api/` | Chat, prenotazioni, webhook Stripe, azioni di back-office |
| `src/app/legal/` | Termini, privacy, cookie, trasparenza AI, note legali (IT/EN) |
| `db/schema.sql` | Schema PostgreSQL |
| `src/data/images.ts` | Registro immagini (illustrazioni e foto con crediti) |
| `scripts/fetch-commons-images.mjs` | Download foto da Wikimedia Commons con controllo licenza |
| `scripts/retention.mjs` | Anonimizzazione periodica dei dati personali |
| `docs/COMPLIANCE.md` | Mappa degli adempimenti e punti da validare |

## Sviluppo locale

```bash
cp .env.example .env.local      # compilare le variabili
npm install
DATABASE_URL=... npm run db:migrate
npm run dev                     # http://localhost:3000
npm test                        # test del calcolo prezzi
npm run lint                    # typecheck
```

Per i webhook in locale: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Messa online su attracco.app

1. **Database**: PostgreSQL gestito con region UE (es. Neon o Supabase, Francoforte). Eseguire `npm run db:migrate`.
2. **Hosting**: progetto Vercel (o equivalente Node.js) collegato al repository; impostare tutte le variabili di `.env.example` in produzione e region delle funzioni UE (es. `fra1`).
3. **Dominio**: aggiungere `attracco.app` al progetto e configurare i DNS presso il registrar come indicato dall'hosting (record `A` per l'apex e `CNAME` per `www`). `.app` richiede HTTPS: il certificato è emesso automaticamente.
4. **Stripe**:
   - attivare Connect e invitare ogni fornitore come account connesso (Stripe esegue la verifica KYC); copiare gli `acct_...` nelle variabili `STRIPE_ACCOUNT_*`;
   - creare l'endpoint webhook `https://attracco.app/api/stripe/webhook` con gli eventi `checkout.session.completed`, `checkout.session.expired`, `payment_intent.canceled`, `payment_intent.succeeded`, `charge.refunded`; copiare il segreto in `STRIPE_WEBHOOK_SECRET`;
   - abilitare le ricevute email ai clienti.
5. **Claude API**: chiave in `ANTHROPIC_API_KEY`; verificare i termini commerciali e le opzioni di conservazione dei dati (vedi `docs/COMPLIANCE.md`).
6. **Back-office**: `/admin` con HTTP Basic Auth (`ADMIN_USER` / `ADMIN_PASSWORD`, password lunga).
7. **Retention**: job giornaliero `node scripts/retention.mjs` con `RETENTION_MONTHS` definito con il DPO.

## Immagini della Puglia

Il sito contiene illustrazioni originali (`public/images/illustrations/`). Per usare fotografie reali:

1. scegliere su Wikimedia Commons una foto per ciascuna voce di `images.sources.json` e scriverne il titolo (`File:...jpg`);
2. eseguire `npm run images:fetch`: scarica le foto in `public/images/photos/`, accetta solo licenze PD/CC0/CC BY/CC BY-SA e compila `src/data/photo-credits.json`;
3. il sito usa automaticamente la foto al posto dell'illustrazione e mostra autore e licenza (sotto l'immagine e in `/legal/crediti-immagini`).

Per foto proprie o commissionate: copiarle in `public/images/photos/` e aggiungere la voce corrispondente in `photo-credits.json`. Vedi `docs/COMPLIANCE.md` §6 per persone riconoscibili e beni culturali.

## Aggiungere servizi o fornitori

Modificare `src/data/catalog.ts`: ogni servizio indica fornitore, aree (solo località in `PUGLIA_AREAS`), prezzo finale IVA inclusa, orari, stagione e politica di cancellazione. Il concierge legge il catalogo automaticamente.

## Limiti noti della prima versione

- Disponibilità non collegata ai calendari dei fornitori: la disponibilità è verificata con la conferma entro 48 ore.
- Email transazionali (conferma/rifiuto) non ancora implementate: Stripe invia la ricevuta; le comunicazioni del fornitore vanno gestite dal back-office.
- Il rate limit del concierge è in memoria per istanza: con più istanze va usato uno store condiviso (es. Redis).
