import { z } from "zod";

export const REFERRAL_CODE_REGEX = /^[A-Z0-9_]{5,30}$/;

export function normalizeReferralCode(input: string): string {
  return input.trim().toUpperCase();
}

export const referralCodeSchema = z
  .string()
  .trim()
  .transform((value) => normalizeReferralCode(value))
  .refine((value) => REFERRAL_CODE_REGEX.test(value), "Cupom inválido.");

export const referralCouponAdminSchema = z.object({
  code: referralCodeSchema,
  partnerName: z.string().trim().min(2).max(120),
  partnerEmail: z.string().trim().email().optional().or(z.literal("")),
  commissionRatePct: z
    .number({ invalid_type_error: "Comissão inválida." })
    .min(0, "Comissão deve estar entre 0 e 100.")
    .max(100, "Comissão deve estar entre 0 e 100."),
  expiresAt: z.string().datetime({ message: "Data de expiração inválida." }).nullable().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(1000).optional(),
});

export const referralCouponStatusFilterSchema = z.enum(["all", "active", "inactive"]);

export const referralCouponListFiltersSchema = z.object({
  status: referralCouponStatusFilterSchema.default("all"),
  limit: z.number().int().min(1).max(50).default(50),
});

export type ReferralCouponAdminInput = z.infer<typeof referralCouponAdminSchema>;
export type ReferralCouponListFiltersInput = z.input<typeof referralCouponListFiltersSchema>;
export type ReferralCouponStatusFilter = z.infer<typeof referralCouponStatusFilterSchema>;
