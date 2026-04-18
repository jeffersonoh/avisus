import Stripe from "stripe";

export function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing env var: STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing env var: STRIPE_WEBHOOK_SECRET");
  return secret;
}
