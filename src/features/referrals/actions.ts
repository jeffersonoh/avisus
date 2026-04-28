"use server";

import "server-only";

import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

import {
  referralCodeSchema,
  referralCouponAdminSchema,
  referralCouponListFiltersSchema,
  type ReferralCouponAdminInput,
  type ReferralCouponListFiltersInput,
} from "./schemas";
import { GENERIC_REFERRAL_COUPON_WRITE_ERROR, mapReferralCouponWriteError } from "./admin-errors";
import { validateReferralCode, type ReferralValidationResult } from "./server";

const INVALID_COUPON_ID_ERROR = "Cupom inválido.";
const GENERIC_LIST_ERROR = "Não foi possível listar cupons.";
const GENERIC_DETAIL_ERROR = "Não foi possível carregar o cupom.";

const couponIdSchema = z.string().uuid(INVALID_COUPON_ID_ERROR);
const toggleReferralCouponSchema = referralCouponAdminSchema.pick({ isActive: true });

type ReferralCouponRow = Database["public"]["Tables"]["referral_coupons"]["Row"];
type ReferralConversionRow = Database["public"]["Tables"]["referral_conversions"]["Row"];

type ReferralCouponWritePayload = Database["public"]["Tables"]["referral_coupons"]["Insert"];

export type ReferralActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type ReferralCouponMetrics = {
  signupCount: number;
  paidConversionCount: number;
  commissionAmount: number;
};

export type ReferralCouponListItem = {
  id: string;
  code: string;
  partnerName: string;
  partnerEmail: string | null;
  commissionRatePct: number;
  isActive: boolean;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
} & ReferralCouponMetrics;

export type ReferralCouponConversionItem = {
  id: string;
  userId: string;
  planSelected: string;
  signupDate: string;
  firstPaidDate: string | null;
  paidAmount: number | null;
  paidCurrency: string;
  stripeInvoiceId: string | null;
  stripeSubscriptionId: string | null;
  commissionAmount: number;
};

export type ReferralCouponDetail = ReferralCouponListItem & {
  conversions: ReferralCouponConversionItem[];
};

export type ReferralCouponListResult =
  | { ok: true; items: ReferralCouponListItem[] }
  | { ok: false; error: string };

export type ReferralCouponDetailResult =
  | { ok: true; coupon: ReferralCouponDetail }
  | { ok: false; error: string };

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toNullableString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toCouponPayload(input: ReferralCouponAdminInput, createdBy?: string): ReferralCouponWritePayload {
  return {
    code: input.code,
    partner_name: input.partnerName,
    partner_email: toNullableString(input.partnerEmail),
    commission_rate_pct: input.commissionRatePct,
    expires_at: input.expiresAt ?? null,
    is_active: input.isActive,
    notes: toNullableString(input.notes),
    ...(createdBy ? { created_by: createdBy } : {}),
  };
}

