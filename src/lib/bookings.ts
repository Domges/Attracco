import "server-only";
import { randomBytes } from "node:crypto";
import type postgres from "postgres";
import { db, type BookingStatus } from "./db";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newPublicRef(): string {
  const bytes = randomBytes(8);
  let ref = "";
  for (const b of bytes) ref += REF_ALPHABET[b % REF_ALPHABET.length];
  return `ATT-${ref}`;
}

export async function logEvent(
  bookingId: string,
  kind: string,
  detail: Record<string, unknown> = {},
  sql: postgres.Sql | postgres.TransactionSql = db(),
) {
  await sql`INSERT INTO booking_events (booking_id, kind, detail) VALUES (${bookingId}, ${kind}, ${sql.json(detail as postgres.JSONValue)})`;
}

/**
 * Transizione di stato condizionata: aggiorna solo se lo stato corrente è tra
 * quelli ammessi, così eventi duplicati o fuori ordine non fanno regredire lo stato.
 */
export async function transition(
  bookingId: string,
  from: BookingStatus[],
  to: BookingStatus,
  detail: Record<string, unknown> = {},
): Promise<boolean> {
  return db().begin(async (sql) => {
    const rows = await sql`
      UPDATE bookings SET status = ${to}, updated_at = now()
      WHERE id = ${bookingId} AND status IN ${sql(from)}
      RETURNING id`;
    if (rows.length === 0) return false;
    await logEvent(bookingId, `status:${to}`, detail, sql);
    return true;
  });
}
