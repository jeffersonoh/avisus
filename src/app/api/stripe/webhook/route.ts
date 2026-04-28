import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";

import { createStripeClient, getWebhookSecret } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Plan } from "@/lib/plan-limits";

import { getInvoiceSubscriptionId, handleInvoicePaid } from "./invoice-paid";

export const runtime = "nodejs";
export const maxDuration = 30;

function mapStripePlan(subscription: Stripe.Subscription): Plan {
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) return "starter";
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return "pro";
  const meta = (subscription.metadata?.target_plan ?? "") as string;
  if (meta === "starter" || meta === "pro") return meta;
  return "free";
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "incomplete":
    case "incomplete_expired":
      return "pending_checkout";
    default:
      return "active";
  }
}

async function handleSubscriptionUpsert(
  supabase: ReturnType<typeof createServiceRoleClient>,
  subscription: Stripe.Subscription,
): Promise<void> {
  const plan = mapStripePlan(subscription);
  const status = mapStripeStatus(subscription.status);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // current_period_start/end removed in Stripe API 2025-01-27; use billing_cycle_anchor as start.
  const periodStart = subscription.billing_cycle_anchor
    ? new Date(subscription.billing_cycle_anchor * 1000).toISOString()
    : null;
  const periodEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  // Find existing row by stripe_subscription_id (idempotency)
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("subscriptions")
      .update({
        plan,
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      })
      .eq("id", existing.id);
    return;
  }

  // No row with subscription ID — find by customer ID (row created at checkout)
  const { data: byCustomer } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .is("stripe_subscription_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byCustomer) {
    await supabase
      .from("subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        plan,
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      })
      .eq("id", byCustomer.id);
    return;
  }

  // Fallback: derive user_id from metadata (subscription created before checkout row)
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.warn("[stripe][webhook] subscription without user_id metadata:", subscription.id);
    return;
  }

  await supabase.from("subscriptions").insert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan,
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
  });
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createServiceRoleClient>,
  subscription: Stripe.Subscription,
): Promise<void> {
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!existing) return;

  await supabase
    .from("subscriptions")
    .update({ plan: "free", status: "cancelled" })
    .eq("id", existing.id);
}

async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createServiceRoleClient>,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) return;

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!existing) return;

  await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("id", existing.id);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  let stripe: Stripe;
  try {
    stripe = createStripeClient();
    const secret = getWebhookSecret();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe][webhook] signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(supabase, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      case "invoice.paid":
        await handleInvoicePaid(supabase, stripe, event.data.object as Stripe.Invoice);
        break;

      default:
        // Unhandled event types return 200 to prevent Stripe retries
        break;
    }
  } catch (err) {
    console.error(`[stripe][webhook] error handling event ${event.type}:`, err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
