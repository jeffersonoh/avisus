import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  recordFirstPaidReferral,
  recordSignupReferral,
  validateReferralCode,
} from "@/features/referrals/server";

import {
  ANON_KEY,
  createServiceClient,
  createTestUser,
  deleteTestUser,
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  uniqueEmail,
} from "./setup";

function uniqueReferralCode(prefix: string): string {
  return `${prefix}_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

describe("referral server rules", () => {
  const password = "AvisusTest2026!";
  const createdCouponIds: string[] = [];

  let admin: ReturnType<typeof createServiceClient>;
  let userId: string;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;
  });

  beforeEach(async () => {
    admin = createServiceClient();
    const user = await createTestUser(uniqueEmail("referral-server"), password);
    userId = user.id;
  });

  afterEach(async () => {
    await deleteTestUser(userId);

    if (createdCouponIds.length > 0) {
      await admin.from("referral_coupons").delete().in("id", createdCouponIds);
      createdCouponIds.length = 0;
    }
  });

  async function createCoupon(overrides: { is_active?: boolean; expires_at?: string | null } = {}) {
    const { data, error } = await admin
      .from("referral_coupons")
      .insert({
        code: uniqueReferralCode("VALID"),
        partner_name: "Parceiro Teste",
        commission_rate_pct: 12.5,
        ...overrides,
      })
      .select("id, code")
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    createdCouponIds.push(data!.id);
    return data!;
  }

  it("validates an active and unexpired coupon", async () => {
    const coupon = await createCoupon();

    await expect(validateReferralCode(coupon.code.toLowerCase())).resolves.toStrictEqual({
      ok: true,
      coupon: { id: coupon.id, code: coupon.code },
    });
  });

  it("returns inactive for disabled coupons", async () => {
    const coupon = await createCoupon({ is_active: false });

    await expect(validateReferralCode(coupon.code)).resolves.toStrictEqual({
      ok: false,
      reason: "inactive",
    });
  });

  it("returns expired for coupons with past expiration", async () => {
    const coupon = await createCoupon({ expires_at: "2026-01-01T00:00:00.000Z" });

    await expect(validateReferralCode(coupon.code)).resolves.toStrictEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("records a free signup referral and updates the profile attribution", async () => {
    const coupon = await createCoupon();

    await expect(recordSignupReferral({ userId, code: coupon.code, source: "coupon" })).resolves.toStrictEqual({
      ok: true,
    });

    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("coupon_id, plan_selected, user_id")
      .eq("user_id", userId)
      .single();

    const { data: profile } = await admin
      .from("profiles")
      .select("referral_coupon_id, referral_source")
      .eq("id", userId)
      .single();

    expect(conversion).toStrictEqual({
      coupon_id: coupon.id,
      plan_selected: "free",
      user_id: userId,
    });
    expect(profile).toStrictEqual({ referral_coupon_id: coupon.id, referral_source: "coupon" });
  });

  it("does not create duplicate conversions for the same user", async () => {
    const coupon = await createCoupon();

    await recordSignupReferral({ userId, code: coupon.code, source: "coupon" });
    await recordSignupReferral({ userId, code: coupon.code, source: "coupon" });

    const { count, error } = await admin
      .from("referral_conversions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    expect(error).toBeNull();
    expect(count).toBe(1);
  });

  it("records the first paid referral once and ignores recurring updates", async () => {
    const coupon = await createCoupon();
    const firstPaidAt = "2026-04-27T12:00:00.000Z";

    await recordSignupReferral({ userId, code: coupon.code, source: "coupon" });
    await recordFirstPaidReferral({
      userId,
      plan: "starter",
      paidAmount: 49.9,
      currency: "brl",
      stripeInvoiceId: "in_first_referral_test",
      stripeSubscriptionId: "sub_first_referral_test",
      paidAt: firstPaidAt,
    });
    await recordFirstPaidReferral({
      userId,
      plan: "pro",
      paidAmount: 99.9,
      currency: "brl",
      stripeInvoiceId: "in_recurring_referral_test",
      stripeSubscriptionId: "sub_recurring_referral_test",
      paidAt: "2026-05-27T12:00:00.000Z",
    });

    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("first_paid_date, paid_amount, paid_currency, plan_selected, stripe_invoice_id, stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    expect(Date.parse(conversion?.first_paid_date ?? "")).toBe(Date.parse(firstPaidAt));
    expect(conversion).toMatchObject({
      paid_amount: 49.9,
      paid_currency: "BRL",
      plan_selected: "starter",
      stripe_invoice_id: "in_first_referral_test",
      stripe_subscription_id: "sub_first_referral_test",
    });
  });

  it("does not create a conversion when paid referral is recorded for a user without referral", async () => {
    await recordFirstPaidReferral({
      userId,
      plan: "starter",
      paidAmount: 49.9,
      currency: "BRL",
      stripeInvoiceId: "in_without_referral_test",
      stripeSubscriptionId: "sub_without_referral_test",
      paidAt: "2026-04-27T12:00:00.000Z",
    });

    const { data, error } = await admin
      .from("referral_conversions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});
