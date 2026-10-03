import type { ReactNode } from "react";
import { PROVIDER_DOCS_DRAFT } from "@/lib/legal";

// Documento legale per i fornitori: solo in italiano (rapporto B2B con
// professionisti stabiliti in Italia). Le parti tra [parentesi quadre] sono da completare.
export function ProviderLegalDoc({ version, children }: { version: string; children: ReactNode }) {
  return (
    <article className="legal">
      {PROVIDER_DOCS_DRAFT && (
        <p className="notice">Bozza in corso di validazione: il testo definitivo sarà comunicato prima dell&apos;adesione.</p>
      )}
      {children}
      <p className="muted" style={{ marginTop: 32 }}>Versione {version}</p>
    </article>
  );
}
