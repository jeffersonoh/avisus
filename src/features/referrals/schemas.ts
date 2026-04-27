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
  commissionRatePct: z.number().min(0).max(100),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(1000).optional(),
});

export type ReferralCouponAdminInput = z.infer<typeof referralCouponAdminSchema>;
