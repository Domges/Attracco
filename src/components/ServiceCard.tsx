"use client";

import Link from "next/link";
import type { Service } from "@/data/catalog";
import { useI18n } from "@/lib/i18n";
import { formatEuro } from "@/lib/pricing";
import { SiteImg } from "./SiteImg";

export function ServiceCard({ service }: { service: Service }) {
  const { t, locale } = useI18n();
  const basis = { per_person: t.perPerson, per_hour: t.perHour, flat: t.flat }[service.pricing.model];
  return (
    <article className="card with-image">
      <SiteImg name={service.image} />
      <div className="card-body">
        <span className="tag">{t[service.category]}</span>
        <h3>{service.title[locale]}</h3>
        <p className="muted">{service.summary[locale]}</p>
        <p>
          <span className="price">{formatEuro(service.pricing.unitAmountCents, locale)}</span> <span className="muted">{basis}</span>
        </p>
        <Link className="btn secondary" href={`/servizi/${service.id}`}>
          {t.details}
        </Link>
      </div>
    </article>
  );
}
