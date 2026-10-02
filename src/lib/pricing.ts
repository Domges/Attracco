// Calcolo del preventivo. Funzione pura: è l'unico punto in cui si determina
// l'importo da addebitare, usata sia dal tool del concierge sia dall'API di
// prenotazione (che ricalcola sempre, ignorando qualunque importo dal client).

import type { Service } from "../data/catalog";

export const MIN_LEAD_DAYS = 2;
export const MAX_ADVANCE_DAYS = 365;
export const CURRENCY = "eur";

export interface QuoteRequest {
  date: string; // YYYY-MM-DD, ora locale Europe/Rome
  startTime: string; // HH:MM
  guests: number;
  area: string;
  hours?: number; // solo per servizi a ore
}

export interface Quote {
  serviceId: string;
  providerId: string;
  date: string;
  startTime: string;
  guests: number;
  area: string;
  units: number;
  unitAmountCents: number;
  amountCents: number;
  platformFeeCents: number;
  currency: typeof CURRENCY;
}

export type QuoteError =
  | "invalid_date"
  | "too_soon"
  | "too_far"
  | "out_of_season"
  | "invalid_time"
  | "area_not_served"
  | "guests_out_of_range"
  | "hours_out_of_range";

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; errors: QuoteError[] };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Data odierna (YYYY-MM-DD) nel fuso Europe/Rome. */
export function todayInRome(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function dayNumber(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000);
}

function isRealDate(isoDate: string): boolean {
  if (!DATE_RE.test(isoDate)) return false;
  const d = new Date(`${isoDate}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === isoDate;
}

export function computeQuote(
  service: Service,
  req: QuoteRequest,
  opts: { platformFeeBps: number; now?: Date },
): QuoteResult {
  const errors: QuoteError[] = [];

  if (!isRealDate(req.date)) {
    errors.push("invalid_date");
  } else {
    const delta = dayNumber(req.date) - dayNumber(todayInRome(opts.now));
    if (delta < MIN_LEAD_DAYS) errors.push("too_soon");
    if (delta > MAX_ADVANCE_DAYS) errors.push("too_far");
    const month = Number(req.date.slice(5, 7));
    if (!service.seasonMonths.includes(month)) errors.push("out_of_season");
  }

  if (!service.startTimes.includes(req.startTime)) errors.push("invalid_time");
  if (!(service.areas as readonly string[]).includes(req.area)) errors.push("area_not_served");
  if (!Number.isInteger(req.guests) || req.guests < service.minGuests || req.guests > service.maxGuests) {
    errors.push("guests_out_of_range");
  }

  let units: number;
  switch (service.pricing.model) {
    case "per_person":
      units = req.guests;
      break;
    case "per_hour":
      units = req.hours ?? service.pricing.minUnits;
      break;
    case "flat":
      units = 1;
      break;
  }
  if (!Number.isInteger(units) || units < service.pricing.minUnits || units > service.pricing.maxUnits) {
    errors.push(service.pricing.model === "per_hour" ? "hours_out_of_range" : "guests_out_of_range");
  }

  if (errors.length > 0) return { ok: false, errors: [...new Set(errors)] };

  const amountCents = service.pricing.unitAmountCents * units;
  const bps = Math.min(Math.max(Math.trunc(opts.platformFeeBps), 0), 10_000);
  return {
    ok: true,
    quote: {
      serviceId: service.id,
      providerId: service.providerId,
      date: req.date,
      startTime: req.startTime,
      guests: req.guests,
      area: req.area,
      units,
      unitAmountCents: service.pricing.unitAmountCents,
      amountCents,
      platformFeeCents: Math.round((amountCents * bps) / 10_000),
      currency: CURRENCY,
    },
  };
}

export function formatEuro(cents: number, locale: "it" | "en" = "it"): string {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
