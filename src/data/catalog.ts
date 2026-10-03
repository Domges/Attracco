// Catalogo servizi e fornitori di Attracco (fase 1: solo Puglia).
//
// Il catalogo è la fonte unica per prezzi, aree servite e condizioni: il
// concierge AI lo legge tramite tool e il server ricalcola sempre il prezzo da
// qui, mai da quanto proposto dal modello o inviato dal browser.
//
// I dati dei fornitori tra parentesi quadre sono segnaposto da completare con i
// dati reali verificati in fase di onboarding (visura, licenze, polizze).

import type { ImageKey } from "./images";

export type Locale = "it" | "en";
export type Localized = Record<Locale, string>;
export type Category = "chef" | "driver" | "sailing";

export const REGION = "Puglia";

// Località servite. Qualsiasi richiesta fuori da questo elenco viene rifiutata
// sia dal concierge sia dalla validazione lato server.
export const PUGLIA_AREAS = [
  "Bari",
  "Polignano a Mare",
  "Monopoli",
  "Fasano",
  "Ostuni",
  "Alberobello",
  "Locorotondo",
  "Brindisi",
  "Lecce",
  "Otranto",
  "Gallipoli",
  "Santa Maria di Leuca",
  "Taranto",
  "Vieste",
  "Peschici",
] as const;
export type Area = (typeof PUGLIA_AREAS)[number];

export interface Licence {
  kind: Localized;
  number: string;
}

export interface Provider {
  id: string;
  legalName: string;
  vatNumber: string;
  registeredOffice: string;
  email: string;
  // Il fornitore è il professionista che eroga il servizio ed è controparte del
  // contratto con il turista (informazione obbligatoria per i marketplace).
  isTrader: true;
  licences: Licence[];
  insurance: string;
  // Nome della variabile d'ambiente con l'ID dell'account Stripe Connect.
  stripeAccountEnv: string;
}

export type PricingModel = "per_person" | "per_hour" | "flat";

export interface Service {
  id: string;
  category: Category;
  providerId: string;
  title: Localized;
  summary: Localized;
  description: Localized;
  includes: Localized;
  excludes: Localized;
  areas: readonly Area[];
  pricing: {
    model: PricingModel;
    // Prezzo unitario finale al consumatore, IVA inclusa ove dovuta, in centesimi.
    unitAmountCents: number;
    minUnits: number;
    maxUnits: number;
  };
  minGuests: number;
  maxGuests: number;
  // Mesi in cui il servizio è prenotabile (1 = gennaio).
  seasonMonths: readonly number[];
  startTimes: readonly string[];
  cancellation: Localized;
  // Il servizio richiede dati su allergie/intolleranze (dati relativi alla salute).
  collectsDietaryInfo: boolean;
  image: ImageKey;
}

const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const PROVIDERS: Provider[] = [
  {
    id: "chef-mare",
    legalName: "[Ragione sociale chef da confermare]",
    vatNumber: "[P.IVA da confermare]",
    registeredOffice: "[Sede legale da confermare], Puglia",
    email: "[email fornitore da confermare]",
    isTrader: true,
    licences: [
      {
        kind: { it: "Attestato formazione igiene alimenti (HACCP)", en: "Food hygiene (HACCP) training certificate" },
        number: "[estremi da confermare]",
      },
    ],
    insurance: "[Polizza RC professionale: compagnia e numero da confermare]",
    stripeAccountEnv: "STRIPE_ACCOUNT_CHEF_MARE",
  },
  {
    id: "ncc-levante",
    legalName: "[Ragione sociale NCC da confermare]",
    vatNumber: "[P.IVA da confermare]",
    registeredOffice: "[Sede/rimessa da confermare], Puglia",
    email: "[email fornitore da confermare]",
    isTrader: true,
    licences: [
      {
        kind: { it: "Autorizzazione NCC (L. 21/1992)", en: "Chauffeur-driven hire licence (NCC, Law 21/1992)" },
        number: "[n. autorizzazione e Comune di rilascio da confermare]",
      },
    ],
    insurance: "[Polizza RCA trasporto persone da confermare]",
    stripeAccountEnv: "STRIPE_ACCOUNT_NCC_LEVANTE",
  },
  {
    id: "vela-adriatico",
    legalName: "[Ragione sociale charter da confermare]",
    vatNumber: "[P.IVA da confermare]",
    registeredOffice: "[Sede legale da confermare], Puglia",
    email: "[email fornitore da confermare]",
    isTrader: true,
    licences: [
      {
        kind: { it: "Unità da diporto adibita a noleggio (D.Lgs. 171/2005)", en: "Pleasure craft registered for charter (Legislative Decree 171/2005)" },
        number: "[matricola unità e abilitazione skipper da confermare]",
      },
    ],
    insurance: "[Polizza RC unità da diporto e passeggeri da confermare]",
    stripeAccountEnv: "STRIPE_ACCOUNT_VELA_ADRIATICO",
  },
];

