"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import type { Service } from "@/data/catalog";
import { useI18n } from "@/lib/i18n";
import { computeQuote, formatEuro, todayInRome } from "@/lib/pricing";

interface Initial {
  date: string;
  time: string;
  guests: string;
  area: string;
  hours: string;
}

export function BookingForm({ service, initial }: { service: Service; initial: Initial }) {
  const { t, locale } = useI18n();
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(service.startTimes.includes(initial.time) ? initial.time : service.startTimes[0]);
  const [guests, setGuests] = useState(Number(initial.guests) || service.minGuests);
  const [area, setArea] = useState((service.areas as readonly string[]).includes(initial.area) ? initial.area : service.areas[0]);
  const [hours, setHours] = useState(Number(initial.hours) || service.pricing.minUnits);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [notes, setNotes] = useState("");
  const [dietary, setDietary] = useState("");
  const [healthConsent, setHealthConsent] = useState(false);
  const [isAdult, setAdult] = useState(false);
  const [acceptTerms, setTerms] = useState(false);
  const [noWithdrawal, setNoWithdrawal] = useState(false);
  const [privacyAck, setPrivacy] = useState(false);
  const [bad, setBad] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isHourly = service.pricing.model === "per_hour";
  // Anteprima lato client: il prezzo addebitato è comunque ricalcolato dal server.
  const quote = useMemo(
    () => computeQuote(service, { date, startTime: time, guests, area, hours: isHourly ? hours : undefined }, { platformFeeBps: 0 }),
    [service, date, time, guests, area, hours, isHourly],
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const missing: string[] = [];
    if (!quote.ok) missing.push("quote");
    if (name.trim().length < 2) missing.push("name");
    if (!/^\S+@\S+\.\S+$/.test(email)) missing.push("email");
    if (!/^\+?[0-9 ()-]{6,20}$/.test(phone.trim())) missing.push("phone");
    if (service.category === "driver" && pickup.trim().length < 5) missing.push("pickupAddress");
    if (dietary.trim() && !healthConsent) missing.push("healthConsent");
    if (!isAdult) missing.push("isAdult");
    if (!acceptTerms) missing.push("acceptTerms");
    if (!noWithdrawal) missing.push("acknowledgeNoWithdrawal");
    if (!privacyAck) missing.push("privacyAcknowledged");
    setBad(missing);
    if (missing.length) {
      setError(missing.includes("quote") ? t.quoteError : t.formError);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          serviceId: service.id,
          date,
          startTime: time,
          guests,
          area,
          hours: isHourly ? hours : null,
          name,
          email,
          phone,
          pickupAddress: pickup,
          notes,
          dietaryNotes: service.collectsDietaryInfo && healthConsent ? dietary : "",
          healthConsent: service.collectsDietaryInfo && healthConsent,
          isAdult,
          acceptTerms,
          acknowledgeNoWithdrawal: noWithdrawal,
          privacyAcknowledged: privacyAck,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      if (res.status === 422) setError(t.quoteError);
      else if (res.status === 400 && Array.isArray(data.issues)) {
        setBad(data.issues);
        setError(t.formError);
      } else setError(t.genericError);
    } catch {
      setError(t.genericError);
    }
    setBusy(false);
  }

  const cls = (k: string) => (bad.includes(k) ? "invalid" : undefined);
  const today = todayInRome();

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2 style={{ marginTop: 0 }}>{t.formTitle}</h2>
      <div className="row">
        <label className="field">
          <span>{t.date}</span>
          <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className={cls("quote")} required />
        </label>
        <label className="field">
          <span>{t.startTime}</span>
          <select value={time} onChange={(e) => setTime(e.target.value)}>
            {service.startTimes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <label className="field">
          <span>{t.area}</span>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {service.areas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.numGuests}</span>
          <input type="number" min={service.minGuests} max={service.maxGuests} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
        </label>
        {isHourly && (
          <label className="field">
            <span>{t.numHours}</span>
            <input type="number" min={service.pricing.minUnits} max={service.pricing.maxUnits} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </label>
        )}
      </div>

      <p>
        {t.total}: <span className="price">{quote.ok ? formatEuro(quote.quote.amountCents, locale) : "—"}</span>
        {!quote.ok && date && <span className="error-text"> · {t.quoteError}</span>}
      </p>

      <label className="field">
        <span>{t.name}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={cls("name")} maxLength={120} />
      </label>
      <div className="row">
        <label className="field">
          <span>{t.email}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={cls("email")} maxLength={200} />
        </label>
        <label className="field">
          <span>{t.phone}</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className={cls("phone")} maxLength={20} />
        </label>
      </div>
      {service.category === "driver" && (
        <label className="field">
          <span>{t.pickup}</span>
          <input value={pickup} onChange={(e) => setPickup(e.target.value)} className={cls("pickupAddress")} maxLength={300} />
        </label>
      )}
      <label className="field">
        <span>{t.notes}</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
      </label>

      {service.collectsDietaryInfo && (
        <fieldset className="card" style={{ margin: "8px 0 12px" }}>
          <legend>{t.dietaryTitle}</legend>
          <p className="muted" style={{ marginTop: 0 }}>{t.dietaryHelp}</p>
          <textarea value={dietary} onChange={(e) => setDietary(e.target.value)} maxLength={1000} />
          <label className="check">
            <input type="checkbox" checked={healthConsent} onChange={(e) => setHealthConsent(e.target.checked)} className={cls("healthConsent")} />
            <span>{t.dietaryConsent}</span>
          </label>
        </fieldset>
      )}

      <label className="check">
        <input type="checkbox" checked={isAdult} onChange={(e) => setAdult(e.target.checked)} className={cls("isAdult")} />
        <span>{t.adult}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={acceptTerms} onChange={(e) => setTerms(e.target.checked)} className={cls("acceptTerms")} />
        <span>
          {t.acceptTerms} (<Link href="/legal/termini" target="_blank">{t.terms}</Link>)
        </span>
      </label>
      <label className="check">
        <input type="checkbox" checked={noWithdrawal} onChange={(e) => setNoWithdrawal(e.target.checked)} className={cls("acknowledgeNoWithdrawal")} />
        <span>{t.noWithdrawal}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={privacyAck} onChange={(e) => setPrivacy(e.target.checked)} className={cls("privacyAcknowledged")} />
        <span>
          {t.privacyAck} (<Link href="/legal/privacy" target="_blank">{t.privacy}</Link>)
        </span>
      </label>

      <p className="notice">{t.payNotice}</p>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>
        {busy ? t.paying : `${t.payButton}${quote.ok ? ` · ${formatEuro(quote.quote.amountCents, locale)}` : ""}`}
      </button>
    </form>
  );
}
