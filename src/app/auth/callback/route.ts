import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@/lib/supabase/server";
import { getPostAuthRedirectPath } from "@/lib/auth/post-auth-path";

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

  const path =
    sanitizeNextPath(url.searchParams.get("next")) ?? await getPostAuthRedirectPath(supabase);
  return NextResponse.redirect(new URL(path, url.origin));
}
