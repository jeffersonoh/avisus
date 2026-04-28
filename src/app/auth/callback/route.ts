import { NextResponse, type NextRequest } from "next/server";

import {
  REFERRAL_COOKIE_NAME,
  getReferralCookieOptions,
  readReferralCookie,
} from "@/features/referrals/cookies";
import { recordSignupReferral, validateReferralCode } from "@/features/referrals/server";
import { getPostAuthRedirectPath } from "@/lib/auth/post-auth-path";
import { createServerClient } from "@/lib/supabase/server";

function sanitizeNextPath(input: string | null): string | null {
  if (!input) {
    return null;
  }

  if (!input.startsWith("/") || input.startsWith("//")) {
    return null;
  }

  return input;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Consome cookie de referral após autenticação bem-sucedida.
  const cookieStore = request.cookies;
  const referralCode = readReferralCookie(cookieStore);

  if (user && referralCode) {
    const validation = await validateReferralCode(referralCode);
    if (validation.ok) {
      await recordSignupReferral({ userId: user.id, code: referralCode, source: "coupon" });
    }
  }

  const path =
    sanitizeNextPath(url.searchParams.get("next")) ?? (await getPostAuthRedirectPath(supabase));

  const redirectUrl = new URL(path, url.origin);
  const response = NextResponse.redirect(redirectUrl);

  // Limpa cookie de referral após tentativa de consumo no callback.
  if (referralCode) {
    response.cookies.set(REFERRAL_COOKIE_NAME, "", {
      ...getReferralCookieOptions(),
      maxAge: 0,
    });
  }

  return response;
}
