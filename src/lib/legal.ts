// Versioni dei documenti legali. Ogni prenotazione registra la versione
// accettata, così da poter provare quale testo era in vigore (accountability).
// Aggiornare la versione a ogni modifica sostanziale dei testi in /legal.
export const TERMS_VERSION = "2026-10-02";
export const PRIVACY_VERSION = "2026-10-02";
// Documenti per i fornitori: condizioni di adesione (P2B) e informativa privacy.
// Ogni modifica delle condizioni va comunicata ai fornitori con il preavviso
// previsto dall'art. 3 Reg. (UE) 2019/1150 e richiede una nuova accettazione.
export const PROVIDER_TERMS_VERSION = "2026-10-03";
export const PROVIDER_PRIVACY_VERSION = "2026-10-03";
// Finché è true le pagine per i fornitori mostrano l'avviso di bozza.
export const PROVIDER_DOCS_DRAFT = true;
// Commissione indicata nelle Condizioni per i fornitori: deve coincidere con PLATFORM_FEE_BPS.
export const PROVIDER_FEE_TEXT = "[15]% del prezzo pagato dal Cliente, IVA inclusa";
// Foro competente per le controversie con i fornitori.
export const PROVIDER_FORUM = "[Tribunale di ... da definire]";

export const OPERATOR = {
  name: "[Ragione sociale del gestore di Attracco]",
  vatNumber: "[P.IVA]",
  registeredOffice: "[Sede legale]",
  rea: "[n. REA e CCIAA]",
  pec: "[PEC]",
  email: "[email di contatto]",
  privacyEmail: "[email privacy / DPO]",
};
