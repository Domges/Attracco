"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

// Documento legale bilingue: il testo italiano fa fede; la versione inglese è
// fornita per i turisti stranieri. Le parti tra [parentesi quadre] sono da completare.
export function LegalDoc({ version, it, en }: { version: string; it: ReactNode; en: ReactNode }) {
  const { locale } = useI18n();
  return (
    <article className="legal">
      {locale === "it" ? it : en}
      <p className="muted" style={{ marginTop: 32 }}>
        {locale === "it" ? "Versione" : "Version"} {version}
        {locale === "en" && " — In case of discrepancy, the Italian version prevails to the extent permitted by mandatory consumer law."}
      </p>
    </article>
  );
}
