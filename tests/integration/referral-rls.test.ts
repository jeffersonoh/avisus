import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/types/database";

import { createServiceClient, createTestUser, deleteTestUser, signInAsUser, uniqueEmail } from "./setup";

type ReferralCouponInsert = Database["public"]["Tables"]["referral_coupons"]["Insert"];

function uniqueReferralCode(prefix: string): string {
  return `${prefix}_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

describe("referral coupons RLS and constraints", () => {
  const password = "AvisusTest2026!";
  const createdCouponIds: string[] = [];

  let admin: ReturnType<typeof createServiceClient>;
  let userId: string;
  let userClient: Awaited<ReturnType<typeof signInAsUser>>["client"];

  async function createReferralCoupon(overrides: Partial<ReferralCouponInsert> = {}) {
    const { data, error } = await admin
      .from("referral_coupons")
      .insert({
        code: uniqueReferralCode("TEST"),
        partner_name: "Parceiro Teste",
        commission_rate_pct: 10,
        ...overrides,
      })
      .select("id, code")
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();

    createdCouponIds.push(data!.id);
    return data!;
  }

  beforeEach(async () => {
    admin = createServiceClient();
    const email = uniqueEmail("referral-rls");
    const user = await createTestUser(email, password);
    userId = user.id;
    const { client } = await signInAsUser(email, password);
    userClient = client;
  });

  afterEach(async () => {
    await deleteTestUser(userId);

    if (createdCouponIds.length > 0) {
      await admin.from("referral_conversions").delete().in("coupon_id", createdCouponIds);
      await admin.from("referral_coupons").delete().in("id", createdCouponIds);
      createdCouponIds.length = 0;
    }
  });

  it("creates existing user defaults for referral profile fields", async () => {
    const { data, error } = await userClient
      .from("profiles")
      .select("is_admin, referral_coupon_id, referral_source")
      .eq("id", userId)
      .single();

    expect(error).toBeNull();
    expect(data).toStrictEqual({
      is_admin: false,
      referral_coupon_id: null,
      referral_source: "direct",
    });
  });

  it("blocks common authenticated users from inserting referral coupons", async () => {
    const { data, error } = await userClient
      .from("referral_coupons")
      .insert({
        code: uniqueReferralCode("USER"),
        partner_name: "Parceiro Bloqueado",
        commission_rate_pct: 10,
      })
      .select("id")
      .maybeSingle();

    if (data?.id) {
      createdCouponIds.push(data.id);
    }

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("hides referral conversions from common authenticated users", async () => {
    const coupon = await createReferralCoupon();

    const { error: insertError } = await admin.from("referral_conversions").insert({
      coupon_id: coupon.id,
      user_id: userId,
    });

    expect(insertError).toBeNull();

    const { data, error } = await userClient
      .from("referral_conversions")
      .select("id, coupon_id, user_id")
      .eq("user_id", userId);

    expect(error).toBeNull();
    expect(data).toStrictEqual([]);
  });

  it("blocks common users from elevating profiles.is_admin", async () => {
    const { error } = await userClient.from("profiles").update({ is_admin: true }).eq("id", userId);

    expect(error).not.toBeNull();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    expect(profile?.is_admin).toBe(false);
  });

  it("blocks common users from changing referral fields directly", async () => {
    const coupon = await createReferralCoupon();

    const { error } = await userClient
      .from("profiles")
      .update({ referral_coupon_id: coupon.id, referral_source: "coupon" })
      .eq("id", userId);

    expect(error).not.toBeNull();

    const { data: profile } = await admin
      .from("profiles")
      .select("referral_coupon_id, referral_source")
      .eq("id", userId)
      .single();

    expect(profile).toStrictEqual({ referral_coupon_id: null, referral_source: "direct" });
  });

  it("allows service role to create a valid coupon and rejects duplicate code", async () => {
    const code = uniqueReferralCode("DUP");
    await createReferralCoupon({ code });

    const { error } = await admin.from("referral_coupons").insert({
      code,
      partner_name: "Parceiro Duplicado",
      commission_rate_pct: 15,
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
  });

  it("rejects coupon codes outside the allowed format", async () => {
    const { error } = await admin.from("referral_coupons").insert({
      code: "abc-1",
      partner_name: "Parceiro Invalido",
      commission_rate_pct: 5,
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23514");
  });
});
