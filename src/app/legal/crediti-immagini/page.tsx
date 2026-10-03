"use client";

import { ALL_IMAGE_KEYS, siteImage } from "@/data/images";
import { useI18n } from "@/lib/i18n";

export default function ImageCredits() {
  const { locale, t } = useI18n();
  const it = locale === "it";
  return (
    <article className="legal">
      <h1>{t.imageCredits}</h1>
      <p>
        {it
          ? "Le illustrazioni senza crediti sono opere originali realizzate per Attracco. Le fotografie di terzi sono utilizzate secondo la licenza indicata; possono essere state ridimensionate o ritagliate per la visualizzazione."
          : "Illustrations without credits are original works made for Attracco. Third-party photographs are used under the licence shown; they may have been resized or cropped for display."}
      </p>
      <ul>
        {ALL_IMAGE_KEYS.map((key) => {
          const img = siteImage(key);
          return (
            <li key={key} style={{ marginBottom: 8 }}>
              {img.alt[locale]} —{" "}
              {img.credit ? (
                <>
                  &laquo;{img.credit.title}&raquo;, {img.credit.author},{" "}
                  {img.credit.licenseUrl ? <a href={img.credit.licenseUrl} rel="license noopener noreferrer" target="_blank">{img.credit.license}</a> : img.credit.license}
                  {", "}
                  <a href={img.credit.sourceUrl} target="_blank" rel="noopener noreferrer">{it ? "fonte" : "source"}</a>
                </>
              ) : (
                <span className="muted">{it ? "illustrazione originale Attracco" : "original Attracco illustration"}</span>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
