// Lettura centralizzata delle variabili d'ambiente (solo lato server).
import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variabile d'ambiente mancante: ${name}`);
  return value;
}

export const env = {
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://attracco.app",
  databaseUrl: () => required("DATABASE_URL"),
  stripeSecretKey: () => required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => required("STRIPE_WEBHOOK_SECRET"),
  platformFeeBps: () => Number(process.env.PLATFORM_FEE_BPS ?? "0"),
  conciergeModel: () => process.env.CONCIERGE_MODEL ?? "claude-opus-5-5",
  conciergeEffort: (): "low" | "medium" | "high" => {
    const v = process.env.CONCIERGE_EFFORT;
    return v === "medium" || v === "high" ? v : "low";
  },
  adminUser: () => required("ADMIN_USER"),
  adminPassword: () => required("ADMIN_PASSWORD"),
};
