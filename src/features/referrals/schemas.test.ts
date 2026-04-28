import { describe, expect, it } from "vitest";

import { mapReferralCouponWriteError } from "./admin-errors";
import { normalizeReferralCode, referralCodeSchema, referralCouponAdminSchema } from "./schemas";

describe("referral schemas", () => {
  it("normalizes referral codes to uppercase without surrounding spaces", () => {
    expect(normalizeReferralCode(" parceiro_avisus ")).toBe("PARCEIRO_AVISUS");
    expect(referralCodeSchema.parse(" parceiro_avisus ")).toBe("PARCEIRO_AVISUS");
  });

  it("rejects referral codes shorter than five characters", () => {
    expect(referralCodeSchema.safeParse("AB12").success).toBe(false);
  });

  it("rejects characters outside uppercase letters, numbers and underscore after normalization", () => {
    expect(referralCodeSchema.safeParse(" parceiro-2026 ").success).toBe(false);
  });

  it("accepts admin commission boundary values", () => {
    expect(referralCouponAdminSchema.safeParse(adminCouponInput({ commissionRatePct: 0 })).success).toBe(true);
    expect(referralCouponAdminSchema.safeParse(adminCouponInput({ commissionRatePct: 100 })).success).toBe(true);
  });

  it("rejects admin commission values outside boundaries", () => {
    expect(referralCouponAdminSchema.safeParse(adminCouponInput({ commissionRatePct: -1 })).success).toBe(false);
    expect(referralCouponAdminSchema.safeParse(adminCouponInput({ commissionRatePct: 101 })).success).toBe(false);
  });

  it("normalizes admin coupon code to uppercase", () => {
    const result = referralCouponAdminSchema.parse(adminCouponInput({ code: " parceiro_avisus " }));

    expect(result.code).toBe("PARCEIRO_AVISUS");
  });

  it("maps unique coupon code errors to a clear message", () => {
    expect(
      mapReferralCouponWriteError({
        code: "23505",
        message: "duplicate key value violates unique constraint",
      }),
    ).toBe("Já existe um cupom com este código.");
  });
});

function adminCouponInput(overrides: Partial<{
  code: string;
  partnerName: string;
  partnerEmail: string;
  commissionRatePct: number;
  expiresAt: string | null;
  isActive: boolean;
  notes: string;
}> = {}) {
  return {
    code: "PARCEIRO_AVISUS",
    partnerName: "Parceiro Teste",
    partnerEmail: "parceiro@avisus.test",
    commissionRatePct: 10,
    expiresAt: "2030-01-01T00:00:00.000Z",
    isActive: true,
    notes: "Observação comercial",
    ...overrides,
  };
}
