// Regole dell'onboarding fornitori. Funzioni pure (nessun accesso a database o
// Stripe), usate da API, back-office e pagina di onboarding, e coperte da test.

import type { Category } from "../../data/catalog";

export type ProviderStatus = "applied" | "onboarding" | "active" | "suspended" | "rejected" | "withdrawn";
export type LegalForm = "individual" | "company";
export type DocumentStatus = "pending" | "verified" | "rejected" | "superseded";

export interface DocumentKind {
  id: string;
  label: string;
  help: string;
  // Se il documento ha una scadenza, il back-office deve indicarla in fase di verifica.
  expires: boolean;
}

// Elenco documentale per categoria. L'elenco è una proposta operativa da
// validare: i titoli abilitativi richiesti dipendono dalla normativa di settore
// e dai regolamenti comunali/regionali vigenti.
const COMMON: DocumentKind[] = [
  {
    id: "business_registration",
    label: "Visura camerale (o certificato di attribuzione della partita IVA)",
    help: "Visura aggiornata a non oltre 6 mesi; per i professionisti senza iscrizione al Registro imprese, il certificato di attribuzione della P.IVA.",
    expires: false,
  },
  {
    id: "liability_insurance",
    label: "Polizza di responsabilità civile",
    help: "Frontespizio e condizioni con massimale, attività assicurata e scadenza.",
    expires: true,
  },
];

const BY_CATEGORY: Record<Category, DocumentKind[]> = {
  chef: [
    {
      id: "haccp_certificate",
      label: "Attestato di formazione igiene alimenti (HACCP)",
      help: "Attestato in corso di validità secondo la normativa regionale.",
      expires: true,
    },
  ],
  driver: [
    {
      id: "ncc_licence",
      label: "Autorizzazione NCC rilasciata dal Comune",
      help: "Autorizzazione per il noleggio con conducente (L. 21/1992) con indicazione della rimessa.",
      expires: false,
    },
    {
      id: "driver_register",
      label: "Iscrizione al ruolo dei conducenti e patente con CQC/KB",
      help: "Per ogni conducente che effettuerà i servizi.",
      expires: true,
    },
    {
      id: "vehicle_registration",
      label: "Carta di circolazione del veicolo (uso noleggio con conducente)",
      help: "Una per ogni veicolo impiegato.",
      expires: false,
    },
  ],
  sailing: [
    {
      id: "charter_registration",
      label: "Documentazione dell'unità abilitata al noleggio",
      help: "Licenza di navigazione/iscrizione con annotazione dell'uso commerciale (D.Lgs. 171/2005).",
      expires: false,
    },
    {
      id: "skipper_licence",
      label: "Titolo professionale o patente nautica dello skipper",
      help: "Per ogni comandante che effettuerà le uscite.",
      expires: true,
    },
    {
      id: "safety_certificate",
      label: "Certificato di sicurezza dell'unità",
      help: "In corso di validità.",
      expires: true,
    },
  ],
};

export function requiredDocuments(category: Category): DocumentKind[] {
  return [...COMMON, ...BY_CATEGORY[category]];
}

export const OPTIONAL_DOCUMENT: DocumentKind = {
  id: "other",
  label: "Altro documento",
  help: "Documenti aggiuntivi richiesti da Attracco.",
  expires: false,
};

export function documentKind(category: Category, id: string): DocumentKind | undefined {
  return id === OPTIONAL_DOCUMENT.id ? OPTIONAL_DOCUMENT : requiredDocuments(category).find((d) => d.id === id);
}

// --- File caricati ---------------------------------------------------------

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024; // sotto il limite del corpo delle funzioni serverless
export const MAX_DOCUMENTS_PER_PROVIDER = 40;

export type AllowedMime = "application/pdf" | "image/jpeg" | "image/png";

/** Riconosce il tipo dal contenuto (magic bytes), senza fidarsi del nome o del tipo dichiarato. */
export function sniffMime(bytes: Uint8Array): AllowedMime | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  return null;
}

export function safeFilename(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(-100);
  return cleaned || "documento";
}

// --- Dati anagrafici -------------------------------------------------------

