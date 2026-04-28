import type Stripe from "stripe";

import { recordFirstPaidReferral } from "@/features/referrals/server";
import type { Plan } from "@/lib/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service";

type WebhookSupabaseClient = ReturnType<typeof createServiceRoleClient>;
type PaidReferralPlan = "starter" | "pro";
type RecordPaidReferral = typeof recordFirstPaidReferral;

function mapStripePlan(subscription: Stripe.Subscription): Plan {
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) return "starter";
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return "pro";
  const meta = (subscription.metadata?.target_plan ?? "") as string;
  if (meta === "starter" || meta === "pro") return meta;
  return "free";
}

function isPaidReferralPlan(plan: Plan | null): plan is PaidReferralPlan {
  return plan === "starter" || plan === "pro";
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subRef = invoice.parent?.subscription_details?.subscription;
  return typeof subRef === "string" ? subRef : (subRef?.id ?? null);
}

export function getInvoicePaymentDetails(invoice: Stripe.Invoice): {
  paidAmount: number;
  currency: string;
  paidAt: string;
} {
  const paidTimestamp = invoice.status_transitions?.paid_at ?? invoice.created;

  return {
    paidAmount: invoice.amount_paid / 100,
    currency: invoice.currency.toUpperCase(),
    paidAt: new Date(paidTimestamp * 1000).toISOString(),
  };
}

function getCustomerId(invoice: Stripe.Invoice): string | null {
  const customer = invoice.customer;
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function getCustomerMetadataUserId(stripe: Stripe, invoice: Stripe.Invoice): Promise<string | null> {
  const customer = invoice.customer;
  if (!customer) return null;

  if (typeof customer !== "string") {
    if ("deleted" in customer && customer.deleted) return null;
    return customer.metadata?.user_id ?? null;
  }

  const retrievedCustomer = await stripe.customers.retrieve(customer);
  if ("deleted" in retrievedCustomer && retrievedCustomer.deleted) return null;
  return retrievedCustomer.metadata?.user_id ?? null;
}

export async function handleInvoicePaid(
  supabase: WebhookSupabaseClient,
  stripe: Stripe,
  invoice: Stripe.Invoice,
  recordPaidReferral: RecordPaidReferral = recordFirstPaidReferral,
): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    console.warn("[stripe][webhook] invoice.paid without subscription", { invoiceId: invoice.id });
    return;
  }

  const { data: internalSubscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("user_id, plan, stripe_customer_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle<{ user_id: string; plan: Plan; stripe_customer_id: string | null }>();

  if (subscriptionError) {
    throw subscriptionError;
  }

  const needsStripeSubscription =
    !internalSubscription?.user_id || !isPaidReferralPlan(internalSubscription.plan);
  const stripeSubscription = needsStripeSubscription
    ? await stripe.subscriptions.retrieve(subscriptionId)
    : null;
  const userId =
    internalSubscription?.user_id ??
    stripeSubscription?.metadata?.user_id ??
    (await getCustomerMetadataUserId(stripe, invoice));

  if (!userId) {
    console.warn("[stripe][webhook] invoice.paid without resolvable user", {
      invoiceId: invoice.id,
      subscriptionId,
      customerId: getCustomerId(invoice),
    });
    return;
  }

  const paidPlanFromStripe = stripeSubscription ? mapStripePlan(stripeSubscription) : null;
  const internalPlan = internalSubscription?.plan ?? null;
  const paidPlan = isPaidReferralPlan(paidPlanFromStripe)
    ? paidPlanFromStripe
    : isPaidReferralPlan(internalPlan)
      ? internalPlan
      : null;

  if (!paidPlan) {
    console.warn("[stripe][webhook] invoice.paid without paid plan", { invoiceId: invoice.id, subscriptionId });
    return;
  }

  const { data: referralConversion, error: referralLookupError } = await supabase
    .from("referral_conversions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (referralLookupError) {
    throw referralLookupError;
  }

  if (!referralConversion) {
    console.warn("[stripe][webhook] invoice.paid without referral conversion", { invoiceId: invoice.id, subscriptionId });
    return;
  }

  const payment = getInvoicePaymentDetails(invoice);
  await recordPaidReferral({
    userId,
    plan: paidPlan,
    paidAmount: payment.paidAmount,
    currency: payment.currency,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: subscriptionId,
    paidAt: payment.paidAt,
  });
}
