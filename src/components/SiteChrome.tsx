"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { OPERATOR } from "@/lib/legal";
import { LocaleProvider, useI18n } from "@/lib/i18n";

function Header() {
  const { locale, setLocale, t } = useI18n();
  return (
    <header className="site">
      <div className="wrap">
        <Link href="/" className="brand">
          Attracco<small>{t.tagline}</small>
        </Link>
        <div className="lang" role="group" aria-label="Lingua / Language">
          <button aria-pressed={locale === "it"} onClick={() => setLocale("it")}>IT</button>{" "}
          <button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
        </div>
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
