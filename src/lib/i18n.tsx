"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/data/catalog";

const it = {
  tagline: "Il tuo concierge in Puglia",
  heroTitle: "Chef privato, autista e barca a vela in Puglia. Chiedi al concierge.",
  heroText:
    "Racconta cosa desideri: il concierge AI ti propone il servizio giusto tra professionisti locali selezionati, con prezzo chiaro e pagamento sicuro.",
  services: "Servizi",
  galleryTitle: "La Puglia che ti aspetta",
  imageCredits: "Crediti immagini",
  chef: "Chef privato",
  driver: "Autista NCC",
  sailing: "Barca a vela",
  from: "da",
  perPerson: "a persona",
  perHour: "all'ora",
  flat: "prezzo fisso",
  details: "Dettagli e prenotazione",
  aiBadge: "Assistente AI",
  aiNotice:
    "Stai parlando con un sistema di intelligenza artificiale, non con una persona. Le risposte possono contenere errori: prezzi e condizioni validi sono quelli del riepilogo di prenotazione. Non inserire in chat dati personali o sanitari.",
  aiNoticeLink: "Come funziona il concierge AI",
  chatPlaceholder: "Es. cena per 6 a Ostuni il 14 agosto…",
  send: "Invia",
  chatWelcome:
    "Ciao! Sono il concierge AI di Attracco. Posso aiutarti a prenotare uno chef privato, un autista NCC o un'uscita in barca a vela in Puglia. Cosa ti piacerebbe fare?",
  chatErrorUnavailable: "Il concierge non è disponibile in questo momento. Puoi comunque prenotare dalle schede dei servizi.",
  chatErrorRefused: "Non posso aiutarti con questa richiesta. Posso però suggerirti chef, autisti o uscite in barca in Puglia.",
  chatErrorRate: "Troppi messaggi in poco tempo. Riprova tra un minuto.",
  chatErrorLong: "La risposta è stata interrotta. Prova a riformulare la domanda in modo più breve.",
  book: "Prenota",
  total: "Totale",
  guests: "ospiti",
  hours: "ore",
  includes: "Incluso",
  excludes: "Escluso",
  cancellation: "Cancellazione",
  provider: "Fornitore del servizio",
  providerNote:
    "Il servizio è erogato e venduto da questo professionista, che è la tua controparte contrattuale. Attracco gestisce la piattaforma e la prenotazione.",
  licences: "Abilitazioni",
  areas: "Zone servite",
  season: "Stagione",
  allYear: "tutto l'anno",
  formTitle: "Prenota",
  date: "Data",
  startTime: "Orario di inizio",
  area: "Località",
  numGuests: "Numero di ospiti",
  numHours: "Numero di ore",
  name: "Nome e cognome",
  email: "Email",
  phone: "Telefono (con prefisso)",
  pickup: "Indirizzo di partenza (o volo e aeroporto)",
  notes: "Note per il fornitore (facoltative)",
  dietaryTitle: "Allergie e intolleranze (facoltativo)",
  dietaryHelp:
    "Indica allergie o intolleranze degli ospiti così che lo chef possa preparare un menù sicuro. Si tratta di dati relativi alla salute: li trattiamo solo con il tuo consenso esplicito, li condividiamo solo con lo chef e li cancelliamo 7 giorni dopo il servizio.",
  dietaryConsent:
    "Acconsento al trattamento dei dati su allergie e intolleranze indicati sopra, al solo fine di preparare il menù (art. 9.2.a GDPR). Posso revocare il consenso in qualsiasi momento.",
  adult: "Dichiaro di avere almeno 18 anni.",
  acceptTerms: "Ho letto e accetto i Termini e condizioni e la politica di cancellazione del servizio.",
  noWithdrawal:
    "Prendo atto che, trattandosi di un servizio per il tempo libero da prestare in una data determinata, non si applica il diritto di recesso di 14 giorni; restano valide le condizioni di cancellazione indicate.",
  privacyAck: "Ho letto l'Informativa privacy.",
  payNotice:
    "Verrai reindirizzato alla pagina di pagamento sicura di Stripe. La carta viene solo pre-autorizzata: l'addebito avviene quando il fornitore conferma (entro 48 ore). Se non conferma, l'importo viene sbloccato.",
  payButton: "Procedi al pagamento",
  paying: "Reindirizzamento…",
  formError: "Controlla i campi evidenziati.",
  quoteError: "La combinazione scelta non è disponibile (data, orario, località o numero di ospiti).",
  genericError: "Si è verificato un errore. Riprova più tardi.",
  cancelledNotice: "Pagamento annullato: nessun importo è stato addebitato.",
  successTitle: "Richiesta di prenotazione inviata",
  successText:
    "Grazie! La carta è stata pre-autorizzata. Il fornitore confermerà entro 48 ore: riceverai la ricevuta da Stripe all'addebito. Conserva il codice di prenotazione.",
  reference: "Codice prenotazione",
  backHome: "Torna alla home",
  footerOperator: "Attracco è un marketplace: i servizi sono venduti ed erogati da professionisti indipendenti.",
  privacy: "Privacy",
  terms: "Termini",
  cookies: "Cookie",
  legalNotes: "Note legali",
  aiInfo: "Concierge AI",
  odr: "Risoluzione delle controversie",
  navServices: "Servizi",
  navHow: "Come funziona",
  heroKicker: "Puglia · chef, autisti, barca a vela",
  heroTitle2: "La tua Puglia, senza pensieri",
  heroText2: "Dicci cosa desideri: il concierge trova il servizio giusto tra professionisti locali e ti mostra subito il prezzo.",
  askTitle: "Cosa vorresti fare?",
  askHint: "Scrivi liberamente o scegli un suggerimento",
  chips: ["Cena con chef privato per 6 persone a Ostuni", "Transfer dall'aeroporto di Bari a Polignano", "Uscita in barca a vela al tramonto", "Tour dei trulli con autista"],
  categoriesTitle: "Cosa puoi prenotare",
  chefText: "Cene a domicilio e cooking class con chef locali",
  driverText: "Transfer e tour con autisti NCC autorizzati",
  sailingText: "Uscite con skipper tra calette e tramonti",
  explore: "Scopri",
  howTitle: "Come funziona",
  step1Title: "Chiedi al concierge",
  step1Text: "Racconta cosa ti piacerebbe fare: ti proponiamo il servizio adatto con il prezzo finale.",
  step2Title: "Prenota in due minuti",
  step2Text: "Compili il modulo e paghi in sicurezza con Stripe: la carta è solo pre-autorizzata.",
  step3Title: "Il professionista conferma",
  step3Text: "Entro 48 ore ricevi la conferma. Se non è disponibile, non paghi nulla.",
  trust1: "Pagamento sicuro con Stripe",
  trust2: "Professionisti locali verificati",
  trust3: "Prezzi finali, nessun costo nascosto",
  trust4: "Assistenza in italiano e inglese",
  all: "Tutti",
  servicesTitle: "Scegli la tua esperienza",
};