function getZodErrorMessage(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

function emptyMetrics(): ReferralCouponMetrics {
  return { signupCount: 0, paidConversionCount: 0, commissionAmount: 0 };
}

function calculateMetrics(
  conversions: Pick<ReferralConversionRow, "coupon_id" | "first_paid_date" | "paid_amount">[],
  commissionRatePct: number,
): ReferralCouponMetrics {
  return conversions.reduce<ReferralCouponMetrics>((metrics, conversion) => {
    metrics.signupCount += 1;

    if (conversion.first_paid_date && conversion.paid_amount !== null) {
      metrics.paidConversionCount += 1;
      metrics.commissionAmount = roundMoney(
        metrics.commissionAmount + (conversion.paid_amount * commissionRatePct) / 100,
      );
    }

    return metrics;
  }, emptyMetrics());
}

function mapCouponListItem(
  coupon: ReferralCouponRow,
  conversions: Pick<ReferralConversionRow, "coupon_id" | "first_paid_date" | "paid_amount">[],
): ReferralCouponListItem {
  return {
    id: coupon.id,
    code: coupon.code,
    partnerName: coupon.partner_name,
    partnerEmail: coupon.partner_email,
    commissionRatePct: coupon.commission_rate_pct,
    isActive: coupon.is_active,
    expiresAt: coupon.expires_at,
    notes: coupon.notes,
    createdAt: coupon.created_at,
    updatedAt: coupon.updated_at,
    ...calculateMetrics(conversions, coupon.commission_rate_pct),
  };
}

function mapConversionItem(
  conversion: ReferralConversionRow,
  commissionRatePct: number,
): ReferralCouponConversionItem {
  const commissionAmount = conversion.first_paid_date && conversion.paid_amount !== null
    ? roundMoney((conversion.paid_amount * commissionRatePct) / 100)
    : 0;

  return {
    id: conversion.id,
    userId: conversion.user_id,
    planSelected: conversion.plan_selected,
    signupDate: conversion.signup_date,
    firstPaidDate: conversion.first_paid_date,
    paidAmount: conversion.paid_amount,
    paidCurrency: conversion.paid_currency,
    stripeInvoiceId: conversion.stripe_invoice_id,
    stripeSubscriptionId: conversion.stripe_subscription_id,
    commissionAmount,
  };
}

export async function validateReferralCodeAction(code: string): Promise<ReferralValidationResult> {
  const parsedCode = referralCodeSchema.safeParse(code);
  if (!parsedCode.success) {
    return { ok: false, reason: "invalid_format" };
  }

  return validateReferralCode(parsedCode.data);
}

export async function listReferralCoupons(
  rawFilters: ReferralCouponListFiltersInput = {},
): Promise<ReferralCouponListResult> {
  await requireAdmin();

  const parsedFilters = referralCouponListFiltersSchema.safeParse(rawFilters);
  if (!parsedFilters.success) {
    return { ok: false, error: getZodErrorMessage(parsedFilters.error) };
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("referral_coupons")
    .select("id, code, partner_name, partner_email, commission_rate_pct, is_active, expires_at, notes, created_at, updated_at, created_by")
    .order("created_at", { ascending: false })
    .limit(parsedFilters.data.limit);

  if (parsedFilters.data.status === "active") {
    query = query.eq("is_active", true);
  }

  if (parsedFilters.data.status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data: coupons, error: couponsError } = await query;
  if (couponsError || !coupons) {
    return { ok: false, error: GENERIC_LIST_ERROR };
  }

  if (coupons.length === 0) {
    return { ok: true, items: [] };
  }

  const couponIds = coupons.map((coupon) => coupon.id);
  const { data: conversions, error: conversionsError } = await supabase
    .from("referral_conversions")
    .select("coupon_id, first_paid_date, paid_amount")
    .in("coupon_id", couponIds);

  if (conversionsError || !conversions) {
    return { ok: false, error: GENERIC_LIST_ERROR };
  }

  return {
    ok: true,
    items: coupons.map((coupon) =>
      mapCouponListItem(
        coupon,
        conversions.filter((conversion) => conversion.coupon_id === coupon.id),
      ),
    ),
  };
}

export async function getReferralCouponDetails(id: string): Promise<ReferralCouponDetailResult> {
  await requireAdmin();

  const parsedId = couponIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: INVALID_COUPON_ID_ERROR };
  }

  const supabase = createServiceRoleClient();
  const { data: coupon, error: couponError } = await supabase
    .from("referral_coupons")
    .select("id, code, partner_name, partner_email, commission_rate_pct, is_active, expires_at, notes, created_at, updated_at, created_by")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (couponError || !coupon) {
    return { ok: false, error: GENERIC_DETAIL_ERROR };
  }

  const { data: conversions, error: conversionsError } = await supabase
    .from("referral_conversions")
    .select("id, coupon_id, user_id, plan_selected, signup_date, first_paid_date, paid_amount, paid_currency, stripe_invoice_id, stripe_subscription_id, is_active, notes, created_at, updated_at")
    .eq("coupon_id", parsedId.data)
    .order("signup_date", { ascending: false });

  if (conversionsError || !conversions) {
    return { ok: false, error: GENERIC_DETAIL_ERROR };
  }

  return {
    ok: true,
    coupon: {
      ...mapCouponListItem(coupon, conversions),
      conversions: conversions.map((conversion) => mapConversionItem(conversion, coupon.commission_rate_pct)),
    },
  };
}

export async function createReferralCouponAction(
  input: ReferralCouponAdminInput,
): Promise<ReferralActionResult> {
  const admin = await requireAdmin();
  const parsedInput = referralCouponAdminSchema.safeParse(input);
  if (!parsedInput.success) {
    return { ok: false, error: getZodErrorMessage(parsedInput.error) };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("referral_coupons")
    .insert(toCouponPayload(parsedInput.data, admin.userId))
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error ? mapReferralCouponWriteError(error) : GENERIC_REFERRAL_COUPON_WRITE_ERROR,
    };
  }

  return { ok: true, id: data.id };
}

export async function updateReferralCouponAction(
  id: string,
  input: ReferralCouponAdminInput,
): Promise<ReferralActionResult> {
  await requireAdmin();

  const parsedId = couponIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: INVALID_COUPON_ID_ERROR };
  }

  const parsedInput = referralCouponAdminSchema.safeParse(input);
  if (!parsedInput.success) {
    return { ok: false, error: getZodErrorMessage(parsedInput.error) };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("referral_coupons")
    .update(toCouponPayload(parsedInput.data))
    .eq("id", parsedId.data)
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error ? mapReferralCouponWriteError(error) : GENERIC_REFERRAL_COUPON_WRITE_ERROR,
    };
  }

  return { ok: true, id: data.id };
}

export async function toggleReferralCouponAction(
  id: string,
  isActive: boolean,
): Promise<ReferralActionResult> {
  await requireAdmin();

  const parsedId = couponIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: INVALID_COUPON_ID_ERROR };
  }

  const parsedToggle = toggleReferralCouponSchema.safeParse({ isActive });
  if (!parsedToggle.success) {
    return { ok: false, error: getZodErrorMessage(parsedToggle.error) };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("referral_coupons")
    .update({ is_active: parsedToggle.data.isActive })
    .eq("id", parsedId.data)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: GENERIC_REFERRAL_COUPON_WRITE_ERROR };
  }

  return { ok: true, id: data.id };
}
