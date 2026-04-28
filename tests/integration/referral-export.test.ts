import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";

import {
  ANON_KEY,
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  createServiceClient,
  createTestUser,
  deleteTestUser,
  uniqueEmail,
} from "./setup";

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: vi.fn(),
}));

import { GET } from "@/app/(admin)/admin/api/export/commissions/route";

const mockedRequireAdmin = vi.mocked(requireAdmin);

function uniqueReferralCode(prefix: string): string {
  return `${prefix}_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

describe("referral commission export route", () => {
  const password = "AvisusTest2026!";
  const createdCouponIds: string[] = [];
  const createdConversionIds: string[] = [];
  const createdUserIds: string[] = [];

  let admin: ReturnType<typeof createServiceClient>;
  let adminUserId: string;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;
  });

  beforeEach(async () => {
    admin = createServiceClient();
    const adminUser = await createTestUser(uniqueEmail("referral-export-admin"), password);
    adminUserId = adminUser.id;
    createdUserIds.push(adminUserId);
    mockedRequireAdmin.mockResolvedValue({ userId: adminUserId });
  });

  afterEach(async () => {
    vi.clearAllMocks();

    if (createdConversionIds.length > 0) {
      await admin.from("referral_conversions").delete().in("id", createdConversionIds.splice(0));
    }

    if (createdCouponIds.length > 0) {
      await admin.from("referral_coupons").delete().in("id", createdCouponIds.splice(0));
    }

    await Promise.all(createdUserIds.splice(0).map((userId) => deleteTestUser(userId)));
  });

  async function createCouponWithConversions() {
    const couponCode = uniqueReferralCode("EXP");
    const { data: coupon, error: couponError } = await admin
      .from("referral_coupons")
      .insert({
        code: couponCode,
        partner_name: "Parceiro Exportação, com aspas",
        partner_email: "exportacao@avisus.test",
        commission_rate_pct: 12.5,
        is_active: true,
        created_by: adminUserId,
      })
      .select("id")
      .single();

    expect(couponError).toBeNull();
    if (!coupon) {
      throw new Error("coupon insert failed");
    }
    createdCouponIds.push(coupon.id);

    const paidUser = await createTestUser(uniqueEmail("referral-export-paid"), password);
    const freeUser = await createTestUser(uniqueEmail("referral-export-free"), password);
    createdUserIds.push(paidUser.id, freeUser.id);

    const { data: conversions, error: conversionsError } = await admin
      .from("referral_conversions")
      .insert([
        {
          coupon_id: coupon.id,
          user_id: paidUser.id,
          plan_selected: "starter",
          signup_date: "2030-01-01T00:00:00.000Z",
          first_paid_date: "2030-01-02T00:00:00.000Z",
          paid_amount: 200,
          paid_currency: "BRL",
          stripe_invoice_id: `in_${couponCode.toLowerCase()}`,
        },
        {
          coupon_id: coupon.id,
          user_id: freeUser.id,
          plan_selected: "free",
          signup_date: "2030-01-03T00:00:00.000Z",
          paid_currency: "BRL",
        },
      ])
      .select("id")
      .returns<Array<{ id: string }>>();

    expect(conversionsError).toBeNull();
    if (!conversions) {
      throw new Error("conversion insert failed");
    }
    createdConversionIds.push(...conversions.map((conversion) => conversion.id));

    return { couponCode };
  }

  it("allows admin to download CSV with attachment headers", async () => {
    await createCouponWithConversions();

    const response = await GET(
      new NextRequest("http://localhost/admin/api/export/commissions?status=paid"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
  });

  it("blocks non-admin commission export", async () => {
    mockedRequireAdmin.mockRejectedValueOnce(new Error("forbidden"));

    const response = await GET(new NextRequest("http://localhost/admin/api/export/commissions"));

    expect(response.status).toBe(403);
  });

  it("includes paid conversion and excludes rows without first paid date for paid filter", async () => {
    const { couponCode } = await createCouponWithConversions();

    const response = await GET(
      new NextRequest("http://localhost/admin/api/export/commissions?status=paid"),
    );
    const csv = await response.text();

    expect(csv).toContain(couponCode);
    expect(csv).toContain("starter,200.00,BRL,25.00");
    expect(csv).not.toContain(",free,");
  });
});
