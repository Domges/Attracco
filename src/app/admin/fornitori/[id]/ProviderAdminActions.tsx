"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ERRORS: Record<string, string> = {
  invalid_state: "Azione non consentita nello stato attuale.",
  checklist_incomplete: "Requisiti di attivazione incompleti.",
  expiry_required: "Indica una data di scadenza futura.",
  catalog_provider_taken: "Fornitore del catalogo già collegato a un altro fornitore.",
  category_mismatch: "La categoria non corrisponde ai servizi di quel fornitore del catalogo.",
  no_stripe_account: "Il fornitore non ha ancora creato l'account Stripe.",
};

function useAction(id: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run(body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    setBusy(true);
    const res = await fetch(`/api/admin/providers/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const missing = Array.isArray(data.missing) ? `\n- ${data.missing.join("\n- ")}` : "";
      alert(`${ERRORS[data.error] ?? `Errore: ${data.error ?? res.status}`}${missing}`);
      return null;
    }
    router.refresh();
    return data;
  }
  return { busy, run };
}

function askReason(question: string): string | null {
  const r = prompt(`${question}\n\nLa motivazione è registrata e va comunicata al fornitore (min. 5 caratteri).`);
  return r && r.trim().length >= 5 ? r.trim() : null;
}

export function ProviderActions({ id, status, canActivate, hasStripe }: { id: string; status: string; canActivate: boolean; hasStripe: boolean }) {
  const { busy, run } = useAction(id);
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);

  async function issue(action: "start_onboarding" | "reissue_link", question: string) {
    if (!confirm(question)) return;
    const data = await run({ action });
    if (data?.url) setLink({ url: String(data.url), expiresAt: String(data.expiresAt) });
  }
  async function withReason(action: string, question: string) {
    const reason = askReason(question);
    if (reason) await run({ action, reason });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {status === "applied" && (
          <button className="btn" disabled={busy} onClick={() => issue("start_onboarding", "Accogliere la candidatura e generare il link di onboarding?")}>
            Avvia onboarding
          </button>
        )}
        {["onboarding", "active", "suspended"].includes(status) && (
          <button className="btn secondary" disabled={busy} onClick={() => issue("reissue_link", "Generare un nuovo link? Il precedente smetterà di funzionare.")}>
            Nuovo link onboarding
          </button>
        )}
        {hasStripe && (
          <button className="btn secondary" disabled={busy} onClick={() => run({ action: "sync_stripe" })}>
            Aggiorna stato Stripe
          </button>
        )}
        {["onboarding", "suspended"].includes(status) && (
          <button
            className="btn"
            disabled={busy || !canActivate}
            title={canActivate ? "" : "Completa i requisiti di attivazione"}
            onClick={() => confirm("Attivare il fornitore? Le prenotazioni dei suoi servizi useranno il suo account Stripe.") && run({ action: "activate" })}
          >
            Attiva
          </button>
        )}
        {status === "active" && (
          <button className="btn secondary" disabled={busy} onClick={() => withReason("suspend", "Motivo della sospensione")}>
            Sospendi
          </button>
        )}
        {["applied", "onboarding"].includes(status) && (
          <button className="btn secondary" disabled={busy} onClick={() => withReason("reject", "Motivo del mancato accoglimento")}>
            Non accogliere
          </button>
        )}
        {["applied", "onboarding", "active", "suspended"].includes(status) && (
          <button className="btn secondary" disabled={busy} onClick={() => withReason("withdraw", "Motivo della cessazione del rapporto")}>
            Cessa rapporto
          </button>
        )}
      </div>
      {link && (
        <div className="notice" style={{ marginTop: 16 }}>
          <strong>Link personale di onboarding</strong> (visibile solo ora; valido fino al {new Date(link.expiresAt).toLocaleDateString("it-IT")}):
          <input readOnly value={link.url} onFocus={(e) => e.target.select()} style={{ marginTop: 8 }} />
          <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => navigator.clipboard.writeText(link.url)}>
            Copia
          </button>
          <div className="muted" style={{ marginTop: 6 }}>Invialo al fornitore all&apos;indirizzo email della candidatura.</div>
        </div>
      )}
    </div>
  );
}

export function DocumentActions({ providerId, documentId, needsExpiry }: { providerId: string; documentId: string; needsExpiry: boolean }) {
  const { busy, run } = useAction(providerId);
  const [expiresOn, setExpiresOn] = useState("");
  return (
    <div style={{ display: "grid", gap: 6, minWidth: 180 }}>
      {needsExpiry && <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} aria-label="Data di scadenza" />}
      <button
        className="btn"
        disabled={busy || (needsExpiry && !expiresOn)}
        onClick={() => run({ action: "verify_document", documentId, expiresOn: expiresOn || null })}
      >
        Verificato
      </button>
      <button
        className="btn secondary"
        disabled={busy}
        onClick={() => {
          const note = askReason("Motivo (visibile al fornitore)");
          if (note) run({ action: "reject_document", documentId, note });
        }}
      >
        Respingi
      </button>
    </div>
  );
}

export function CatalogLink({ id, current, options }: { id: string; current: string | null; options: { id: string; label: string }[] }) {
  const { busy, run } = useAction(id);
  const [value, setValue] = useState(current ?? "");
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <select value={value} onChange={(e) => setValue(e.target.value)} style={{ flex: "1 1 220px" }}>
        <option value="">— nessuno —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      <button className="btn secondary" disabled={busy || value === (current ?? "")} onClick={() => run({ action: "set_catalog", catalogProviderId: value || null })}>
        Salva
      </button>
    </div>
  );
}

export function NotesForm({ id, notes }: { id: string; notes: string }) {
  const { busy, run } = useAction(id);
  const [value, setValue] = useState(notes);
  return (
    <>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} maxLength={5000} />
      <button className="btn secondary" style={{ marginTop: 8 }} disabled={busy || value === notes} onClick={() => run({ action: "notes", notes: value })}>
        Salva note
      </button>
    </>
  );
}