const en: typeof it = {
  tagline: "Your concierge in Puglia",
  heroTitle: "Private chef, driver and sailing in Puglia. Ask the concierge.",
  heroText:
    "Tell us what you'd like: the AI concierge suggests the right service from selected local professionals, with clear prices and secure payment.",
  services: "Services",
  galleryTitle: "The Puglia waiting for you",
  imageCredits: "Image credits",
  chef: "Private chef",
  driver: "Private driver",
  sailing: "Sailing",
  from: "from",
  perPerson: "per person",
  perHour: "per hour",
  flat: "flat price",
  details: "Details and booking",
  aiBadge: "AI assistant",
  aiNotice:
    "You are chatting with an artificial intelligence system, not a person. Answers may contain mistakes: the prices and terms that apply are those shown in the booking summary. Please don't share personal or health data in the chat.",
  aiNoticeLink: "How the AI concierge works",
  chatPlaceholder: "E.g. dinner for 6 in Ostuni on 14 August…",
  send: "Send",
  chatWelcome:
    "Hi! I'm Attracco's AI concierge. I can help you book a private chef, a licensed driver or a sailing trip in Puglia. What would you like to do?",
  chatErrorUnavailable: "The concierge is unavailable right now. You can still book from the service pages.",
  chatErrorRefused: "I can't help with that request, but I'm happy to suggest chefs, drivers or sailing trips in Puglia.",
  chatErrorRate: "Too many messages in a short time. Please try again in a minute.",
  chatErrorLong: "The answer was cut short. Please try a shorter question.",
  book: "Book",
  total: "Total",
  guests: "guests",
  hours: "hours",
  includes: "Included",
  excludes: "Not included",
  cancellation: "Cancellation",
  provider: "Service provider",
  providerNote:
    "This professional sells and performs the service and is your contractual counterparty. Attracco operates the platform and handles the booking.",
  licences: "Licences",
  areas: "Areas served",
  season: "Season",
  allYear: "all year",
  formTitle: "Book",
  date: "Date",
  startTime: "Start time",
  area: "Location",
  numGuests: "Number of guests",
  numHours: "Number of hours",
  name: "Full name",
  email: "Email",
  phone: "Phone (with country code)",
  pickup: "Pick-up address (or flight and airport)",
  notes: "Notes for the provider (optional)",
  dietaryTitle: "Allergies and intolerances (optional)",
  dietaryHelp:
    "Tell us about any allergies or intolerances so the chef can prepare a safe menu. This is health data: we process it only with your explicit consent, share it only with the chef and delete it 7 days after the service.",
  dietaryConsent:
    "I consent to the processing of the allergy and intolerance data above, solely to prepare the menu (Art. 9(2)(a) GDPR). I can withdraw consent at any time.",
  adult: "I confirm I am at least 18 years old.",
  acceptTerms: "I have read and accept the Terms and conditions and the service's cancellation policy.",
  noWithdrawal:
    "I acknowledge that, as this is a leisure service to be provided on a specific date, the 14-day right of withdrawal does not apply; the cancellation terms shown still apply.",
  privacyAck: "I have read the Privacy notice.",
  payNotice:
    "You will be redirected to Stripe's secure payment page. Your card is only pre-authorised: it is charged when the provider confirms (within 48 hours). If they don't confirm, the hold is released.",
  payButton: "Proceed to payment",
  paying: "Redirecting…",
  formError: "Please check the highlighted fields.",
  quoteError: "The selected combination is not available (date, time, location or number of guests).",
  genericError: "Something went wrong. Please try again later.",
  cancelledNotice: "Payment cancelled: you have not been charged.",
  successTitle: "Booking request sent",
  successText:
    "Thank you! Your card has been pre-authorised. The provider will confirm within 48 hours and Stripe will email your receipt when you are charged. Keep your booking reference.",
  reference: "Booking reference",
  backHome: "Back to home",
  footerOperator: "Attracco is a marketplace: services are sold and performed by independent professionals.",
  privacy: "Privacy",
  terms: "Terms",
  cookies: "Cookies",
  legalNotes: "Legal notice",
  aiInfo: "AI concierge",
  odr: "Dispute resolution",
  navServices: "Services",
  navHow: "How it works",
  heroKicker: "Puglia · chefs, drivers, sailing",
  heroTitle2: "Your Puglia, stress-free",
  heroText2: "Tell us what you'd like: the concierge finds the right service among local professionals and shows you the price straight away.",
  askTitle: "What would you like to do?",
  askHint: "Type freely or pick a suggestion",
  chips: ["Private chef dinner for 6 in Ostuni", "Transfer from Bari airport to Polignano", "Sunset sailing trip", "Trulli tour with a driver"],
  categoriesTitle: "What you can book",
  chefText: "Dinners at your villa and cooking classes with local chefs",
  driverText: "Transfers and tours with licensed drivers",
  sailingText: "Skippered trips to coves and sunsets",
  explore: "Explore",
  howTitle: "How it works",
  step1Title: "Ask the concierge",
  step1Text: "Tell us what you'd like to do: we suggest the right service with the final price.",
  step2Title: "Book in two minutes",
  step2Text: "Fill in the form and pay securely with Stripe: your card is only pre-authorised.",
  step3Title: "The professional confirms",
  step3Text: "You get confirmation within 48 hours. If they're not available, you pay nothing.",
  trust1: "Secure payment with Stripe",
  trust2: "Verified local professionals",
  trust3: "Final prices, no hidden fees",
  trust4: "Help in Italian and English",
  all: "All",
  servicesTitle: "Choose your experience",
};

const dict: Record<Locale, typeof it> = { it, en };

export type Dict = typeof it;

const Ctx = createContext<{ locale: Locale; t: Dict; setLocale: (l: Locale) => void }>({
  locale: "it",
  t: dict.it,
  setLocale: () => {},
});

const STORAGE_KEY = "attracco-lang";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("it");

  useEffect(() => {
    // Preferenza di lingua: archiviazione tecnica/funzionale, non richiede consenso.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (stored === "it" || stored === "en") setLocaleState(stored);
    else if (!navigator.language.toLowerCase().startsWith("it")) setLocaleState("en");
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  };

  return <Ctx.Provider value={{ locale, t: dict[locale], setLocale }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
