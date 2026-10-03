"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { OPERATOR } from "@/lib/legal";
import { LocaleProvider, useI18n } from "@/lib/i18n";

function Logo() {
  // Ancora stilizzata: richiama il nome "Attracco".
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 7.5V21M7 11h10M4.5 14.5a7.5 6.5 0 0 0 15 0" />
    </svg>
  );
}

function Header() {
  const { locale, setLocale, t } = useI18n();
  return (
    <header className="site">
      <div className="wrap">
        <Link href="/" className="brand">
          <Logo />
          <span>
            Attracco <small>{t.tagline}</small>
          </span>
        </Link>
        <nav className="nav" aria-label="Menu">
          <Link className="nav-link" href="/#servizi">{t.navServices}</Link>
          <Link className="nav-link" href="/#come-funziona">{t.navHow}</Link>
          <div className="lang" role="group" aria-label="Lingua / Language">
            <button aria-pressed={locale === "it"} onClick={() => setLocale("it")}>IT</button>
            <button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site">
      <div className="wrap">
        <div>{t.footerOperator}</div>
        <div>
          {OPERATOR.name} · P.IVA {OPERATOR.vatNumber} · {OPERATOR.registeredOffice} · {OPERATOR.email}
        </div>
        <nav>
          <Link href="/legal/termini">{t.terms}</Link>
          <Link href="/legal/privacy">{t.privacy}</Link>
          <Link href="/legal/cookie">{t.cookies}</Link>
          <Link href="/legal/concierge-ai">{t.aiInfo}</Link>
          <Link href="/legal/note-legali">{t.legalNotes}</Link>
          <Link href="/legal/crediti-immagini">{t.imageCredits}</Link>
        </nav>
      </div>
    </footer>
  );
}

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <Header />
      <main className="wrap">{children}</main>
      <Footer />
    </LocaleProvider>
  );
}
