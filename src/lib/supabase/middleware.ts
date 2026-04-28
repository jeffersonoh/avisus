import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getReferralCookieOptions,
  REFERRAL_COOKIE_NAME,
} from "@/features/referrals/cookies";
import { referralCodeSchema } from "@/features/referrals/schemas";
import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/interesses",
  "/alertas",
  "/favoritos",
  "/perfil",
  "/planos",
  "/admin",
];

export const AUTH_USER_ID_HEADER = "x-avisus-user-id";
export const AUTH_USER_EMAIL_HEADER = "x-avisus-user-email";

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

type CookieWrite = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function getReferralCookieFromRequest(request: NextRequest): CookieWrite | null {
  const rawRef = request.nextUrl.searchParams.get("ref");
  if (!rawRef) {
    return null;
  }

  const parsedRef = referralCodeSchema.safeParse(rawRef);
  if (!parsedRef.success) {
    return null;
  }

  return {
    name: REFERRAL_COOKIE_NAME,
    value: parsedRef.data,
    options: getReferralCookieOptions(),
  };
}

function applyResponseCookies(
  response: NextResponse,
  pendingCookies: CookieWrite[],
  referralCookie: CookieWrite | null,
): NextResponse {
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, {
      ...options,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  if (referralCookie) {
    response.cookies.set(referralCookie.name, referralCookie.value, referralCookie.options);
  }

  return response;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const pathname = request.nextUrl.pathname;
  const protectedRoute = isProtectedRoute(pathname);
  const adminRoute = isAdminRoute(pathname);

  const pendingCookies: CookieWrite[] = [];
  const referralCookie = getReferralCookieFromRequest(request);

  const supabase = createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          pendingCookies.push({ name, value, options });
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? "/dashboard" : "/login";
    redirectUrl.search = "";
    return applyResponseCookies(NextResponse.redirect(redirectUrl), pendingCookies, referralCookie);
  }

  if (!user && protectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return applyResponseCookies(NextResponse.redirect(redirectUrl), pendingCookies, referralCookie);
  }

  if (user && adminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_admin !== true) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("error", "403");
      return applyResponseCookies(NextResponse.redirect(redirectUrl), pendingCookies, referralCookie);
    }
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.delete(AUTH_USER_ID_HEADER);
  forwardedHeaders.delete(AUTH_USER_EMAIL_HEADER);
  if (user) {
    forwardedHeaders.set(AUTH_USER_ID_HEADER, user.id);
    if (user.email) forwardedHeaders.set(AUTH_USER_EMAIL_HEADER, user.email);
  }

  return applyResponseCookies(
    NextResponse.next({ request: { headers: forwardedHeaders } }),
    pendingCookies,
    referralCookie,
  );
}
