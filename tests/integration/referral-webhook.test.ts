import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { recordSignupReferral } from "@/features/referrals/server";

import {
  ANON_KEY,
  createServiceClient,
  createTestUser,
  deleteTestUser,
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  uniqueEmail,
} from "./setup";

const stripeMockState = vi.hoisted(() => ({
  event: null as unknown,
  subscription: null as unknown,
}));

vi.mock("@/lib/stripe", () => ({
  createStripeClient: () => ({
    webhooks: {
      constructEvent: vi.fn(() => stripeMockState.event),
    },
    subscriptions: {
      retrieve: vi.fn(async () => stripeMockState.subscription),
    },
    customers: {
      retrieve: vi.fn(async () => ({ id: "cus_mock", metadata: {} })),
    },
  }),
  getWebhookSecret: () => "whsec_test",
}));

import { POST } from "@/app/api/stripe/webhook/route";

function uniqueReferralCode(prefix: string): string {
  return `${prefix}_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function invoicePaidEvent(invoice: Stripe.Invoice): Stripe.Event {
  return {
    id: `evt_${invoice.id}`,
    type: "invoice.paid",
    data: { object: invoice },
  } as unknown as Stripe.Event;
}

function invoice(overrides: Partial<Stripe.Invoice> = {}): Stripe.Invoice {
  return {
    id: "in_referral_webhook_first",
    amount_paid: 1990,
    currency: "brl",
    created: 1_777_344_000,
    customer: "cus_referral_webhook",
    parent: {
      subscription_details: {
        subscription: "sub_referral_webhook",
      },
    },
    status_transitions: {
      finalized_at: null,
      marked_uncollectible_at: null,
      paid_at: 1_777_347_600,
      voided_at: null,
    },
    ...overrides,
  } as unknown as Stripe.Invoice;
}

async function postInvoicePaid(stripeInvoice: Stripe.Invoice): Promise<Response> {
  stripeMockState.event = invoicePaidEvent(stripeInvoice);

  return POST(
    new Request("http://avisus.test/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({ id: stripeInvoice.id }),
      headers: { "stripe-signature": "sig_test" },
    }) as NextRequest,
  );
}

describe("Stripe invoice.paid referral webhook", () => {
  const password = "AvisusTest2026!";
  const createdCouponIds: string[] = [];
  const createdUserIds: string[] = [];

  let admin: ReturnType<typeof createServiceClient>;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;
  });

  beforeEach(() => {
    admin = createServiceClient();
    stripeMockState.subscription = {
      id: "sub_referral_webhook",
      metadata: { target_plan: "starter" },
      items: { data: [] },
    };
  });

  afterEach(async () => {
    await Promise.all(createdUserIds.splice(0).map((userId) => deleteTestUser(userId)));

    if (createdCouponIds.length > 0) {
      await admin.from("referral_coupons").delete().in("id", createdCouponIds.splice(0));
    }
  });

  async function createCoupon() {
    const { data, error } = await admin
      .from("referral_coupons")
      .insert({
        code: uniqueReferralCode("WEBHOOK"),
        partner_name: "Parceiro Webhook",
        commission_rate_pct: 10,
      })
      .select("id, code")
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    createdCouponIds.push(data!.id);
    return data!;
  }

  async function createUserWithSubscription(options: { withReferral: boolean; subscriptionId?: string }) {
    const user = await createTestUser(uniqueEmail("referral-webhook"), password);
    createdUserIds.push(user.id);

    if (options.withReferral) {
      const coupon = await createCoupon();
      await expect(recordSignupReferral({ userId: user.id, code: coupon.code, source: "coupon" })).resolves.toStrictEqual({
        ok: true,
      });
    }

    const subscriptionId = options.subscriptionId ?? `sub_referral_${user.id.slice(0, 8)}`;
    const { error } = await admin.from("subscriptions").insert({
      user_id: user.id,
      stripe_customer_id: `cus_referral_${user.id.slice(0, 8)}`,
      stripe_subscription_id: subscriptionId,
      plan: "starter",
      status: "active",
    });

    expect(error).toBeNull();
    return { userId: user.id, subscriptionId };
  }

  it("records first paid conversion for a referred STARTER user", async () => {
    const { userId, subscriptionId } = await createUserWithSubscription({ withReferral: true });

    const response = await postInvoicePaid(
      invoice({
        id: "in_referral_webhook_paid",
        parent: { subscription_details: { subscription: subscriptionId } } as unknown as Stripe.Invoice["parent"],
      }),
    );

    expect(response.status).toBe(200);

    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("first_paid_date, paid_amount, paid_currency, stripe_invoice_id, stripe_subscription_id, plan_selected")
      .eq("user_id", userId)
      .single();

    expect(Date.parse(conversion?.first_paid_date ?? "")).toBe(Date.parse("2026-04-28T03:40:00.000Z"));
    expect(conversion).toMatchObject({
      paid_amount: 19.9,
      paid_currency: "BRL",
      stripe_invoice_id: "in_referral_webhook_paid",
      stripe_subscription_id: subscriptionId,
      plan_selected: "starter",
    });
  });

  it("returns success for duplicate invoice without changing the first conversion", async () => {
    const { userId, subscriptionId } = await createUserWithSubscription({ withReferral: true });
    const firstInvoice = invoice({
      id: "in_referral_webhook_duplicate",
      parent: { subscription_details: { subscription: subscriptionId } } as unknown as Stripe.Invoice["parent"],
    });

    expect((await postInvoicePaid(firstInvoice)).status).toBe(200);
    expect(
      (
        await postInvoicePaid(
          invoice({
            id: "in_referral_webhook_duplicate",
            amount_paid: 9990,
            parent: { subscription_details: { subscription: subscriptionId } } as unknown as Stripe.Invoice["parent"],
          }),
        )
      ).status,
    ).toBe(200);

    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("paid_amount, stripe_invoice_id")
      .eq("user_id", userId)
      .single();

    expect(conversion).toMatchObject({ paid_amount: 19.9, stripe_invoice_id: "in_referral_webhook_duplicate" });
  });

  it("does not change the first conversion for a recurring invoice", async () => {
    const { userId, subscriptionId } = await createUserWithSubscription({ withReferral: true });

    expect(
      (
        await postInvoicePaid(
          invoice({
            id: "in_referral_webhook_first_cycle",
            parent: { subscription_details: { subscription: subscriptionId } } as unknown as Stripe.Invoice["parent"],
          }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await postInvoicePaid(
          invoice({
            id: "in_referral_webhook_recurring",
            amount_paid: 3990,
            status_transitions: {
              finalized_at: null,
              marked_uncollectible_at: null,
              paid_at: 1_779_939_600,
              voided_at: null,
            } as Stripe.Invoice["status_transitions"],
            parent: { subscription_details: { subscription: subscriptionId } } as unknown as Stripe.Invoice["parent"],
          }),
        )
      ).status,
    ).toBe(200);

    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("first_paid_date, paid_amount, stripe_invoice_id")
      .eq("user_id", userId)
      .single();

    expect(Date.parse(conversion?.first_paid_date ?? "")).toBe(Date.parse("2026-04-28T03:40:00.000Z"));
    expect(conversion).toMatchObject({ paid_amount: 19.9, stripe_invoice_id: "in_referral_webhook_first_cycle" });
  });

  it("returns success and does not create conversion for a user without referral", async () => {
    const { userId, subscriptionId } = await createUserWithSubscription({ withReferral: false });

    const response = await postInvoicePaid(
      invoice({
        id: "in_referral_webhook_without_referral",
        parent: { subscription_details: { subscription: subscriptionId } } as unknown as Stripe.Invoice["parent"],
      }),
    );

    expect(response.status).toBe(200);

    const { count, error } = await admin
      .from("referral_conversions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    expect(error).toBeNull();
    expect(count).toBe(0);
  });
});
