import { LegalDoc } from "@/components/LegalDoc";
import { OPERATOR, TERMS_VERSION } from "@/lib/legal";

export const metadata = { title: "Note legali — Attracco" };

function Body({ en }: { en?: boolean }) {
  return (
    <>
      <h1>{en ? "Legal notice" : "Note legali"}</h1>
      <p>
        {OPERATOR.name}
        <br />
        {en ? "Registered office" : "Sede legale"}: {OPERATOR.registeredOffice}
        <br />
        {en ? "VAT number" : "Partita IVA"}: {OPERATOR.vatNumber}
        <br />
        REA: {OPERATOR.rea}
        <br />
        PEC: {OPERATOR.pec}
        <br />
        Email: {OPERATOR.email}
      </p>
      <p>
        {en
          ? "Single point of contact for authorities and users under Articles 11-12 of Regulation (EU) 2022/2065 (Digital Services Act): "
          : "Punto di contatto unico per autorità e utenti ai sensi degli artt. 11-12 del Regolamento (UE) 2022/2065 (Digital Services Act): "}
        {OPERATOR.email} ({en ? "Italian, English" : "italiano, inglese"}).
      </p>
      <p>
        {en
          ? "Reports of illegal content (Art. 16 DSA) can be sent to the same address, stating the content, the reasons and your contact details."
          : "Le segnalazioni di contenuti illegali (art. 16 DSA) possono essere inviate allo stesso indirizzo indicando il contenuto, le ragioni e i tuoi recapiti."}
      </p>
    </>
  );
}

export default function LegalNotice() {
  return <LegalDoc version={TERMS_VERSION} it={<Body />} en={<Body en />} />;
}
