import { describe, expect, it } from "vitest";

import { normalizeReferralCode, referralCodeSchema } from "./schemas";

describe("referral schemas", () => {
  it("normalizes referral codes to uppercase without surrounding spaces", () => {
    expect(normalizeReferralCode(" parceiro_2026 ")).toBe("PARCEIRO_2026");
    expect(referralCodeSchema.parse(" parceiro_2026 ")).toBe("PARCEIRO_2026");
  });

  it("rejects referral codes shorter than five characters", () => {
    expect(referralCodeSchema.safeParse("AB12").success).toBe(false);
  });

  it("rejects characters outside uppercase letters, numbers and underscore after normalization", () => {
    expect(referralCodeSchema.safeParse(" parceiro-2026 ").success).toBe(false);
  });
});
