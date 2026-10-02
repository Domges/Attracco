import { z } from "zod";
import { logEvent, transition } from "@/lib/bookings";
import { db, type BookingRow } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Azioni del back-office (protette da HTTP Basic Auth in src/proxy.ts).
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({ action: z.literal("reject"), reason: z.string().max(500).optional() }),
  z.object({ action: z.literal("cancel"), reason: z.string().max(500).optional() }),
  z.object({ action: z.literal("refund"), amountCents: z.number().int().positive().optional(), reason: z.string().max(500).optional() }),
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: "not_found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const [booking] = await db()<BookingRow[]>`SELECT * FROM bookings WHERE id = ${id}`;
  if (!booking) return Response.json({ error: "not_found" }, { status: 404 });
  const pi = booking.stripe_payment_intent_id;
  const action = parsed.data;

  switch (action.action) {
    case "confirm": {
      if (booking.status !== "authorized" || !pi) return Response.json({ error: "invalid_state" }, { status: 409 });
      await stripe().paymentIntents.capture(pi, {}, { idempotencyKey: `capture-${id}` });
      await transition(id, ["authorized"], "confirmed", { by: "admin" });
      break;
    }
    case "reject": {
      if (booking.status !== "authorized" || !pi) return Response.json({ error: "invalid_state" }, { status: 409 });
      // Annulla la pre-autorizzazione: nessun addebito al cliente.
      // Stato aggiornato prima della chiamata, così il webhook payment_intent.canceled non lo sovrascrive.
      if (!(await transition(id, ["authorized"], "rejected", { by: "admin", reason: action.reason }))) {
        return Response.json({ error: "invalid_state" }, { status: 409 });
      }
      try {
        await stripe().paymentIntents.cancel(pi, { cancellation_reason: "abandoned" }, { idempotencyKey: `cancel-${id}` });
      } catch (err) {
        await transition(id, ["rejected"], "authorized", { rollback: true });
        throw err;
      }
      break;
    }
    case "cancel":
    case "refund": {
      if (booking.status !== "confirmed" || !pi) return Response.json({ error: "invalid_state" }, { status: 409 });
      const amount = action.action === "refund" ? action.amountCents : undefined;
      if (amount && amount > booking.amount_cents) return Response.json({ error: "amount_too_high" }, { status: 400 });
      await stripe().refunds.create(
        { payment_intent: pi, amount, reverse_transfer: true, refund_application_fee: true, metadata: { booking_id: id } },
        { idempotencyKey: `refund-${id}-${amount ?? "full"}` },
      );
      await transition(id, ["confirmed"], "cancelled", { by: "admin", reason: action.reason, refund_cents: amount ?? booking.amount_cents });
      break;
    }
  }
  await logEvent(id, `admin:${action.action}`);
  return Response.json({ ok: true });
}
