"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ConciergeChat } from "@/components/ConciergeChat";
import { ServiceCard } from "@/components/ServiceCard";
import { SiteImg } from "@/components/SiteImg";
import { SERVICES, type Category } from "@/data/catalog";
import { GALLERY, type ImageKey } from "@/data/images";
import { useI18n } from "@/lib/i18n";

const CATEGORY_IMAGE: Record<Category, ImageKey> = {
  chef: "chef-dinner",
  driver: "itria-valley",
  sailing: "sailing-salento",
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  lock: "M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z",
  check: "M12 2l2.4 2.1 3.2-.3.8 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.8 3.1-3.2-.3L12 22l-2.4-2.1-3.2.3-.8-3.1L2.8 15.5l1.2-3-1.2-3 2.8-1.6.8-3.1 3.2.3zM8.5 12l2.5 2.5 4.5-5",
  euro: "M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z",
};

export default function Home() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Category | "all">("all");
  const visible = SERVICES.filter((s) => filter === "all" || s.category === filter);
  const categories: { key: Category; text: string }[] = [
    { key: "chef", text: t.chefText },
    { key: "driver", text: t.driverText },
    { key: "sailing", text: t.sailingText },
  ];

  const trust: [string, ReactNode][] = [
    [ICONS.lock, t.trust1],
    [ICONS.check, t.trust2],
    [ICONS.euro, t.trust3],
    [ICONS.chat, t.trust4],
  ];

  return (
    <>
      <div className="hero-full full-bleed">
        <SiteImg name="hero" showCredit priority />
        <div className="wrap">
          <span className="kicker">{t.heroKicker}</span>
          <h1>
            {t.heroTitleA} <em>{t.heroTitleB}</em>
          </h1>
          <p className="lead">{t.heroText2}</p>
          <ConciergeChat />
        </div>
      </div>

      <section aria-labelledby="cat-title">
        <div className="section-head">
          <div>
            <span className="eyebrow">{t.catEyebrow}</span>
            <h2 id="cat-title">{t.categoriesTitle}</h2>
          </div>
          <p>{t.catLead}</p>
        </div>
        <div className="categories">
          {categories.map((c) => (
            <Link
              key={c.key}
              className="category"
              href="/#servizi"
              onClick={() => setFilter(c.key)}
            >
              <SiteImg name={CATEGORY_IMAGE[c.key]} />
              <div className="body">
                <h3>{t[c.key]}</h3>
                <p>{c.text}</p>
                <span className="more">{t.explore}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="band-navy full-bleed" id="come-funziona">
        <div className="wrap">
          <section aria-labelledby="how-title">
            <div className="section-head">
              <div>
                <span className="eyebrow">{t.howEyebrow}</span>
                <h2 id="how-title">{t.howTitle}</h2>
              </div>
            </div>
            <div className="steps">
              <div className="step"><h3>{t.step1Title}</h3><p>{t.step1Text}</p></div>
              <div className="step"><h3>{t.step2Title}</h3><p>{t.step2Text}</p></div>
              <div className="step"><h3>{t.step3Title}</h3><p>{t.step3Text}</p></div>
            </div>
            <div className="trust">
              {trust.map(([d, label], i) => (
                <div key={i}>
                  <Icon d={d} />
                  {label}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section id="servizi" aria-labelledby="services-title" style={{ scrollMarginTop: 80 }}>
        <div className="section-head">
          <div>
            <span className="eyebrow">{t.servicesEyebrow}</span>
            <h2 id="services-title">{t.servicesTitle}</h2>
          </div>
          <div className="filters" role="group">
          {(["all", "chef", "driver", "sailing"] as const).map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? t.all : t[f]}
            </button>
          ))}
          </div>
        </div>
        <div className="grid">
          {visible.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      <section aria-labelledby="gallery-title" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div>
            <span className="eyebrow">{t.galleryEyebrow}</span>
            <h2 id="gallery-title">{t.galleryTitle}</h2>
          </div>
        </div>
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
