"use client";

import { useSearchParams } from "next/navigation";
import { getProvider, getService } from "@/data/catalog";
import { useI18n } from "@/lib/i18n";
import { formatEuro } from "@/lib/pricing";
import { BookingForm } from "./BookingForm";
import { SiteImg } from "./SiteImg";

const MONTHS = {
  it: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export function ServiceDetail({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const service = getService(id)!;
  const provider = getProvider(service.providerId)!;
  const basis = { per_person: t.perPerson, per_hour: t.perHour, flat: t.flat }[service.pricing.model];
  const season =
    service.seasonMonths.length === 12
      ? t.allYear
      : `${MONTHS[locale][service.seasonMonths[0] - 1]} – ${MONTHS[locale][service.seasonMonths[service.seasonMonths.length - 1] - 1]}`;

  return (
    <div className="two" style={{ marginTop: 28 }}>
      <div>
        <span className="tag">{t[service.category]}</span>
        <h1 style={{ marginTop: 8 }}>{service.title[locale]}</h1>
        <SiteImg name={service.image} className="detail-image" showCredit priority />
        <p>
          <span className="price">{formatEuro(service.pricing.unitAmountCents, locale)}</span> <span className="muted">{basis}</span>
        </p>
        <p>{service.description[locale]}</p>
        <p><strong>{t.includes}:</strong> {service.includes[locale]}</p>
        <p><strong>{t.excludes}:</strong> {service.excludes[locale]}</p>
        <p><strong>{t.areas}:</strong> {service.areas.join(", ")}</p>
        <p><strong>{t.season}:</strong> {season}</p>
        <p><strong>{t.cancellation}:</strong> {service.cancellation[locale]}</p>
        <div className="card" style={{ marginTop: 16 }}>
          <strong>{t.provider}</strong>
          <div>{provider.legalName} · P.IVA {provider.vatNumber}</div>
          <div className="muted">{provider.registeredOffice}</div>
          <div style={{ marginTop: 6 }}>
            {t.licences}:{" "}
            {provider.licences.map((l) => `${l.kind[locale]} — ${l.number}`).join("; ")}
          </div>
          <div className="muted">{provider.insurance}</div>
          <p className="muted" style={{ marginBottom: 0 }}>{t.providerNote}</p>
        </div>
      </div>
      <div id="prenota">
        {params.get("cancelled") && <p className="notice">{t.cancelledNotice}</p>}
        <BookingForm
          service={service}
          initial={{
            date: params.get("date") ?? "",
            time: params.get("time") ?? "",
            guests: params.get("guests") ?? "",
            area: params.get("area") ?? "",
            hours: params.get("hours") ?? "",
          }}
        />
      </div>
    </div>
  );
}