/** Partita IVA italiana: 11 cifre con carattere di controllo (algoritmo di Luhn modificato). */
export function isValidItalianVat(vat: string): boolean {
  const v = vat.replace(/^IT/i, "").trim();
  if (!/^\d{11}$/.test(v) || v === "00000000000") return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let d = Number(v[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10 === Number(v[10]);
}

/** Codice fiscale: 16 caratteri alfanumerici (persona fisica) o 11 cifre (soggetto diverso). Controllo formale. */
export function isPlausibleTaxCode(code: string): boolean {
  const c = code.trim().toUpperCase();
  return /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(c) || isValidItalianVat(c);
}

// --- Stato dell'onboarding -------------------------------------------------

export interface ProviderSnapshot {
  status: ProviderStatus;
  category: Category;
  legalForm: LegalForm;
  catalogProviderId: string | null;
  profileCompletedAt: Date | null;
  termsVersion: string | null;
  termsAcceptedAt: Date | null;
  specificClausesApprovedAt: Date | null;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
}

export interface DocumentSnapshot {
  kind: string;
  status: DocumentStatus;
  expiresOn: string | null; // YYYY-MM-DD
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  detail?: string;
}

const DOCUMENT_STATE_LABEL = {
  verified: "verificato",
  pending: "in verifica",
  missing: "mancante",
  expired: "scaduto",
  rejected: "respinto",
} as const;

/** Stato di ciascun documento richiesto: verificato e non scaduto, in attesa di verifica, mancante o scaduto. */
export function documentState(
  kind: DocumentKind,
  docs: DocumentSnapshot[],
  today: string,
): "verified" | "pending" | "missing" | "expired" | "rejected" {
  const own = docs.filter((d) => d.kind === kind.id && d.status !== "superseded");
  const valid = own.find((d) => d.status === "verified" && (!kind.expires || (d.expiresOn !== null && d.expiresOn >= today)));
  if (valid) return "verified";
  if (own.some((d) => d.status === "pending")) return "pending";
  if (own.some((d) => d.status === "verified")) return "expired";
  if (own.some((d) => d.status === "rejected")) return "rejected";
  return "missing";
}

/**
 * Requisiti per attivare il fornitore. L'attivazione è consentita solo quando
 * tutte le voci sono soddisfatte; la checklist è mostrata anche al back-office.
 */
export function activationChecklist(
  p: ProviderSnapshot,
  docs: DocumentSnapshot[],
  currentTermsVersion: string,
  today: string,
): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { id: "profile", label: "Dati anagrafici e fiscali (DAC7) completati", done: p.profileCompletedAt !== null },
    {
      id: "terms",
      label: "Condizioni per i fornitori accettate (versione vigente) e clausole specificamente approvate",
      done: p.termsAcceptedAt !== null && p.specificClausesApprovedAt !== null && p.termsVersion === currentTermsVersion,
      detail: p.termsVersion && p.termsVersion !== currentTermsVersion ? `accettata la versione ${p.termsVersion}` : undefined,
    },
  ];
  for (const kind of requiredDocuments(p.category)) {
    const state = documentState(kind, docs, today);
    items.push({ id: `doc:${kind.id}`, label: kind.label, done: state === "verified", detail: state === "verified" ? undefined : DOCUMENT_STATE_LABEL[state] });
  }
  items.push(
    {
      id: "stripe",
      label: "Account Stripe abilitato a incassi e bonifici",
      done: p.stripeAccountId !== null && p.stripeChargesEnabled && p.stripePayoutsEnabled,
      detail: p.stripeAccountId ? undefined : "account non creato",
    },
    { id: "catalog", label: "Collegato a un fornitore del catalogo", done: p.catalogProviderId !== null },
  );
  return items;
}

export function canActivate(items: ChecklistItem[]): boolean {
  return items.every((i) => i.done);
}

// Transizioni ammesse dal back-office.
export const ADMIN_TRANSITIONS: Record<string, { from: ProviderStatus[]; to: ProviderStatus }> = {
  start_onboarding: { from: ["applied"], to: "onboarding" },
  activate: { from: ["onboarding", "suspended"], to: "active" },
  suspend: { from: ["active"], to: "suspended" },
  reject: { from: ["applied", "onboarding"], to: "rejected" },
  withdraw: { from: ["applied", "onboarding", "active", "suspended"], to: "withdrawn" },
};

export const STATUS_LABEL: Record<ProviderStatus, string> = {
  applied: "Candidatura ricevuta",
  onboarding: "Onboarding in corso",
  active: "Attivo",
  suspended: "Sospeso",
  rejected: "Non accolto",
  withdrawn: "Cessato",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  chef: "Chef privato",
  driver: "Autista NCC",
  sailing: "Barca a vela",
};
