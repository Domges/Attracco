"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n";
import { formatEuro } from "@/lib/pricing";
import type { BookingProposal } from "@/lib/concierge/tools";

type Item =
  | { kind: "user" | "assistant"; text: string }
  | { kind: "error"; text: string }
  | { kind: "proposal"; proposal: BookingProposal };

export function bookingHref(p: Pick<BookingProposal, "serviceId" | "date" | "startTime" | "guests" | "area" | "units" | "pricingModel">) {
  const q = new URLSearchParams({ date: p.date, time: p.startTime, guests: String(p.guests), area: p.area });
  if (p.pricingModel === "per_hour") q.set("hours", String(p.units));
  return `/servizi/${p.serviceId}?${q}#prenota`;
}

export function ConciergeChat() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [items]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim().slice(0, 2000);
    if (!text || busy) return;
    setInput("");
    setBusy(true);

    const next: Item[] = [...items, { kind: "user", text }];
    setItems(next);
    // Allo stesso modello si inviano solo i messaggi di testo (niente proposte o errori).
    const history = next
      .filter((i): i is Extract<Item, { kind: "user" | "assistant" }> => (i.kind === "user" || i.kind === "assistant") && i.text.trim() !== "")
      .map((i) => ({ role: i.kind, content: i.text.slice(0, 2000) }))
      .slice(-30);
    while (history.length && history[0].role !== "user") history.shift();

    let assistant = "";
    const pushAssistant = () =>
      setItems((cur) => {
        const copy = [...cur];
        const last = copy[copy.length - 1];
        if (last?.kind === "assistant") copy[copy.length - 1] = { kind: "assistant", text: assistant };
        else copy.push({ kind: "assistant", text: assistant });
        return copy;
      });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, messages: history }),
      });
      if (res.status === 429) throw new Error("rate");
      if (!res.ok || !res.body) throw new Error("unavailable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line);
          if (ev.type === "text") {
            assistant += ev.delta;
            pushAssistant();
          } else if (ev.type === "proposal") {
            assistant = "";
            setItems((cur) => [...cur, { kind: "proposal", proposal: ev.proposal }]);
          } else if (ev.type === "error") {
            const msg = ev.code === "refused" ? t.chatErrorRefused : ev.code === "too_long" ? t.chatErrorLong : t.chatErrorUnavailable;
            setItems((cur) => [...cur, { kind: "error", text: msg }]);
          }
        }
      }
    } catch (err) {
      setItems((cur) => [...cur, { kind: "error", text: (err as Error).message === "rate" ? t.chatErrorRate : t.chatErrorUnavailable }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card chat" aria-label={t.aiBadge}>
      <p className="ai-notice" role="note">
        <span className="tag">{t.aiBadge}</span> {t.aiNotice} <Link href="/legal/concierge-ai">{t.aiNoticeLink}</Link>
      </p>
      <div className="chat-log" ref={logRef} aria-live="polite">
        <div className="msg assistant">{t.chatWelcome}</div>
        {items.map((item, i) =>
          item.kind === "proposal" ? (
            <div key={i} className="proposal">
              <strong>{item.proposal.title}</strong>
              <div className="muted">
                {item.proposal.date} · {item.proposal.startTime} · {item.proposal.area} · {item.proposal.guests} {t.guests}
                {item.proposal.pricingModel === "per_hour" ? ` · ${item.proposal.units} ${t.hours}` : ""}
              </div>
              <div style={{ margin: "6px 0 10px" }}>
                {t.total}: <span className="price">{formatEuro(item.proposal.amountCents, locale)}</span>
              </div>
              <Link className="btn" href={bookingHref(item.proposal)}>
                {t.book}
              </Link>
            </div>
          ) : (
            <div key={i} className={`msg ${item.kind}`}>
              {item.text}
            </div>
          ),
        )}
        {busy && items[items.length - 1]?.kind === "user" && <div className="msg assistant muted">…</div>}
      </div>
      <form onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.chatPlaceholder}
          maxLength={2000}
          aria-label={t.chatPlaceholder}
        />
        <button className="btn" disabled={busy || !input.trim()}>
          {t.send}
        </button>
      </form>
    </div>
  );
}
