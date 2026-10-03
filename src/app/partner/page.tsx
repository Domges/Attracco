import Link from "next/link";
import { PartnerApplyForm } from "@/components/partner/PartnerApplyForm";
import { PUGLIA_AREAS } from "@/data/catalog";
import { env } from "@/lib/env";

export const metadata = {
  title: "Diventa partner — Attracco",
  description: "Chef privati, autisti NCC e skipper in Puglia: ricevi prenotazioni da turisti italiani e stranieri con Attracco.",
};

// Pagina rivolta ai fornitori (in italiano: i fornitori sono professionisti stabiliti in Puglia).
export default function PartnerPage() {
  const feePercent = env.platformFeeBps() / 100;
  return (
    <div className="two">
      <div>
        <span className="eyebrow">Per i professionisti</span>
        <h1>Diventa partner di Attracco</h1>
        <p>
          Attracco è un marketplace per turisti in Puglia: un concierge AI aiuta gli ospiti a scegliere tra chef privati, autisti NCC
          ed esperienze in barca a vela, e la prenotazione arriva a te già pagata in pre-autorizzazione.
        </p>
        <h2 style={{ fontSize: "1.6rem", marginTop: 32 }}>Come funziona</h2>
        <ol>
          <li>Invii la candidatura con i dati della tua attività.</li>
          <li>Se il profilo è in linea con il catalogo, ricevi un link personale per accettare le Condizioni per i fornitori, completare i dati fiscali e caricare licenze e polizze.</li>
          <li>Configuri l&apos;incasso con Stripe: Stripe verifica la tua identità e accredita i pagamenti sul tuo conto.</li>
          <li>Verificati i documenti, i tuoi servizi vengono pubblicati. Per ogni richiesta hai 48 ore per confermare: la carta del cliente è addebitata solo alla conferma.</li>
        </ol>
        <h2 style={{ fontSize: "1.6rem", marginTop: 32 }}>Condizioni essenziali</h2>
        <p>
          Sei tu il venditore del servizio e la controparte del cliente; Attracco gestisce la piattaforma e trattiene una commissione
          {feePercent > 0 ? ` del ${feePercent.toLocaleString("it-IT")}% sul prezzo pagato dal cliente` : ""}. Nessun canone e nessuna esclusiva.
          I dettagli sono nelle{" "}
          <Link href="/legal/fornitori">Condizioni per i fornitori</Link>.
        </p>
        <p className="muted">
          Documenti che ti chiederemo: visura camerale o certificato di attribuzione della P.IVA, polizza RC e i titoli abilitativi del
          tuo settore (attestato HACCP per gli chef; autorizzazione NCC, ruolo conducenti e carta di circolazione per gli autisti;
          documenti dell&apos;unità da noleggio, titolo dello skipper e certificato di sicurezza per la vela).
        </p>
      </div>
      <PartnerApplyForm areas={[...PUGLIA_AREAS]} />
    </div>
  );
}
