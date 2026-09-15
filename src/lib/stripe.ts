import "server-only";
import Stripe from "stripe";

// Built lazily on first use, not at module scope — same reasoning as
// getResendClient() in email.ts and getOpenAI() in openai.ts: the Stripe
// constructor throws synchronously when no API key is passed, and
// Next.js evaluates route modules while collecting page data at *build*
// time, so a top-level `new Stripe(...)` here would fail the entire
// production build the moment STRIPE_SECRET_KEY is unset.
let client: Stripe | undefined;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}
