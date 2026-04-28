import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const stripeMockState = vi.hoisted(() => ({
  event: null as unknown,
}));

vi.mock("@/lib/stripe", () => ({
  createStripeClient: () => ({
    webhooks: {
      constructEvent: vi.fn(() => stripeMockState.event),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
    customers: {
      retrieve: vi.fn(),
    },
  }),
  getWebhookSecret: () => "whsec_test",
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data:
              table === "subscriptions"
                ? {
                    user_id: "00000000-0000-0000-0000-000000000001",
                    plan: "starter",
                    stripe_customer_id: "cus_error_test",
                  }
                : { id: "referral_conversion_error_test" },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/features/referrals/server", () => ({
  recordFirstPaidReferral: vi.fn(async () => {
    throw new Error("temporary database error");
  }),
}));

import { POST } from "@/app/api/stripe/webhook/route";

describe("Stripe invoice.paid referral webhook database retry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 500 when referral payment recording fails temporarily", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    stripeMockState.event = {
      id: "evt_referral_webhook_error",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_referral_webhook_error",
          amount_paid: 1990,
          currency: "brl",
          created: 1_777_344_000,
          customer: "cus_error_test",
          parent: { subscription_details: { subscription: "sub_error_test" } },
          status_transitions: { paid_at: 1_777_347_600 },
        },
      },
    };

    const response = await POST(
      new Request("http://avisus.test/api/stripe/webhook", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "sig_test" },
      }) as NextRequest,
    );

    expect(response.status).toBe(500);
    consoleError.mockRestore();
  });
});
