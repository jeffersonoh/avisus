import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

import { referralCodeSchema } from "./schemas";

export type ReferralValidationReason = "not_found" | "inactive" | "expired" | "invalid_format";

export type ReferralValidationResult =
  | { ok: true; coupon: { id: string; code: string } }
  | { ok: false; reason: ReferralValidationReason };

export type SignupReferralResult =
  | { ok: true }
  | { ok: false; reason: ReferralValidationReason | "write_failed" };

type ReferralServiceClient = SupabaseClient<Database>;

type ReferralCouponLookup = {
  id: string;
  code: string;
  is_active: boolean;
  expires_at: string | null;
};

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false;
  }

  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

function warnReferralFailure(scope: string, message: string): void {
  console.warn(`[referrals] ${scope}: ${message}`);
}

async function validateReferralCodeWithClient(
  supabase: ReferralServiceClient,
  code: string,
): Promise<ReferralValidationResult> {
  const parsedCode = referralCodeSchema.safeParse(code);
  if (!parsedCode.success) {
    return { ok: false, reason: "invalid_format" };
  }

  const { data, error } = await supabase
    .from("referral_coupons")
    .select("id, code, is_active, expires_at")
    .eq("code", parsedCode.data)
    .maybeSingle<ReferralCouponLookup>();

  if (error || !data) {
    return { ok: false, reason: "not_found" };
  }

  if (!data.is_active) {
    return { ok: false, reason: "inactive" };
  }

  if (isExpired(data.expires_at)) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, coupon: { id: data.id, code: data.code } };
}

export async function validateReferralCode(code: string): Promise<ReferralValidationResult> {
  const supabase = createServiceRoleClient();
  return validateReferralCodeWithClient(supabase, code);
}

export async function recordSignupReferral(input: {
  userId: string;
  code: string;
  source: "coupon";
}): Promise<SignupReferralResult> {
  const supabase = createServiceRoleClient();
  const validation = await validateReferralCodeWithClient(supabase, input.code);

  if (!validation.ok) {
    return validation;
  }

  const { error: insertError } = await supabase.from("referral_conversions").insert({
    coupon_id: validation.coupon.id,
    user_id: input.userId,
    plan_selected: "free",
  });

  if (insertError && insertError.code !== "23505") {
    warnReferralFailure("recordSignupReferral insert", insertError.message);
    return { ok: false, reason: "write_failed" };
  }

  const { data: conversion, error: conversionError } = await supabase
    .from("referral_conversions")
    .select("coupon_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (conversionError) {
    warnReferralFailure("recordSignupReferral lookup", conversionError.message);
    return { ok: false, reason: "write_failed" };
  }

  const couponId = conversion?.coupon_id ?? validation.coupon.id;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      referral_coupon_id: couponId,
      referral_source: input.source,
    })
    .eq("id", input.userId);

  if (profileError) {
    warnReferralFailure("recordSignupReferral profile", profileError.message);
    return { ok: false, reason: "write_failed" };
  }

  return { ok: true };
}

export async function recordFirstPaidReferral(input: {
  userId: string;
  plan: "starter" | "pro";
  paidAmount: number;
  currency: string;
  stripeInvoiceId: string;
  stripeSubscriptionId: string | null;
  paidAt: string;
}): Promise<void> {
  const paidCurrency = input.currency.trim().toUpperCase();
  if (!Number.isFinite(input.paidAmount) || input.paidAmount < 0 || !/^[A-Z]{3}$/.test(paidCurrency)) {
    warnReferralFailure("recordFirstPaidReferral input", "invalid payment payload");
    return;
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("referral_conversions")
    .update({
      plan_selected: input.plan,
      first_paid_date: input.paidAt,
      paid_amount: input.paidAmount,
      paid_currency: paidCurrency,
      stripe_invoice_id: input.stripeInvoiceId,
      stripe_subscription_id: input.stripeSubscriptionId,
    })
    .eq("user_id", input.userId)
    .is("first_paid_date", null);

  if (error && error.code !== "23505") {
    warnReferralFailure("recordFirstPaidReferral update", error.message);
  }
}
