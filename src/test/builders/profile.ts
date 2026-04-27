import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export const PROFILE_REFERRAL_DEFAULTS = {
  is_admin: false,
  referral_coupon_id: null,
  referral_source: "direct",
} satisfies Pick<ProfileRow, "is_admin" | "referral_coupon_id" | "referral_source">;

export function buildProfileInsert(overrides: Partial<ProfileInsert> = {}): ProfileInsert {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Usuario Teste",
    referral_source: PROFILE_REFERRAL_DEFAULTS.referral_source,
    ...overrides,
  } satisfies ProfileInsert;
}
