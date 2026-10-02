import "server-only";
import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | undefined;

export function stripe(): Stripe {
  client ??= new Stripe(env.stripeSecretKey());
  return client;
}

/** ID dell'account Stripe Connect del fornitore, letto dalla variabile indicata in catalogo. */
export function connectedAccountFor(envName: string): string {
  const id = process.env[envName];
  if (!id || !id.startsWith("acct_")) {
    throw new Error(`Account Stripe Connect non configurato (${envName})`);
  }
  return id;
}
