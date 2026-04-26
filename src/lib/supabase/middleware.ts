import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
];

export const AUTH_USER_ID_HEADER = "x-avisus-user-id";
export const AUTH_USER_EMAIL_HEADER = "x-avisus-user-email";

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

type CookieWrite = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const pathname = request.nextUrl.pathname;
  const protectedRoute = isProtectedRoute(pathname);

  const pendingCookies: CookieWrite[] = [];

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
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && protectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.delete(AUTH_USER_ID_HEADER);
  forwardedHeaders.delete(AUTH_USER_EMAIL_HEADER);
  if (user) {
    forwardedHeaders.set(AUTH_USER_ID_HEADER, user.id);
    if (user.email) forwardedHeaders.set(AUTH_USER_EMAIL_HEADER, user.email);
  }

  const response = NextResponse.next({ request: { headers: forwardedHeaders } });

  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, {
      ...options,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
