-- Schema Attracco. Idempotente: può essere rieseguito.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS bookings (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref                text NOT NULL UNIQUE,
  service_id                text NOT NULL,
  provider_id               text NOT NULL,
  service_date              date NOT NULL,
  start_time                text NOT NULL,
  area                      text NOT NULL,
  guests                    integer NOT NULL CHECK (guests > 0),
  units                     integer NOT NULL CHECK (units > 0),
  amount_cents              integer NOT NULL CHECK (amount_cents > 0),
  platform_fee_cents        integer NOT NULL CHECK (platform_fee_cents >= 0),
  currency                  text NOT NULL DEFAULT 'eur',
  status                    text NOT NULL DEFAULT 'pending_payment' CHECK (status IN
                              ('pending_payment','authorized','confirmed','rejected','cancelled','expired','refunded')),
  customer_name             text NOT NULL,
  customer_email            text NOT NULL,
  customer_phone            text NOT NULL,
  pickup_address            text,
  notes                     text,
  -- Dato relativo alla salute (art. 9 GDPR): valorizzato solo con consenso esplicito.
  dietary_notes             text,
  health_consent_at         timestamptz,
  terms_version             text NOT NULL,
  privacy_version           text NOT NULL,
  terms_accepted_at         timestamptz NOT NULL,
  waiver_acknowledged_at    timestamptz NOT NULL,
  locale                    text NOT NULL DEFAULT 'it',
  stripe_session_id         text UNIQUE,
  stripe_payment_intent_id  text UNIQUE,
  anonymized_at             timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dietary_requires_consent CHECK (dietary_notes IS NULL OR health_consent_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_service_date_idx ON bookings (service_date);

-- Registro eventi (audit trail): cambi di stato e azioni del back-office.
CREATE TABLE IF NOT EXISTS booking_events (
  id          bigserial PRIMARY KEY,
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_events_booking_idx ON booking_events (booking_id, created_at);

-- Idempotenza webhook Stripe.
CREATE TABLE IF NOT EXISTS stripe_events (
  id           text PRIMARY KEY,
  type         text NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Fornitori: candidatura, onboarding, verifica documentale, Stripe Connect.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status                        text NOT NULL DEFAULT 'applied' CHECK (status IN
                                  ('applied','onboarding','active','suspended','rejected','withdrawn')),
  category                      text NOT NULL CHECK (category IN ('chef','driver','sailing')),
  -- Collegamento al fornitore del catalogo (src/data/catalog.ts), assegnato dal back-office.
  catalog_provider_id           text UNIQUE,
  legal_form                    text NOT NULL CHECK (legal_form IN ('individual','company')),
  legal_name                    text NOT NULL,
  vat_number                    text NOT NULL,
  tax_code                      text,
  rea                           text,
  registered_office             text NOT NULL,
  -- Data di nascita: richiesta solo per le persone fisiche ai fini DAC7.
  birth_date                    date,
  contact_name                  text NOT NULL,
  email                         text NOT NULL,
  phone                         text NOT NULL,
  pec                           text,
  website                       text,
  areas                         text[] NOT NULL DEFAULT '{}',
  offer_description             text NOT NULL,
  -- Candidatura: presa visione dell'informativa fornitori.
  privacy_version               text NOT NULL,
  applied_at                    timestamptz NOT NULL DEFAULT now(),
  -- Condizioni per i fornitori (P2B) e approvazione specifica delle clausole ex artt. 1341-1342 c.c.
  terms_version                 text,
  terms_accepted_at             timestamptz,
  specific_clauses_approved_at  timestamptz,
  terms_accepted_by             text,
  terms_accepted_ip             text,
  profile_completed_at          timestamptz,
  -- Stripe Connect (account Express).
  stripe_account_id             text UNIQUE,
  stripe_charges_enabled        boolean NOT NULL DEFAULT false,
  stripe_payouts_enabled        boolean NOT NULL DEFAULT false,
  stripe_details_submitted      boolean NOT NULL DEFAULT false,
  stripe_requirements_due       text[] NOT NULL DEFAULT '{}',
  stripe_synced_at              timestamptz,
  -- Link personale di onboarding: si salva solo l'hash del token.
  onboarding_token_hash         text UNIQUE,
  onboarding_token_expires_at   timestamptz,
  status_reason                 text,
  admin_notes                   text,
  activated_at                  timestamptz,
  anonymized_at                 timestamptz,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT active_requires_terms CHECK (status <> 'active' OR (terms_accepted_at IS NOT NULL AND specific_clauses_approved_at IS NOT NULL)),
  CONSTRAINT active_requires_stripe CHECK (status <> 'active' OR stripe_account_id IS NOT NULL),
  CONSTRAINT active_requires_catalog CHECK (status <> 'active' OR catalog_provider_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS providers_status_idx ON providers (status, created_at DESC);

-- Documenti di abilitazione (licenze, polizze, visura). Conservati nel database
-- (region UE) per non introdurre un ulteriore responsabile del trattamento.
CREATE TABLE IF NOT EXISTS provider_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  kind            text NOT NULL,
  filename        text NOT NULL,
  mime_type       text NOT NULL CHECK (mime_type IN ('application/pdf','image/jpeg','image/png')),
  size_bytes      integer NOT NULL CHECK (size_bytes > 0),
  sha256          text NOT NULL,
  content         bytea NOT NULL,
  expires_on      date,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','superseded')),
  review_note     text,
  reviewed_at     timestamptz,
  uploaded_by     text NOT NULL CHECK (uploaded_by IN ('provider','admin')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_documents_provider_idx ON provider_documents (provider_id, kind, created_at DESC);

-- Registro eventi del fornitore (audit trail, motivazioni ex art. 4 Reg. (UE) 2019/1150).
CREATE TABLE IF NOT EXISTS provider_events (
  id           bigserial PRIMARY KEY,
  provider_id  uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  kind         text NOT NULL,
  detail       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_events_provider_idx ON provider_events (provider_id, created_at);
