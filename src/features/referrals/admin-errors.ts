export const DUPLICATE_REFERRAL_COUPON_CODE_ERROR = "Já existe um cupom com este código.";

export const GENERIC_REFERRAL_COUPON_WRITE_ERROR = "Não foi possível salvar o cupom.";

type ReferralCouponWriteError = {
  code?: string;
  message: string;
};

export function mapReferralCouponWriteError(error: ReferralCouponWriteError): string {
  if (error.code === "23505" || error.message.toLowerCase().includes("uq_referral_coupons_code")) {
    return DUPLICATE_REFERRAL_COUPON_CODE_ERROR;
  }

  return GENERIC_REFERRAL_COUPON_WRITE_ERROR;
}
