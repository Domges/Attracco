import { LegalDoc } from "@/components/LegalDoc";
import { PRIVACY_VERSION } from "@/lib/legal";

export const metadata = { title: "Cookie — Attracco" };

export default function Cookies() {
  return (
    <LegalDoc
      version={PRIVACY_VERSION}
      it={
        <>
          <h1>Cookie e tecnologie simili</h1>
          <p>
            Attracco non utilizza cookie di profilazione, di marketing o di analisi di terze parti. Il sito memorizza nel browser solo la
            preferenza di lingua (chiave &laquo;attracco-lang&raquo;), strumento tecnico necessario a fornire il servizio richiesto, per il quale
            non è richiesto il consenso (art. 122 D.Lgs. 196/2003; Linee guida del Garante sui cookie del 10 giugno 2021). Per questo non è
            mostrato un banner cookie.
          </p>
          <p>
            La pagina di pagamento è ospitata da Stripe su un proprio dominio, che può usare cookie tecnici e antifrode secondo la propria
            informativa.
          </p>
          <p>
            Se in futuro saranno introdotti strumenti di analisi o marketing, questa pagina sarà aggiornata e sarà chiesto il consenso prima di
            attivarli.
          </p>
        </>
      }
      en={
        <>
          <h1>Cookies and similar technologies</h1>
          <p>
            Attracco uses no profiling, marketing or third-party analytics cookies. The site only stores your language preference in the browser
            (key &quot;attracco-lang&quot;), a technical tool strictly necessary for the service, which does not require consent. That&apos;s why no
            cookie banner is shown.
          </p>
          <p>The payment page is hosted by Stripe on its own domain, which may use technical and anti-fraud cookies under its own policy.</p>
          <p>If analytics or marketing tools are ever added, this page will be updated and your consent asked first.</p>
        </>
      }
    />
  );
}
