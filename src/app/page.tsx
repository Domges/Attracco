"use client";

import { ConciergeChat } from "@/components/ConciergeChat";
import { ServiceCard } from "@/components/ServiceCard";
import { SERVICES } from "@/data/catalog";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();
  return (
    <>
      <div className="hero">
        <h1>{t.heroTitle}</h1>
        <p>{t.heroText}</p>
      </div>
      <section>
        <ConciergeChat />
      </section>
      <section>
        <h2>{t.services}</h2>
        <div className="grid">
          {SERVICES.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>
    </>
  );
}
