import "server-only";
import postgres from "postgres";
import { env } from "./env";

// Connessione singola riutilizzata tra le invocazioni (serverless-friendly).
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function db(): postgres.Sql {
  if (!globalForDb.sql) {
    globalForDb.sql = postgres(env.databaseUrl(), { max: 5, idle_timeout: 20, prepare: false });
  }
  return globalForDb.sql;
}

export type BookingStatus =
  | "pending_payment"
  | "authorized"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "expired"
  | "refunded";

export interface BookingRow {
  id: string;
  public_ref: string;
  service_id: string;
  provider_id: string;
  service_date: string;
  start_time: string;
  area: string;
  guests: number;
  units: number;
  amount_cents: number;
  platform_fee_cents: number;
  currency: string;
  status: BookingStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_address: string | null;
  notes: string | null;
  dietary_notes: string | null;
  locale: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: Date;
}
