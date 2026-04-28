import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createReferralCouponAction,
  getReferralCouponDetails,
  listReferralCoupons,
  toggleReferralCouponAction,
  updateReferralCouponAction,
} from "@/features/referrals/actions";
import type { ReferralCouponAdminInput } from "@/features/referrals/schemas";
import { recordSignupReferral } from "@/features/referrals/server";
import { requireAdmin } from "@/lib/auth/admin";

import {
  ANON_KEY,
  createServiceClient,
  createTestUser,
  deleteTestUser,
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  uniqueEmail,
} from "./setup";

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: vi.fn(),
}));

function uniqueReferralCode(prefix: string): string {
  return `${prefix}_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function couponInput(overrides: Partial<ReferralCouponAdminInput> = {}): ReferralCouponAdminInput {
  return {
    code: uniqueReferralCode("ACT"),
    partnerName: "Parceiro Teste",
    partnerEmail: "parceiro@avisus.test",
    commissionRatePct: 10,
    expiresAt: "2030-01-01T00:00:00.000Z",
    isActive: true,
    notes: "Observação inicial",
    ...overrides,
  };
}

describe("referral admin actions integration", () => {
  const password = "AvisusTest2026!";
  const mockedRequireAdmin = vi.mocked(requireAdmin);
  const createdCouponIds: string[] = [];
  const createdReferralUserIds: string[] = [];

  let admin: ReturnType<typeof createServiceClient>;
  let adminUserId: string;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;
  });

  beforeEach(async () => {
    admin = createServiceClient();
    const adminUser = await createTestUser(uniqueEmail("referral-actions-admin"), password);
    adminUserId = adminUser.id;
    mockedRequireAdmin.mockResolvedValue({ userId: adminUserId });
  });

  afterEach(async () => {
    vi.clearAllMocks();

    await Promise.all(createdReferralUserIds.splice(0).map((userId) => deleteTestUser(userId)));

    if (createdCouponIds.length > 0) {
      await admin.from("referral_coupons").delete().in("id", createdCouponIds.splice(0));
    }

    await deleteTestUser(adminUserId);
  });

  async function createCoupon(overrides: Partial<ReferralCouponAdminInput> = {}) {
    const input = couponInput(overrides);
    const result = await createReferralCouponAction(input);

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) {
      throw new Error(result.error);
    }

    createdCouponIds.push(result.id);
    return { id: result.id, input: { ...input, code: input.code.trim().toUpperCase() } };
  }

  async function createReferralUser(): Promise<string> {
    const user = await createTestUser(uniqueEmail("referral-actions-user"), password);
    createdReferralUserIds.push(user.id);
    return user.id;
  }

  it("creates a valid coupon and returns it in the listing", async () => {
    const created = await createCoupon({ partnerName: "Parceiro Listagem" });

    const listing = await listReferralCoupons({ status: "all" });

    expect(listing).toMatchObject({ ok: true });
    if (!listing.ok) {
      throw new Error(listing.error);
    }

    expect(listing.items).toContainEqual(
      expect.objectContaining({
        id: created.id,
        code: created.input.code,
        partnerName: "Parceiro Listagem",
        signupCount: 0,
        paidConversionCount: 0,
        commissionAmount: 0,
      }),
    );
  });

  it("updates partner fields, commission, expiration and notes", async () => {
    const created = await createCoupon();
    const updatedInput = couponInput({
      code: created.input.code,
      partnerName: "Parceiro Atualizado",
      partnerEmail: "atualizado@avisus.test",
      commissionRatePct: 25,
      expiresAt: "2031-02-03T00:00:00.000Z",
      notes: "Observação atualizada",
    });

    await expect(updateReferralCouponAction(created.id, updatedInput)).resolves.toStrictEqual({
      ok: true,
      id: created.id,
    });

    const detail = await getReferralCouponDetails(created.id);

    expect(detail).toMatchObject({ ok: true });
    if (!detail.ok) {
      throw new Error(detail.error);
    }

    expect(detail.coupon).toMatchObject({
      partnerName: "Parceiro Atualizado",
      partnerEmail: "atualizado@avisus.test",
      commissionRatePct: 25,
      expiresAt: "2031-02-03T00:00:00+00:00",
      notes: "Observação atualizada",
    });
  });

  it("keeps historical conversions available after disabling a used coupon", async () => {
    const created = await createCoupon();
    const referredUserId = await createReferralUser();

    await expect(
      recordSignupReferral({ userId: referredUserId, code: created.input.code, source: "coupon" }),
    ).resolves.toStrictEqual({ ok: true });

    await expect(toggleReferralCouponAction(created.id, false)).resolves.toStrictEqual({
      ok: true,
      id: created.id,
    });

    const detail = await getReferralCouponDetails(created.id);

    expect(detail).toMatchObject({ ok: true });
    if (!detail.ok) {
      throw new Error(detail.error);
    }

    expect(detail.coupon.isActive).toBe(false);
    expect(detail.coupon.conversions).toContainEqual(
      expect.objectContaining({ userId: referredUserId, planSelected: "free" }),
    );
  });

  it("blocks create, update and toggle when admin authorization fails", async () => {
    const created = await createCoupon();
    const notAdminError = new Error("forbidden");

    mockedRequireAdmin.mockRejectedValueOnce(notAdminError);
    await expect(createReferralCouponAction(couponInput())).rejects.toThrow("forbidden");

    mockedRequireAdmin.mockRejectedValueOnce(notAdminError);
    await expect(updateReferralCouponAction(created.id, couponInput({ code: created.input.code }))).rejects.toThrow(
      "forbidden",
    );

    mockedRequireAdmin.mockRejectedValueOnce(notAdminError);
    await expect(toggleReferralCouponAction(created.id, false)).rejects.toThrow("forbidden");
  });

  it("filters active and inactive coupons", async () => {
    const activeCoupon = await createCoupon({ isActive: true });
    const inactiveCoupon = await createCoupon({ isActive: false });

    const activeListing = await listReferralCoupons({ status: "active" });
    const inactiveListing = await listReferralCoupons({ status: "inactive" });

    expect(activeListing).toMatchObject({ ok: true });
    expect(inactiveListing).toMatchObject({ ok: true });
    if (!activeListing.ok || !inactiveListing.ok) {
      throw new Error("listing failed");
    }

    expect(activeListing.items.some((item) => item.id === activeCoupon.id)).toBe(true);
    expect(activeListing.items.some((item) => item.id === inactiveCoupon.id)).toBe(false);
    expect(inactiveListing.items.some((item) => item.id === inactiveCoupon.id)).toBe(true);
    expect(inactiveListing.items.some((item) => item.id === activeCoupon.id)).toBe(false);
  });

  it("sums commission only for conversions with first payment fields", async () => {
    const created = await createCoupon({ commissionRatePct: 12.5 });
    const paidUserId = await createReferralUser();
    const freeUserId = await createReferralUser();

    const { error } = await admin.from("referral_conversions").insert([
      {
        coupon_id: created.id,
        user_id: paidUserId,
        plan_selected: "starter",
        first_paid_date: "2030-01-02T00:00:00.000Z",
        paid_amount: 200,
        paid_currency: "BRL",
      },
      {
        coupon_id: created.id,
        user_id: freeUserId,
        plan_selected: "free",
        paid_currency: "BRL",
      },
    ]);

    expect(error).toBeNull();

    const listing = await listReferralCoupons({ status: "all" });

    expect(listing).toMatchObject({ ok: true });
    if (!listing.ok) {
      throw new Error(listing.error);
    }

    expect(listing.items.find((item) => item.id === created.id)).toMatchObject({
      signupCount: 2,
      paidConversionCount: 1,
      commissionAmount: 25,
    });
  });
});
