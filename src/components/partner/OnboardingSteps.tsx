"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERRORS: Record<string, string> = {
  not_found: "Link non valido o scaduto. Chiedi ad Attracco un nuovo link.",
  terms_outdated: "Le condizioni sono state aggiornate: ricarica la pagina e rileggile.",
  file_too_large: "Il file supera la dimensione massima.",
  unsupported_type: "Formato non supportato: carica un PDF, JPG o PNG.",
  too_many_documents: "Hai raggiunto il numero massimo di documenti. Contatta Attracco.",
  rate_limited: "Troppe richieste. Riprova tra qualche minuto.",
  stripe_unavailable: "Stripe non è raggiungibile in questo momento. Riprova più tardi.",
  not_available: "Passaggio non disponibile: completa prima le condizioni.",
};

const PROFILE_LABELS: Record<string, string> = {
  taxCode: "codice fiscale",
  rea: "numero REA",
  birthDate: "data di nascita",
  registeredOffice: "indirizzo",
  pec: "PEC",
  contactName: "referente",
  phone: "telefono",
};

async function post(url: string, body: BodyInit, json = true) {
  const res = await fetch(url, {
    method: "POST",
    headers: json ? { "Content-Type": "application/json" } : undefined,
    body,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

function message(data: { error?: string; issues?: string[] }, labels: Record<string, string> = {}) {
  if (data.issues?.length) return `Controlla: ${data.issues.map((i) => labels[i] ?? i).join(", ")}.`;
  return ERRORS[data.error ?? ""] ?? "Si è verificato un errore. Riprova.";
}

export function ProfileForm({
  token,
  legalForm,
  initial,
}: {
  token: string;
  legalForm: "individual" | "company";
  initial: Record<"taxCode" | "rea" | "birthDate" | "registeredOffice" | "pec" | "contactName" | "phone", string>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const { ok, data } = await post(`/api/partner/onboarding/${token}/profile`, JSON.stringify(body));
    setBusy(false);
    if (ok) router.refresh();
    else setError(message(data, PROFILE_LABELS));
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <label className="field">
          <span>Codice fiscale {legalForm === "company" ? "della società" : ""}</span>
          <input name="taxCode" required defaultValue={initial.taxCode} maxLength={16} style={{ textTransform: "uppercase" }} />
        </label>
        {legalForm === "individual" ? (
          <label className="field">
            <span>Data di nascita del titolare</span>
            <input name="birthDate" type="date" required defaultValue={initial.birthDate} />
          </label>
        ) : (
          <label className="field">
            <span>N. REA e CCIAA</span>
            <input name="rea" required defaultValue={initial.rea} maxLength={40} placeholder="BA-123456" />
          </label>
        )}
      </div>
      {legalForm === "individual" && (
        <label className="field">
          <span>N. REA (se iscritto al Registro imprese)</span>
          <input name="rea" defaultValue={initial.rea} maxLength={40} />
        </label>
      )}
      <label className="field">
        <span>Indirizzo completo della sede (o residenza del titolare)</span>
        <input name="registeredOffice" required defaultValue={initial.registeredOffice} maxLength={300} />
      </label>
      <div className="row">
        <label className="field">
          <span>Referente</span>
          <input name="contactName" required defaultValue={initial.contactName} maxLength={120} />
        </label>
        <label className="field">
          <span>Telefono</span>
          <input name="phone" type="tel" required defaultValue={initial.phone} />
        </label>
      </div>
      <label className="field">
        <span>PEC (facoltativa)</span>
        <input name="pec" type="email" defaultValue={initial.pec} />
      </label>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? "Salvataggio…" : "Salva i dati"}</button>
    </form>
  );
}

export function TermsForm({ token, version, previous }: { token: string; version: string; previous: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accept, setAccept] = useState(false);
  const [approve, setApprove] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const { ok, data } = await post(
      `/api/partner/onboarding/${token}/terms`,
      JSON.stringify({ version, signerName: f.get("signerName"), signerRole: f.get("signerRole"), acceptTerms: accept, approveSpecificClauses: approve }),
    );
    setBusy(false);
    if (ok) router.refresh();
    else setError(message(data));
  }

  return (
    <form onSubmit={submit}>
      {previous && previous !== version && (
        <p className="notice">Le condizioni sono state aggiornate rispetto alla versione {previous} che avevi accettato: rileggile e accetta la nuova versione.</p>
      )}
      <p>
        Leggi le{" "}
        <Link href="/legal/fornitori" target="_blank">
          Condizioni per i fornitori
        </Link>{" "}
        (versione {version}). Puoi scaricarle o stamparle dal browser.
      </p>
      <div className="row">
        <label className="field">
          <span>Nome e cognome di chi accetta</span>
          <input name="signerName" required maxLength={120} autoComplete="name" />
        </label>
        <label className="field">
          <span>In qualità di</span>
          <input name="signerRole" required maxLength={120} placeholder="titolare, legale rappresentante…" />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} required />
        <span>Ho letto e accetto le Condizioni per i fornitori e dichiaro di avere i poteri per vincolare l&apos;impresa.</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={approve} onChange={(e) => setApprove(e.target.checked)} required />
        <span>
          Ai sensi degli artt. 1341 e 1342 c.c. approvo specificamente le clausole elencate nell&apos;articolo «Approvazione specifica»
          delle Condizioni.
        </span>
      </label>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button className="btn" disabled={busy || !accept || !approve}>{busy ? "Invio…" : "Accetto le condizioni"}</button>
    </form>
  );
}

export function DocumentUpload({ token, kind }: { token: string; kind: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("kind", kind);
    form.set("file", file);
    const { ok, data } = await post(`/api/partner/onboarding/${token}/documents`, form, false);
    setBusy(false);
    if (ok) router.refresh();
    else setError(message(data));
  }

  return (
    <div style={{ flex: "0 1 260px" }}>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        disabled={busy}
        aria-label="Carica documento"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {busy && <div className="muted">Caricamento…</div>}
      {error && <div className="error-text" role="alert">{error}</div>}
    </div>
  );
}

export function StripeButton({ token, resume }: { token: string; resume: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    const { ok, data } = await post(`/api/partner/onboarding/${token}/stripe`, "{}");
    if (ok && data.url) {
      location.href = data.url;
      return;
    }
    setBusy(false);
    setError(message(data));
  }

  return (
    <>
      <button className="btn" onClick={start} disabled={busy}>
        {busy ? "Apertura di Stripe…" : resume ? "Riprendi la configurazione Stripe" : "Configura gli incassi con Stripe"}
      </button>
      {error && <p className="error-text" role="alert">{error}</p>}
    </>
  );
}
