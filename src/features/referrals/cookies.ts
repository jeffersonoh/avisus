import { referralCodeSchema } from "./schemas";

export const REFERRAL_COOKIE_NAME = "avisus_referral_code";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export type ReferralCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

type ReadableCookieStore = {
  get(name: string): { value: string } | undefined;
};

type WritableCookieStore = {
  set(name: string, value: string, options: ReferralCookieOptions): void;
};

export function getReferralCookieOptions(): ReferralCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
  };
}

export function readReferralCookie(cookieStore: ReadableCookieStore): string | null {
  const rawValue = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
  if (!rawValue) {
    return null;
  }

  const parsed = referralCodeSchema.safeParse(rawValue);
  return parsed.success ? parsed.data : null;
}

export function clearReferralCookie(cookieStore: WritableCookieStore): void {
  cookieStore.set(REFERRAL_COOKIE_NAME, "", {
    ...getReferralCookieOptions(),
    maxAge: 0,
  });
}
