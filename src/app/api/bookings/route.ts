import { z } from "zod";
import { getProvider, getService } from "@/data/catalog";
import { logEvent, newPublicRef, transition } from "@/lib/bookings";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { computeQuote } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { connectedAccountFor, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const yes = z.literal(true);

const Body = z.object({
  locale: z.enum(["it", "en"]),
  serviceId: z.string().max(80),
  date: z.string().max(10),
  startTime: z.string().max(5),
  guests: z.number().int(),
  area: z.string().max(80),
  hours: z.number().int().nullable().optional(),
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{6,20}$/),
  pickupAddress: z.string().trim().max(300).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  dietaryNotes: z.string().trim().max(1000).optional().default(""),
  healthConsent: z.boolean().optional().default(false),
  isAdult: yes,
  acceptTerms: yes,
  acknowledgeNoWithdrawal: yes,
  privacyAcknowledged: yes,
});

export async function POST(req: Request) {
  if (!rateLimit(`booking:${clientIp(req)}`, 10, 3_600_000)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const b = parsed.data;

  const service = getService(b.serviceId);
  const provider = service && getProvider(service.providerId);
  if (!service || !provider) return Response.json({ error: "unknown_service" }, { status: 404 });

  if (service.category === "driver" && b.pickupAddress.length < 5) {
    return Response.json({ error: "invalid_request", issues: ["pickupAddress"] }, { status: 400 });
  }
  // Dati sulla salute: accettati solo per i servizi che li richiedono e solo con consenso esplicito.
  const dietary = service.collectsDietaryInfo && b.healthConsent && b.dietaryNotes ? b.dietaryNotes : null;
  if (b.dietaryNotes && !dietary) {
    return Response.json({ error: "invalid_request", issues: ["healthConsent"] }, { status: 400 });
  }

  // Prezzo sempre ricalcolato lato server dal catalogo.
  const result = computeQuote(
    service,
    { date: b.date, startTime: b.startTime, guests: b.guests, area: b.area, hours: b.hours ?? undefined },
    { platformFeeBps: env.platformFeeBps() },
  );
  if (!result.ok) return Response.json({ error: "invalid_quote", issues: result.errors }, { status: 422 });
  const q = result.quote;

  const destination = connectedAccountFor(provider.stripeAccountEnv);
  const ref = newPublicRef();
  const now = new Date();

  const [booking] = await db()`
    INSERT INTO bookings (
      public_ref, service_id, provider_id, service_date, start_time, area, guests, units,
      amount_cents, platform_fee_cents, currency, customer_name, customer_email, customer_phone,
      pickup_address, notes, dietary_notes, health_consent_at, terms_version, privacy_version,
      terms_accepted_at, waiver_acknowledged_at, locale
    ) VALUES (
      ${ref}, ${service.id}, ${provider.id}, ${q.date}, ${q.startTime}, ${q.area}, ${q.guests}, ${q.units},
      ${q.amountCents}, ${q.platformFeeCents}, ${q.currency}, ${b.name}, ${b.email.toLowerCase()}, ${b.phone},
      ${b.pickupAddress || null}, ${b.notes || null}, ${dietary}, ${dietary ? now : null}, ${TERMS_VERSION}, ${PRIVACY_VERSION},
      ${now}, ${now}, ${b.locale}
    ) RETURNING id`;
  await logEvent(booking.id, "created", { terms: TERMS_VERSION, privacy: PRIVACY_VERSION, health_consent: Boolean(dietary) });

  const site = env.siteUrl();
  const title = service.title[b.locale];
  const description = `${q.date} ${q.startTime} — ${q.area} — ${q.guests} ${b.locale === "it" ? "ospiti" : "guests"} — ${ref}`;

  let session;
  try {
    session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        locale: b.locale,
        customer_email: b.email,
        client_reference_id: booking.id,
        metadata: { booking_id: booking.id, public_ref: ref },
        line_items: [
          {
            quantity: q.units,
            price_data: { currency: q.currency, unit_amount: q.unitAmountCents, product_data: { name: title, description } },
          },
        ],
        payment_intent_data: {
          // Pre-autorizzazione: l'addebito avviene solo dopo la conferma del fornitore.
          capture_method: "manual",
          // Il fornitore è il venditore (merchant of record); Attracco trattiene la commissione.
          on_behalf_of: destination,
          transfer_data: { destination },
          application_fee_amount: q.platformFeeCents,
          description: `${title} — ${ref}`,
          metadata: { booking_id: booking.id, public_ref: ref },
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        success_url: `${site}/prenotazione/successo?ref=${ref}`,
        cancel_url: `${site}/servizi/${service.id}?cancelled=1`,
      },
      { idempotencyKey: `checkout-${booking.id}` },
    );
  } catch (err) {
    console.error("stripe checkout error", err);
    await transition(booking.id, ["pending_payment"], "expired", { reason: "checkout_creation_failed" });
    return Response.json({ error: "payment_unavailable" }, { status: 502 });
  }

  await db()`UPDATE bookings SET stripe_session_id = ${session.id}, updated_at = now() WHERE id = ${booking.id}`;
  return Response.json({ url: session.url, ref });
}
