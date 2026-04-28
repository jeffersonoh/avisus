import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

import {
  getInvoicePaymentDetails,
  getInvoiceSubscriptionId,
  handleInvoicePaid,
} from "./invoice-paid";
import type { createServiceRoleClient } from "@/lib/supabase/service";

type LookupResult<T> = { data: T | null; error: Error | null };
type SubscriptionLookup = { user_id: string; plan: "free" | "starter" | "pro"; stripe_customer_id: string | null };
type ReferralLookup = { id: string };

function invoice(overrides: Partial<Stripe.Invoice> = {}): Stripe.Invoice {
  return {
    id: "in_unit_test",
    amount_paid: 1990,
    currency: "brl",
    created: 1_777_344_000,
    customer: "cus_unit_test",
    parent: {
      subscription_details: {
        subscription: "sub_unit_test",
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

function supabaseLookups(
  subscription: LookupResult<SubscriptionLookup>,
  referral: LookupResult<ReferralLookup>,
): ReturnType<typeof createServiceRoleClient> {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => (table === "subscriptions" ? subscription : referral),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createServiceRoleClient>;
}

function stripeClient(overrides: { subscription?: unknown; customer?: unknown } = {}): Stripe {
  return {
    subscriptions: {
      retrieve: vi.fn(async () => overrides.subscription ?? null),
    },
    customers: {
      retrieve: vi.fn(async () => overrides.customer ?? { id: "cus_unit_test", metadata: {} }),
    },
  } as unknown as Stripe;
}

describe("Stripe webhook invoice.paid helpers", () => {
  it("extracts subscription ID when invoice parent subscription is a string", () => {
    expect(getInvoiceSubscriptionId(invoice())).toBe("sub_unit_test");
  });

  it("extracts subscription ID when invoice parent subscription is an object", () => {
    expect(
      getInvoiceSubscriptionId(
        invoice({
          parent: {
            subscription_details: {
              subscription: { id: "sub_object_test" },
            },
          } as Stripe.Invoice.Parent,
        }),
      ),
    ).toBe("sub_object_test");
  });

  it("converts amount_paid cents and uppercases currency", () => {
    expect(getInvoicePaymentDetails(invoice())).toMatchObject({
      paidAmount: 19.9,
      currency: "BRL",
      paidAt: "2026-04-28T03:40:00.000Z",
    });
  });

  it("does not record paid referral for a non-paid plan event", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const recordPaidReferral = vi.fn();
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { user_id: "00000000-0000-0000-0000-000000000001", plan: "free", stripe_customer_id: "cus_unit_test" },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServiceRoleClient>;
    const stripe = {
      subscriptions: {
        retrieve: vi.fn(async () => ({
          id: "sub_unit_test",
          metadata: { user_id: "00000000-0000-0000-0000-000000000001", target_plan: "free" },
          items: { data: [] },
        })),
      },
    } as unknown as Stripe;

    await handleInvoicePaid(supabase, stripe, invoice(), recordPaidReferral);

    expect(recordPaidReferral).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("records a paid referral with normalized payment details", async () => {
    const recordPaidReferral = vi.fn(async () => undefined);
    const supabase = supabaseLookups(
      {
        data: {
          user_id: "00000000-0000-0000-0000-000000000001",
          plan: "starter",
          stripe_customer_id: "cus_unit_test",
        },
        error: null,
      },
      { data: { id: "referral_conversion_unit_test" }, error: null },
    );

    await handleInvoicePaid(supabase, stripeClient(), invoice(), recordPaidReferral);

    expect(recordPaidReferral).toHaveBeenCalledWith({
      userId: "00000000-0000-0000-0000-000000000001",
      plan: "starter",
      paidAmount: 19.9,
      currency: "BRL",
      stripeInvoiceId: "in_unit_test",
      stripeSubscriptionId: "sub_unit_test",
      paidAt: "2026-04-28T03:40:00.000Z",
    });
  });

  it("resolves user and paid plan from Stripe subscription metadata fallback", async () => {
    const recordPaidReferral = vi.fn(async () => undefined);
    const supabase = supabaseLookups(
      { data: null, error: null },
      { data: { id: "referral_conversion_unit_test" }, error: null },
    );

    await handleInvoicePaid(
      supabase,
      stripeClient({
        subscription: {
          id: "sub_unit_test",
          metadata: { user_id: "00000000-0000-0000-0000-000000000002", target_plan: "pro" },
          items: { data: [] },
        },
      }),
      invoice(),
      recordPaidReferral,
    );

    expect(recordPaidReferral).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "00000000-0000-0000-0000-000000000002", plan: "pro" }),
    );
  });

  it("ignores invoice.paid without subscription reference", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const recordPaidReferral = vi.fn(async () => undefined);

    await handleInvoicePaid(
      supabaseLookups({ data: null, error: null }, { data: null, error: null }),
      stripeClient(),
      invoice({ parent: null as unknown as Stripe.Invoice["parent"] }),
      recordPaidReferral,
    );

    expect(recordPaidReferral).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("[stripe][webhook] invoice.paid without subscription", {
      invoiceId: "in_unit_test",
    });
    warnSpy.mockRestore();
  });

  it("ignores invoice.paid when no user can be resolved", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const recordPaidReferral = vi.fn(async () => undefined);

    await handleInvoicePaid(
      supabaseLookups({ data: null, error: null }, { data: null, error: null }),
      stripeClient({ subscription: { id: "sub_unit_test", metadata: {}, items: { data: [] } } }),
      invoice(),
      recordPaidReferral,
    );

    expect(recordPaidReferral).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("[stripe][webhook] invoice.paid without resolvable user", {
      invoiceId: "in_unit_test",
      subscriptionId: "sub_unit_test",
      customerId: "cus_unit_test",
    });
    warnSpy.mockRestore();
  });

  it("logs and returns when the user has no referral conversion", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const recordPaidReferral = vi.fn(async () => undefined);

    await handleInvoicePaid(
      supabaseLookups(
        {
          data: {
            user_id: "00000000-0000-0000-0000-000000000001",
            plan: "starter",
            stripe_customer_id: "cus_unit_test",
          },
          error: null,
        },
        { data: null, error: null },
      ),
      stripeClient(),
      invoice(),
      recordPaidReferral,
    );

    expect(recordPaidReferral).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("[stripe][webhook] invoice.paid without referral conversion", {
      invoiceId: "in_unit_test",
      subscriptionId: "sub_unit_test",
    });
    warnSpy.mockRestore();
  });
});
