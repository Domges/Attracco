"use client";

import { ConciergeChat } from "@/components/ConciergeChat";
import { ServiceCard } from "@/components/ServiceCard";
import { SiteImg } from "@/components/SiteImg";
import { SERVICES } from "@/data/catalog";
import { GALLERY } from "@/data/images";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();
  return (
    <>
      <div className="hero has-image">
        <SiteImg name="hero" showCredit priority />
        <div className="hero-text">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
        </div>
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
      <section>
        <h2>{t.galleryTitle}</h2>
        <div className="gallery">
          {GALLERY.map((g) => (
            <div key={g.key} className="gallery-item">
              <SiteImg name={g.key} />
              <span className="place">{g.place}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
