import { env } from "@/lib/env";
import { providerByToken, stripeOnboardingUrl } from "@/lib/providers/server";

export const runtime = "nodejs";

// Avvio dell'onboarding Stripe Connect: crea l'account Express (se manca) e un
// Account Link monouso. GET è usato da Stripe come refresh_url quando il link scade.
async function linkFor(token: string): Promise<string | null> {
  const provider = await providerByToken(token);
  if (!provider || provider.status === "suspended") return null;
  if (!provider.terms_accepted_at) return null;
  return stripeOnboardingUrl(provider, token);
}

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const url = await linkFor((await params).token);
    if (!url) return Response.json({ error: "not_available" }, { status: 409 });
    return Response.json({ url });
  } catch (err) {
    console.error("stripe onboarding error", err);
    return Response.json({ error: "stripe_unavailable" }, { status: 502 });
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = await linkFor(token).catch((err) => {
    console.error("stripe onboarding refresh error", err);
    return null;
  });
  return Response.redirect(url ?? `${env.siteUrl()}/partner/onboarding/${token}`, 303);
}
