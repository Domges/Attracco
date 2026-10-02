import type Stripe from "stripe";
import { transition } from "@/lib/bookings";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function bookingIdFromIntent(pi: Stripe.PaymentIntent | string | null): Promise<string | undefined> {
  if (!pi) return undefined;
  const intent = typeof pi === "string" ? await stripe().paymentIntents.retrieve(pi) : pi;
  return intent.metadata?.booking_id || undefined;
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, env.stripeWebhookSecret());
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  // Idempotenza: ogni evento è elaborato una sola volta.
  const fresh = await db()`INSERT INTO stripe_events (id, type) VALUES (${event.id}, ${event.type}) ON CONFLICT DO NOTHING RETURNING id`;
  if (fresh.length === 0) return Response.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.booking_id;
        if (!bookingId || !session.payment_intent) break;
        const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;
        const pi = await stripe().paymentIntents.retrieve(piId);
        await db()`UPDATE bookings SET stripe_payment_intent_id = ${pi.id}, updated_at = now() WHERE id = ${bookingId}`;
        if (pi.status === "requires_capture") {
          await transition(bookingId, ["pending_payment", "expired"], "authorized", { payment_intent: pi.id });
        } else if (pi.status === "succeeded") {
          await transition(bookingId, ["pending_payment", "expired", "authorized"], "confirmed", { payment_intent: pi.id });
        }
        break;
      }
      case "checkout.session.expired": {
        const bookingId = event.data.object.metadata?.booking_id;
        if (bookingId) await transition(bookingId, ["pending_payment"], "expired");
        break;
      }
      case "payment_intent.canceled": {
        // Rifiuto del fornitore (già registrato dal back-office) o scadenza dell'autorizzazione.
        const bookingId = await bookingIdFromIntent(event.data.object);
        if (bookingId) await transition(bookingId, ["authorized"], "expired", { reason: event.data.object.cancellation_reason });
        break;
      }
      case "payment_intent.succeeded": {
        const bookingId = await bookingIdFromIntent(event.data.object);
        if (bookingId) await transition(bookingId, ["authorized"], "confirmed", { via: "webhook" });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        if (charge.refunded) {
          const bookingId = await bookingIdFromIntent(charge.payment_intent);
          if (bookingId) await transition(bookingId, ["confirmed", "cancelled"], "refunded", { amount_refunded: charge.amount_refunded });
        }
        break;
      }
    }
  } catch (err) {
    // Rimuove il marcatore così Stripe può ritentare la consegna.
    await db()`DELETE FROM stripe_events WHERE id = ${event.id}`;
    console.error("stripe webhook error", event.type, err);
    return new Response("handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
