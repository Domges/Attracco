// Registro delle immagini del sito.
//
// Ogni immagine ha un'illustrazione originale (realizzata per Attracco, nessun
// diritto di terzi) e può essere sostituita da una fotografia reale scaricata
// con `npm run images:fetch`, che verifica la licenza su Wikimedia Commons e
// registra autore, licenza e fonte in `photo-credits.json`. Se la foto è
// presente, il sito la usa automaticamente e ne pubblica i crediti.

import type { Localized } from "./catalog";
import photoCredits from "./photo-credits.json";

export type ImageKey =
  | "hero"
  | "chef-dinner"
  | "cooking-class"
  | "airport-transfer"
  | "itria-valley"
  | "sailing-polignano"
  | "sailing-salento"
  | "ostuni";

export interface PhotoCredit {
  file: string; // percorso pubblico, es. /images/photos/hero.jpg
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  sourceUrl: string;
  retrievedAt: string;
}

export interface SiteImage {
  key: ImageKey;
  src: string;
  alt: Localized;
  // Presente solo per le fotografie di terzi (attribuzione obbligatoria per CC BY / CC BY-SA).
  credit?: PhotoCredit;
}

const ILLUSTRATIONS: Record<ImageKey, { src: string; alt: Localized }> = {
  hero: {
    src: "/images/illustrations/polignano.svg",
    alt: { it: "Scogliera di Polignano a Mare con le case bianche affacciate sul mare", en: "Polignano a Mare cliffs with white houses overlooking the sea" },
  },
  "chef-dinner": {
    src: "/images/illustrations/chef.svg",
    alt: { it: "Tavola all'aperto con orecchiette, pane e vino tra gli ulivi", en: "Outdoor table with orecchiette, bread and wine among olive trees" },
  },
  "cooking-class": {
    src: "/images/illustrations/cooking.svg",
    alt: { it: "Orecchiette fatte a mano su un tagliere di legno", en: "Hand-made orecchiette on a wooden board" },
  },
  "airport-transfer": {
    src: "/images/illustrations/road.svg",
    alt: { it: "Auto con autista su una strada tra ulivi e muretti a secco", en: "Chauffeur-driven car on a road between olive trees and dry-stone walls" },
  },
  "itria-valley": {
    src: "/images/illustrations/trulli.svg",
    alt: { it: "Trulli della Valle d'Itria tra gli ulivi", en: "Trulli in the Itria Valley among olive trees" },
  },
  "sailing-polignano": {
    src: "/images/illustrations/sailing.svg",
    alt: { it: "Barca a vela nel mare turchese della costa pugliese", en: "Sailing boat on the turquoise sea of the Apulian coast" },
  },
  "sailing-salento": {
    src: "/images/illustrations/sunset.svg",
    alt: { it: "Tramonto sul mare del Salento con una barca a vela", en: "Sunset over the Salento sea with a sailing boat" },
  },
  ostuni: {
    src: "/images/illustrations/ostuni.svg",
    alt: { it: "Ostuni, la città bianca sulla collina", en: "Ostuni, the white town on the hill" },
  },
};

const PHOTOS = photoCredits as Partial<Record<ImageKey, PhotoCredit>>;

export function siteImage(key: ImageKey): SiteImage {
  const base = ILLUSTRATIONS[key];
  const photo = PHOTOS[key];
  return photo ? { key, src: photo.file, alt: base.alt, credit: photo } : { key, ...base };
}

export const ALL_IMAGE_KEYS = Object.keys(ILLUSTRATIONS) as ImageKey[];

// Galleria "La Puglia" in home: luoghi serviti da Attracco.
export const GALLERY: { key: ImageKey; place: string }[] = [
  { key: "hero", place: "Polignano a Mare" },
  { key: "itria-valley", place: "Valle d'Itria" },
  { key: "ostuni", place: "Ostuni" },
  { key: "sailing-salento", place: "Salento" },
];
