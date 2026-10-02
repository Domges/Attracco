import assert from "node:assert/strict";
import { test } from "node:test";
import { getService, PUGLIA_AREAS, PROVIDERS, SERVICES } from "../src/data/catalog.ts";
import { computeQuote, todayInRome } from "../src/lib/pricing.ts";

const NOW = new Date("2027-06-01T10:00:00Z");
const fee = { platformFeeBps: 1500, now: NOW };

test("catalogo: ogni servizio ha fornitore, aree in Puglia e orari", () => {
  for (const s of SERVICES) {
    assert.ok(PROVIDERS.some((p) => p.id === s.providerId), s.id);
    for (const a of s.areas) assert.ok((PUGLIA_AREAS as readonly string[]).includes(a), `${s.id}: ${a}`);
    assert.ok(s.startTimes.length > 0);
    assert.ok(s.pricing.unitAmountCents > 0);
  }
});

test("todayInRome usa il fuso Europe/Rome", () => {
  assert.equal(todayInRome(new Date("2027-06-01T22:30:00Z")), "2027-06-02");
});

test("prezzo a persona", () => {
  const r = computeQuote(getService("chef-cena-pugliese")!, { date: "2027-06-10", startTime: "20:00", guests: 6, area: "Ostuni" }, fee);
  assert.ok(r.ok);
  assert.equal(r.quote.amountCents, 6 * 9500);
  assert.equal(r.quote.platformFeeCents, Math.round(6 * 9500 * 0.15));
});

test("prezzo a ore con minimo", () => {
  const s = getService("ncc-tour-giornata")!;
  const ok = computeQuote(s, { date: "2027-06-10", startTime: "09:30", guests: 3, area: "Bari", hours: 6 }, fee);
  assert.ok(ok.ok);
  assert.equal(ok.quote.amountCents, 6 * 6000);
  const ko = computeQuote(s, { date: "2027-06-10", startTime: "09:30", guests: 3, area: "Bari", hours: 2 }, fee);
  assert.deepEqual(ko.ok ? [] : ko.errors, ["hours_out_of_range"]);
});

test("rifiuta località fuori zona, fuori stagione, troppo presto, orario non previsto", () => {
  const s = getService("vela-mezza-giornata")!;
  const r = computeQuote(s, { date: "2027-12-10", startTime: "12:00", guests: 4, area: "Roma" }, fee);
  assert.ok(!r.ok);
  assert.deepEqual(new Set(r.errors), new Set(["out_of_season", "invalid_time", "area_not_served"]));
  const soon = computeQuote(s, { date: "2027-06-02", startTime: "09:30", guests: 4, area: "Monopoli" }, fee);
  assert.ok(!soon.ok && soon.errors.includes("too_soon"));
});

test("rifiuta date non valide e ospiti fuori limite", () => {
  const s = getService("ncc-aeroporto")!;
  const r = computeQuote(s, { date: "2027-02-30", startTime: "10:00", guests: 9, area: "Bari" }, fee);
  assert.ok(!r.ok);
  assert.ok(r.errors.includes("invalid_date") && r.errors.includes("guests_out_of_range"));
});

test("commissione limitata tra 0 e 100%", () => {
  const s = getService("ncc-aeroporto")!;
  const r = computeQuote(s, { date: "2027-06-10", startTime: "10:00", guests: 2, area: "Bari" }, { platformFeeBps: 50_000, now: NOW });
  assert.ok(r.ok && r.quote.platformFeeCents === r.quote.amountCents);
});
