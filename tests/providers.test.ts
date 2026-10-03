import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activationChecklist,
  canActivate,
  documentState,
  isPlausibleTaxCode,
  isValidItalianVat,
  requiredDocuments,
  safeFilename,
  sniffMime,
  type DocumentSnapshot,
  type ProviderSnapshot,
} from "../src/lib/providers/rules.ts";

// Genera una P.IVA formalmente valida a partire da 10 cifre.
function withCheckDigit(first10: string): string {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let d = Number(first10[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return first10 + ((10 - (sum % 10)) % 10);
}

test("partita IVA: cifra di controllo", () => {
  const vat = withCheckDigit("0123456789");
  assert.ok(isValidItalianVat(vat));
  assert.ok(isValidItalianVat(`IT${vat}`));
  const wrong = vat.slice(0, 10) + ((Number(vat[10]) + 1) % 10);
  assert.ok(!isValidItalianVat(wrong));
  assert.ok(!isValidItalianVat("00000000000"));
  assert.ok(!isValidItalianVat("123"));
});

test("codice fiscale: formato persona fisica o numerico", () => {
  assert.ok(isPlausibleTaxCode("RSSMRA80A01H501U"));
  assert.ok(isPlausibleTaxCode("rssmra80a01h501u"));
  assert.ok(isPlausibleTaxCode(withCheckDigit("0123456789")));
  assert.ok(!isPlausibleTaxCode("RSSMRA80A01"));
});

test("riconoscimento del tipo di file dal contenuto", () => {
  assert.equal(sniffMime(new TextEncoder().encode("%PDF-1.7\n")), "application/pdf");
  assert.equal(sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), "image/png");
  assert.equal(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniffMime(new TextEncoder().encode("<html><script>")), null);
  assert.equal(sniffMime(new TextEncoder().encode("MZ")), null);
});

test("nome file ripulito", () => {
  assert.equal(safeFilename("../../etc/passwd"), "....etcpasswd");
  assert.equal(safeFilename("Polizza RC 2027.pdf"), "Polizza_RC_2027.pdf");
  assert.equal(safeFilename("\"><img>"), "img");
  assert.equal(safeFilename("///"), "documento");
});

test("ogni categoria richiede documenti comuni e di settore", () => {
  for (const c of ["chef", "driver", "sailing"] as const) {
    const ids = requiredDocuments(c).map((d) => d.id);
    assert.ok(ids.includes("business_registration") && ids.includes("liability_insurance"), c);
    assert.ok(ids.length > 2, c);
    assert.equal(new Set(ids).size, ids.length, `${c}: id duplicati`);
  }
});

const TODAY = "2027-03-01";
const insurance = requiredDocuments("chef").find((d) => d.id === "liability_insurance")!;

test("stato del documento: verificato, scaduto, in verifica, mancante", () => {
  assert.equal(documentState(insurance, [], TODAY), "missing");
  assert.equal(documentState(insurance, [{ kind: "liability_insurance", status: "pending", expiresOn: null }], TODAY), "pending");
  assert.equal(documentState(insurance, [{ kind: "liability_insurance", status: "verified", expiresOn: "2027-12-31" }], TODAY), "verified");
  assert.equal(documentState(insurance, [{ kind: "liability_insurance", status: "verified", expiresOn: "2027-02-28" }], TODAY), "expired");
  assert.equal(documentState(insurance, [{ kind: "liability_insurance", status: "verified", expiresOn: null }], TODAY), "expired");
  assert.equal(documentState(insurance, [{ kind: "liability_insurance", status: "rejected", expiresOn: null }], TODAY), "rejected");
  assert.equal(documentState(insurance, [{ kind: "liability_insurance", status: "superseded", expiresOn: "2030-01-01" }], TODAY), "missing");
  // Il documento scaduto è sostituito da uno nuovo in verifica.
  assert.equal(
    documentState(insurance, [
      { kind: "liability_insurance", status: "verified", expiresOn: "2027-01-01" },
      { kind: "liability_insurance", status: "pending", expiresOn: null },
    ], TODAY),
    "pending",
  );
});

function readyProvider(): ProviderSnapshot {
  return {
    status: "onboarding",
    category: "driver",
    legalForm: "company",
    catalogProviderId: "ncc-levante",
    profileCompletedAt: new Date(),
    termsVersion: "v2",
    termsAcceptedAt: new Date(),
    specificClausesApprovedAt: new Date(),
    stripeAccountId: "acct_123",
    stripeChargesEnabled: true,
    stripePayoutsEnabled: true,
  };
}

function allDocs(): DocumentSnapshot[] {
  return requiredDocuments("driver").map((k) => ({ kind: k.id, status: "verified", expiresOn: k.expires ? "2028-01-01" : null }));
}

test("attivazione: consentita solo con tutti i requisiti", () => {
  assert.ok(canActivate(activationChecklist(readyProvider(), allDocs(), "v2", TODAY)));

  const missing = (patch: Partial<ProviderSnapshot>, docs = allDocs(), version = "v2") =>
    activationChecklist({ ...readyProvider(), ...patch }, docs, version, TODAY).filter((i) => !i.done).map((i) => i.id);

  assert.deepEqual(missing({ profileCompletedAt: null }), ["profile"]);
  assert.deepEqual(missing({ specificClausesApprovedAt: null }), ["terms"]);
  assert.deepEqual(missing({}, allDocs(), "v3"), ["terms"]);
  assert.deepEqual(missing({ stripePayoutsEnabled: false }), ["stripe"]);
  assert.deepEqual(missing({ stripeAccountId: null }), ["stripe"]);
  assert.deepEqual(missing({ catalogProviderId: null }), ["catalog"]);
  assert.deepEqual(missing({}, allDocs().filter((d) => d.kind !== "ncc_licence")), ["doc:ncc_licence"]);
  assert.deepEqual(
    missing({}, allDocs().map((d) => (d.kind === "liability_insurance" ? { ...d, expiresOn: "2027-01-01" } : d))),
    ["doc:liability_insurance"],
  );
});
