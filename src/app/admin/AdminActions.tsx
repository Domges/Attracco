"use client";

import { useState } from "react";

export function AdminActions({ id, status, amountCents }: { id: string; status: string; amountCents: number }) {
  const [busy, setBusy] = useState(false);

  async function act(body: Record<string, unknown>, question: string) {
    if (!confirm(question)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) location.reload();
    else alert(`Errore: ${(await res.json().catch(() => ({}))).error ?? res.status}`);
  }

  if (status === "authorized") {
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button className="btn" disabled={busy} onClick={() => act({ action: "confirm" }, "Confermare e addebitare il cliente?")}>
          Conferma
        </button>
        <button
          className="btn secondary"
          disabled={busy}
          onClick={() => act({ action: "reject", reason: prompt("Motivo del rifiuto") ?? undefined }, "Rifiutare e sbloccare l'importo?")}
        >
          Rifiuta
        </button>
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <button
        className="btn secondary"
        disabled={busy}
        onClick={() => {
          const eur = prompt(`Importo da rimborsare in EUR (vuoto = totale ${(amountCents / 100).toFixed(2)})`);
          if (eur === null) return;
          const cents = eur.trim() ? Math.round(Number(eur.replace(",", ".")) * 100) : undefined;
          if (cents !== undefined && !(cents > 0)) return alert("Importo non valido");
          act({ action: "refund", amountCents: cents }, "Annullare la prenotazione e rimborsare?");
        }}
      >
        Annulla e rimborsa
      </button>
    );
  }
  return <span className="muted">—</span>;
}
