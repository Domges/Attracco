import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import "@fontsource/bodoni-moda/latin-400.css";
import "@fontsource/bodoni-moda/latin-400-italic.css";
import "@fontsource/bodoni-moda/latin-500.css";
import "@fontsource-variable/figtree/index.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://attracco.app"),
  title: "Attracco — Concierge in Puglia",
  description:
    "Prenota chef privato, autista NCC ed esperienze in barca a vela in Puglia con il concierge AI di Attracco. Book a private chef, driver or sailing trip in Puglia.",
  openGraph: { title: "Attracco — Concierge in Puglia", siteName: "Attracco", locale: "it_IT", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
