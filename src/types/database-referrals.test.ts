import { describe, expect, it } from "vitest";

import { buildProfileInsert, PROFILE_REFERRAL_DEFAULTS } from "@/test/builders/profile";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

describe("referral database types", () => {
  it("accepts privileged referral profile fields without any casts", () => {
    const rowFields = {
      is_admin: false,
      referral_coupon_id: null,
      referral_source: "direct",
    } satisfies Pick<ProfileRow, "is_admin" | "referral_coupon_id" | "referral_source">;

    const updateFields = {
      is_admin: false,
      referral_coupon_id: "00000000-0000-4000-8000-000000000002",
      referral_source: "coupon",
    } satisfies Pick<ProfileUpdate, "is_admin" | "referral_coupon_id" | "referral_source">;

    expect(rowFields).toStrictEqual({
      ...PROFILE_REFERRAL_DEFAULTS,
    });
    expect(updateFields.referral_source).toBe("coupon");
  });

  it("builds profile fixtures with direct referral source by default", () => {
    expect(buildProfileInsert().referral_source).toBe("direct");
    expect(buildProfileInsert({ referral_source: "coupon" }).referral_source).toBe("coupon");
  });
});
