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
