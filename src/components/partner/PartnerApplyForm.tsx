"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const FIELD_LABELS: Record<string, string> = {
  legalName: "ragione sociale",
  vatNumber: "partita IVA",
  registeredOffice: "sede",
  contactName: "referente",
  email: "email",
  phone: "telefono",
  website: "sito web",
  areas: "zone servite",
  offerDescription: "descrizione",
  isTrader: "dichiarazione di professionista",
  privacyAcknowledged: "informativa privacy",
};

export function PartnerApplyForm({ areas }: { areas: string[] }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const body = {
      category: f.get("category"),
      legalForm: f.get("legalForm"),
      legalName: f.get("legalName"),
      vatNumber: String(f.get("vatNumber") ?? "").replace(/\s/g, ""),
      registeredOffice: f.get("registeredOffice"),
      contactName: f.get("contactName"),
      email: f.get("email"),
      phone: f.get("phone"),
      website: f.get("website"),
      areas: selected,
      offerDescription: f.get("offerDescription"),
      isTrader: f.get("isTrader") === "on",
      privacyAcknowledged: f.get("privacyAcknowledged") === "on",
      company: f.get("company") || undefined,
    };
    setState("sending");
    const res = await fetch("/api/partner/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return setState("sent");
    setState("idle");
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) setError("Troppe richieste. Riprova più tardi.");
    else if (data.issues?.length)
      setError(`Controlla: ${[...new Set((data.issues as string[]).map((i) => FIELD_LABELS[i.split(".")[0]] ?? i))].join(", ")}.`);
    else setError("Si è verificato un errore. Riprova più tardi.");
  }

  if (state === "sent") {
    return (
      <div className="card">
        <h2 style={{ fontWeight: 400 }}>Candidatura ricevuta</h2>
        <p>
          Grazie. Valuteremo il profilo e, se in linea con il catalogo, ti invieremo via email il link personale per completare
          l&apos;adesione.
        </p>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>Candidatura</h2>
      <div className="row">
        <label className="field">
          <span>Categoria</span>
          <select name="category" required defaultValue="chef">
            <option value="chef">Chef privato</option>
            <option value="driver">Autista NCC</option>
            <option value="sailing">Barca a vela / charter</option>
          </select>
        </label>
        <label className="field">
          <span>Forma</span>
          <select name="legalForm" required defaultValue="individual">
            <option value="individual">Ditta individuale / professionista</option>
            <option value="company">Società</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>Ragione sociale o nome della ditta</span>
        <input name="legalName" required maxLength={200} autoComplete="organization" />
      </label>
      <div className="row">
        <label className="field">
          <span>Partita IVA</span>
          <input name="vatNumber" required inputMode="numeric" maxLength={13} />
        </label>
        <label className="field">
          <span>Telefono</span>
          <input name="phone" required type="tel" autoComplete="tel" />
        </label>
      </div>
      <label className="field">
        <span>Sede legale (o rimessa / porto base)</span>
        <input name="registeredOffice" required maxLength={300} autoComplete="street-address" />
      </label>
      <div className="row">
        <label className="field">
          <span>Referente</span>
          <input name="contactName" required maxLength={120} autoComplete="name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" required type="email" autoComplete="email" />
        </label>
      </div>
      <label className="field">
        <span>Sito web o profilo (facoltativo)</span>
        <input name="website" type="url" placeholder="https://" />
      </label>
      <fieldset style={{ marginBottom: 14 }}>
        <legend className="muted" style={{ fontSize: ".72rem", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}>
          Zone servite
        </legend>
        <div className="chips-light">
          {areas.map((a) => (
            <label key={a} className="check" style={{ margin: "4px 0" }}>
              <input
                type="checkbox"
                checked={selected.includes(a)}
                onChange={(e) => setSelected((s) => (e.target.checked ? [...s, a] : s.filter((x) => x !== a)))}
              />
              {a}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>Descrivi i servizi che offri</span>
        <textarea name="offerDescription" required minLength={30} maxLength={3000} placeholder="Esperienza, mezzi o imbarcazioni, menù, prezzi indicativi, stagionalità…" />
      </label>
      {/* Campo esca per i bot: nascosto agli utenti. */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      <label className="check">
        <input type="checkbox" name="isTrader" required />
        <span>Dichiaro di agire come professionista o impresa nell&apos;esercizio della mia attività e di essere in possesso dei titoli abilitativi richiesti per i servizi offerti.</span>
      </label>
      <label className="check">
        <input type="checkbox" name="privacyAcknowledged" required />
        <span>
          Ho letto l&apos;<Link href="/legal/privacy-fornitori">informativa privacy per i fornitori</Link>.
        </span>
      </label>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Invio…" : "Invia candidatura"}
      </button>
    </form>
  );
}
