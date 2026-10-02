import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getProvider, getService, SERVICES, type Category, type Locale } from "@/data/catalog";
import { computeQuote, type Quote } from "@/lib/pricing";

// Tool a disposizione del concierge. Sono tutti in sola lettura sul catalogo:
// il modello non può creare prenotazioni, modificare prezzi né accedere a dati
// personali. La prenotazione vera nasce solo dal form compilato dal turista.

export interface BookingProposal extends Omit<Quote, "platformFeeCents"> {
  title: string;
  pricingModel: string;
}

export interface ToolOutcome {
  content: string;
  isError?: boolean;
  proposal?: BookingProposal;
}

const CATEGORY = z.enum(["chef", "driver", "sailing"]);

const SearchInput = z.object({
  category: CATEGORY.nullable(),
  area: z.string().max(80).nullable(),
});
const DetailsInput = z.object({ service_id: z.string().max(80) });
const PrepareInput = z.object({
  service_id: z.string().max(80),
  date: z.string().max(10),
  start_time: z.string().max(5),
  guests: z.number().int(),
  area: z.string().max(80),
  hours: z.number().int().nullable(),
});

export const CONCIERGE_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_services",
    description:
      "List the bookable services in the Attracco catalog (Puglia only), optionally filtered by category and/or area. Returns id, title, summary, price basis, guest limits, areas and season for each match.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        category: { type: ["string", "null"], enum: ["chef", "driver", "sailing", null], description: "Service category, or null for all" },
        area: { type: ["string", "null"], description: "Town in Puglia, e.g. 'Polignano a Mare', or null for all" },
      },
      required: ["category", "area"],
    },
  },
  {
    name: "get_service_details",
    description:
      "Full details of one service: description, what is included/excluded, start times, season, cancellation policy and the provider's identity (the professional who performs the service and is the guest's contractual counterparty).",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { service_id: { type: "string", description: "Service id from search_services" } },
      required: ["service_id"],
    },
  },
  {
    name: "prepare_booking",
    description:
      "Validate the guest's choice and compute the exact price server-side. On success the website shows the guest a booking card with a button to the booking form; on failure returns error codes to explain to the guest. Call only when all fields are known.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        service_id: { type: "string" },
        date: { type: "string", description: "Service date, YYYY-MM-DD" },
        start_time: { type: "string", description: "One of the service's start times, HH:MM" },
        guests: { type: "integer", description: "Number of guests" },
        area: { type: "string", description: "Town in Puglia where the service takes place / pick-up" },
        hours: { type: ["integer", "null"], description: "Hours, only for hourly services; null otherwise" },
      },
      required: ["service_id", "date", "start_time", "guests", "area", "hours"],
    },
  },
];

function priceBasis(model: string, locale: Locale): string {
  const it: Record<string, string> = { per_person: "a persona", per_hour: "all'ora", flat: "prezzo fisso" };
  const en: Record<string, string> = { per_person: "per person", per_hour: "per hour", flat: "flat price" };
  return (locale === "it" ? it : en)[model] ?? model;
}

function summarize(locale: Locale) {
  return (s: (typeof SERVICES)[number]) => ({
    id: s.id,
    category: s.category,
    title: s.title[locale],
    summary: s.summary[locale],
    price_eur: s.pricing.unitAmountCents / 100,
    price_basis: priceBasis(s.pricing.model, locale),
    min_units: s.pricing.minUnits,
    guests: `${s.minGuests}-${s.maxGuests}`,
    areas: s.areas,
    season_months: s.seasonMonths,
  });
}

export function runTool(
  name: string,
  rawInput: unknown,
  ctx: { locale: Locale; platformFeeBps: number },
): ToolOutcome {
  const invalid = (detail: string): ToolOutcome => ({ content: JSON.stringify({ error: "invalid_input", detail }), isError: true });

  switch (name) {
    case "search_services": {
      const parsed = SearchInput.safeParse(rawInput);
      if (!parsed.success) return invalid(parsed.error.message);
      const { category, area } = parsed.data;
      const results = SERVICES.filter(
        (s) =>
          (!category || s.category === (category as Category)) &&
          (!area || s.areas.some((a) => a.toLowerCase() === area.trim().toLowerCase())),
      ).map(summarize(ctx.locale));
      return { content: JSON.stringify({ region: "Puglia", results }) };
    }

    case "get_service_details": {
      const parsed = DetailsInput.safeParse(rawInput);
      if (!parsed.success) return invalid(parsed.error.message);
      const s = getService(parsed.data.service_id);
      if (!s) return { content: JSON.stringify({ error: "unknown_service" }), isError: true };
      const p = getProvider(s.providerId);
      return {
        content: JSON.stringify({
          ...summarize(ctx.locale)(s),
          description: s.description[ctx.locale],
          includes: s.includes[ctx.locale],
          excludes: s.excludes[ctx.locale],
          start_times: s.startTimes,
          max_units: s.pricing.maxUnits,
          cancellation_policy: s.cancellation[ctx.locale],
          provider: p && { name: p.legalName, is_professional_trader: p.isTrader },
          booking_flow:
            "Provider confirms within 48h; card pre-authorised and charged only on confirmation.",
        }),
      };
    }

    case "prepare_booking": {
      const parsed = PrepareInput.safeParse(rawInput);
      if (!parsed.success) return invalid(parsed.error.message);
      const i = parsed.data;
      const s = getService(i.service_id);
      if (!s) return { content: JSON.stringify({ error: "unknown_service" }), isError: true };
      const result = computeQuote(
        s,
        { date: i.date, startTime: i.start_time, guests: i.guests, area: i.area, hours: i.hours ?? undefined },
        { platformFeeBps: ctx.platformFeeBps },
      );
      if (!result.ok) {
        return {
          content: JSON.stringify({
            ok: false,
            errors: result.errors,
            allowed: { start_times: s.startTimes, areas: s.areas, season_months: s.seasonMonths, guests: `${s.minGuests}-${s.maxGuests}` },
          }),
          isError: true,
        };
      }
      const q = result.quote;
      return {
        content: JSON.stringify({
          ok: true,
          total_eur: q.amountCents / 100,
          note: "A booking card is now shown to the guest. Invite them to review it and press Book to complete the form and payment. Do not repeat the full summary.",
        }),
        proposal: (({ platformFeeCents: _fee, ...pub }) => ({ ...pub, title: s.title[ctx.locale], pricingModel: s.pricing.model }))(q),
      };
    }

    default:
      return { content: JSON.stringify({ error: "unknown_tool" }), isError: true };
  }
}