export const SERVICES: Service[] = [
  {
    id: "chef-cena-pugliese",
    image: "chef-dinner",
    category: "chef",
    providerId: "chef-mare",
    title: { it: "Chef privato — Cena pugliese a domicilio", en: "Private chef — Apulian dinner at your villa" },
    summary: {
      it: "Menù di 4 portate con prodotti locali, cucinato nella tua villa o masseria.",
      en: "4-course menu of local produce, cooked in your villa or masseria.",
    },
    description: {
      it: "Lo chef arriva con la spesa, cucina nella tua cucina e lascia tutto in ordine. Menù concordato in anticipo: antipasti pugliesi, orecchiette fatte a mano, pesce o carne del giorno, dolce. Disponibile anche in versione vegetariana.",
      en: "The chef arrives with the groceries, cooks in your kitchen and leaves it spotless. Menu agreed in advance: Apulian starters, hand-made orecchiette, catch or meat of the day, dessert. Vegetarian version available.",
    },
    includes: { it: "Spesa, preparazione, servizio al tavolo, riordino cucina.", en: "Groceries, cooking, table service, kitchen clean-up." },
    excludes: { it: "Vini e bevande (su richiesta, con supplemento).", en: "Wine and drinks (on request, extra charge)." },
    areas: ["Bari", "Polignano a Mare", "Monopoli", "Fasano", "Ostuni", "Alberobello", "Locorotondo"],
    pricing: { model: "per_person", unitAmountCents: 9500, minUnits: 2, maxUnits: 14 },
    minGuests: 2,
    maxGuests: 14,
    seasonMonths: ALL_YEAR,
    startTimes: ["19:30", "20:00", "20:30"],
    cancellation: {
      it: "Cancellazione gratuita fino a 72 ore prima. Dopo tale termine è trattenuto il 50% (costo della spesa già effettuata).",
      en: "Free cancellation up to 72 hours before. After that, 50% is retained (groceries already purchased).",
    },
    collectsDietaryInfo: true,
  },
  {
    id: "chef-cooking-class",
    image: "cooking-class",
    category: "chef",
    providerId: "chef-mare",
    title: { it: "Cooking class — Orecchiette e focaccia", en: "Cooking class — Orecchiette and focaccia" },
    summary: {
      it: "Lezione pratica di 3 ore con pranzo finale.",
      en: "3-hour hands-on lesson followed by lunch.",
    },
    description: {
      it: "Impara a fare orecchiette, focaccia barese e un sugo tradizionale con uno chef locale, poi pranza con quello che hai preparato.",
      en: "Learn to make orecchiette, Bari-style focaccia and a traditional sauce with a local chef, then enjoy what you made for lunch.",
    },
    includes: { it: "Ingredienti, attrezzatura, ricette, pranzo.", en: "Ingredients, equipment, recipes, lunch." },
    excludes: { it: "Trasferimenti.", en: "Transfers." },
    areas: ["Bari", "Polignano a Mare", "Monopoli", "Ostuni", "Lecce"],
    pricing: { model: "per_person", unitAmountCents: 7500, minUnits: 2, maxUnits: 10 },
    minGuests: 2,
    maxGuests: 10,
    seasonMonths: ALL_YEAR,
    startTimes: ["10:00", "16:00"],
    cancellation: {
      it: "Cancellazione gratuita fino a 48 ore prima; dopo, nessun rimborso.",
      en: "Free cancellation up to 48 hours before; no refund afterwards.",
    },
    collectsDietaryInfo: true,
  },
  {
    id: "ncc-aeroporto",
    image: "airport-transfer",
    category: "driver",
    providerId: "ncc-levante",
    title: { it: "Autista NCC — Transfer aeroporto", en: "Private driver — Airport transfer" },
    summary: {
      it: "Transfer privato da/per gli aeroporti di Bari o Brindisi, prezzo fisso.",
      en: "Private transfer to/from Bari or Brindisi airport, fixed price.",
    },
    description: {
      it: "Berlina o van fino a 7 passeggeri con autista professionista NCC. Prezzo fisso concordato, monitoraggio del volo, attesa inclusa fino a 60 minuti.",
      en: "Sedan or van up to 7 passengers with a licensed professional driver (NCC). Fixed agreed price, flight tracking, up to 60 minutes waiting included.",
    },
    includes: { it: "Carburante, pedaggi, attesa fino a 60 min, bagagli standard.", en: "Fuel, tolls, up to 60 min waiting, standard luggage." },
    excludes: { it: "Soste intermedie non concordate.", en: "Unscheduled intermediate stops." },
    areas: ["Bari", "Brindisi", "Polignano a Mare", "Monopoli", "Fasano", "Ostuni", "Alberobello", "Lecce"],
    pricing: { model: "flat", unitAmountCents: 12000, minUnits: 1, maxUnits: 1 },
    minGuests: 1,
    maxGuests: 7,
    seasonMonths: ALL_YEAR,
    startTimes: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
    cancellation: {
      it: "Cancellazione gratuita fino a 24 ore prima; dopo, nessun rimborso.",
      en: "Free cancellation up to 24 hours before; no refund afterwards.",
    },
    collectsDietaryInfo: false,
  },
  {
    id: "ncc-tour-giornata",
    image: "itria-valley",
    category: "driver",
    providerId: "ncc-levante",
    title: { it: "Autista NCC a disposizione — Tour della Valle d'Itria", en: "Private driver at your disposal — Itria Valley tour" },
    summary: {
      it: "Autista privato a ore per visitare Alberobello, Locorotondo, Cisternino, Ostuni.",
      en: "Hourly private driver to visit Alberobello, Locorotondo, Cisternino, Ostuni.",
    },
    description: {
      it: "Autista NCC a disposizione per l'itinerario che preferisci (minimo 4 ore). Partenza dal tuo alloggio, soste libere lungo il percorso concordato.",
      en: "Licensed driver at your disposal for the itinerary you prefer (minimum 4 hours). Pick-up at your accommodation, free stops along the agreed route.",
    },
    includes: { it: "Carburante, pedaggi, parcheggi.", en: "Fuel, tolls, parking." },
    excludes: { it: "Ingressi a musei e guide turistiche.", en: "Museum tickets and tour guides." },
    areas: ["Bari", "Polignano a Mare", "Monopoli", "Fasano", "Ostuni", "Alberobello", "Locorotondo"],
    pricing: { model: "per_hour", unitAmountCents: 6000, minUnits: 4, maxUnits: 10 },
    minGuests: 1,
    maxGuests: 7,
    seasonMonths: ALL_YEAR,
    startTimes: ["08:30", "09:30", "14:00"],
    cancellation: {
      it: "Cancellazione gratuita fino a 24 ore prima; dopo, nessun rimborso.",
      en: "Free cancellation up to 24 hours before; no refund afterwards.",
    },
    collectsDietaryInfo: false,
  },
  {
    id: "vela-mezza-giornata",
    image: "sailing-polignano",
    category: "sailing",
    providerId: "vela-adriatico",
    title: { it: "Barca a vela — Mezza giornata a Polignano", en: "Sailing — Half day off Polignano" },
    summary: {
      it: "4 ore in barca a vela con skipper, bagno nelle calette e grotte.",
      en: "4 hours under sail with skipper, swim stops at coves and sea caves.",
    },
    description: {
      it: "Uscita condivisa o privata (fino a 8 ospiti) su barca a vela di 13 m con skipper abilitato. Navigazione lungo la costa tra Monopoli e Polignano, soste bagno, aperitivo a bordo.",
      en: "Private sail (up to 8 guests) on a 13 m sailing yacht with a licensed skipper. Coastal sailing between Monopoli and Polignano, swim stops, aperitivo on board.",
    },
    includes: { it: "Skipper, carburante, aperitivo, maschere da snorkeling, assicurazione.", en: "Skipper, fuel, aperitivo, snorkelling masks, insurance." },
    excludes: { it: "Trasferimento al porto.", en: "Transfer to the marina." },
    areas: ["Polignano a Mare", "Monopoli"],
    pricing: { model: "flat", unitAmountCents: 65000, minUnits: 1, maxUnits: 1 },
    minGuests: 1,
    maxGuests: 8,
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    startTimes: ["09:30", "15:00"],
    cancellation: {
      it: "Cancellazione gratuita fino a 7 giorni prima; 50% fino a 72 ore prima; dopo, nessun rimborso. In caso di condizioni meteo avverse valutate dallo skipper l'uscita è riprogrammata o rimborsata integralmente.",
      en: "Free cancellation up to 7 days before; 50% up to 72 hours before; no refund afterwards. If the skipper judges weather conditions unsafe, the trip is rescheduled or fully refunded.",
    },
    collectsDietaryInfo: false,
  },
  {
    id: "vela-tramonto-salento",
    image: "sailing-salento",
    category: "sailing",
    providerId: "vela-adriatico",
    title: { it: "Barca a vela — Tramonto nel Salento", en: "Sailing — Salento sunset cruise" },
    summary: {
      it: "3 ore al tramonto da Gallipoli con skipper e aperitivo.",
      en: "3-hour sunset sail from Gallipoli with skipper and aperitivo.",
    },
    description: {
      it: "Uscita privata al tramonto lungo la costa ionica, con sosta bagno all'Isola di Sant'Andrea (meteo permettendo) e aperitivo con prodotti salentini.",
      en: "Private sunset sail along the Ionian coast, with a swim stop near Sant'Andrea island (weather permitting) and an aperitivo of Salento produce.",
    },
    includes: { it: "Skipper, carburante, aperitivo, assicurazione.", en: "Skipper, fuel, aperitivo, insurance." },
    excludes: { it: "Trasferimento al porto.", en: "Transfer to the marina." },
    areas: ["Gallipoli", "Santa Maria di Leuca"],
    pricing: { model: "flat", unitAmountCents: 52000, minUnits: 1, maxUnits: 1 },
    minGuests: 1,
    maxGuests: 8,
    seasonMonths: [5, 6, 7, 8, 9],
    startTimes: ["18:00", "18:30"],
    cancellation: {
      it: "Cancellazione gratuita fino a 7 giorni prima; 50% fino a 72 ore prima; dopo, nessun rimborso. In caso di condizioni meteo avverse valutate dallo skipper l'uscita è riprogrammata o rimborsata integralmente.",
      en: "Free cancellation up to 7 days before; 50% up to 72 hours before; no refund afterwards. If the skipper judges weather conditions unsafe, the trip is rescheduled or fully refunded.",
    },
    collectsDietaryInfo: false,
  },
];

export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function isPugliaArea(value: string): value is Area {
  return (PUGLIA_AREAS as readonly string[]).includes(value);
}
