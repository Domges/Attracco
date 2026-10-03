"use client";

import { siteImage, type ImageKey } from "@/data/images";
import { useI18n } from "@/lib/i18n";

/** Immagine del sito; per le foto di terzi mostra l'attribuzione richiesta dalla licenza. */
export function SiteImg({
  name,
  className,
  showCredit = false,
  priority = false,
}: {
  name: ImageKey;
  className?: string;
  showCredit?: boolean;
  priority?: boolean;
}) {
  const { locale } = useI18n();
  const img = siteImage(name);
  return (
    <figure className={`site-img ${className ?? ""}`}>
      <img src={img.src} alt={img.alt[locale]} loading={priority ? "eager" : "lazy"} decoding="async" />
      {showCredit && img.credit && (
        <figcaption className="credit">
          {"Foto: "}
          <a href={img.credit.sourceUrl} target="_blank" rel="noopener noreferrer">
            {img.credit.author}
          </a>
          {", "}
          {img.credit.licenseUrl ? (
            <a href={img.credit.licenseUrl} target="_blank" rel="noopener noreferrer license">
              {img.credit.license}
            </a>
          ) : (
            img.credit.license
          )}
        </figcaption>
      )}
    </figure>
  );
}
