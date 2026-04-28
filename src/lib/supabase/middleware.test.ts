import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REFERRAL_COOKIE_NAME } from "@/features/referrals/cookies";

import { updateSession } from "./middleware";

const supabaseMocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: supabaseMocks.createServerClient,
}));

type TestUser = { id: string; email?: string | null };
type CookieToSet = {
  name: string;
  value: string;
  options?: {
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  };
};
type SupabaseMiddlewareOptions = {
  cookies: {
    setAll(cookiesToSet: CookieToSet[]): void;
  };
};

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "https://avisus.test"));
}

function mockSupabase(input: {
  user: TestUser | null;
  isAdmin?: boolean;
  pendingCookies?: CookieToSet[];
}): void {
  supabaseMocks.createServerClient.mockImplementation((...args: unknown[]) => {
    const options = args[2] as SupabaseMiddlewareOptions;
    if (input.pendingCookies) {
      options.cookies.setAll(input.pendingCookies);
    }

    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: input.user } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: input.isAdmin === undefined ? null : { is_admin: input.isAdmin },
              error: null,
            }),
          })),
        })),
      })),
    };
  });
}

describe("Supabase middleware", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://avisus.supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("stores a valid referral cookie when root redirects to login", async () => {
    mockSupabase({
      user: null,
      pendingCookies: [{ name: "sb-session", value: "refreshed", options: { path: "/" } }],
    });

    const response = await updateSession(createRequest("/?ref=parceiro_avisus"));

    expect(response.headers.get("location")).toBe("https://avisus.test/login");
    expect(response.cookies.get("sb-session")).toMatchObject({ name: "sb-session", value: "refreshed" });
    expect(response.cookies.get(REFERRAL_COOKIE_NAME)).toMatchObject({
      name: REFERRAL_COOKIE_NAME,
      value: "PARCEIRO_AVISUS",
    });
  });

  it("stores a valid referral cookie when root redirects an authenticated user to dashboard", async () => {
    mockSupabase({ user: { id: "user-1" } });

    const response = await updateSession(createRequest("/?ref=parceiro_avisus"));

    expect(response.headers.get("location")).toBe("https://avisus.test/dashboard");
    expect(response.cookies.get(REFERRAL_COOKIE_NAME)).toMatchObject({
      name: REFERRAL_COOKIE_NAME,
      value: "PARCEIRO_AVISUS",
    });
  });

  it("does not store invalid referral codes", async () => {
    mockSupabase({ user: null });

    const response = await updateSession(createRequest("/?ref=abc"));

    expect(response.headers.get("location")).toBe("https://avisus.test/login");
    expect(response.cookies.get(REFERRAL_COOKIE_NAME)).toBeUndefined();
  });

  it("preserves pending Supabase cookies together with the referral cookie", async () => {
    mockSupabase({
      user: { id: "user-1", email: "user@avisus.test" },
      pendingCookies: [
        {
          name: "sb-session",
          value: "refreshed",
          options: { path: "/", maxAge: 3600 },
        },
      ],
    });

    const response = await updateSession(createRequest("/dashboard?ref=parceiro_avisus"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get("sb-session")).toMatchObject({ name: "sb-session", value: "refreshed" });
    expect(response.cookies.get(REFERRAL_COOKIE_NAME)).toMatchObject({
      name: REFERRAL_COOKIE_NAME,
      value: "PARCEIRO_AVISUS",
    });
  });

  it("redirects unauthenticated admin users to login with next path", async () => {
    mockSupabase({ user: null });

    const response = await updateSession(createRequest("/admin/cupons"));

    expect(response.headers.get("location")).toBe("https://avisus.test/login?next=%2Fadmin%2Fcupons");
  });

  it("redirects authenticated non-admin users away from admin", async () => {
    mockSupabase({ user: { id: "user-1" }, isAdmin: false });

    const response = await updateSession(createRequest("/admin/cupons"));

    expect(response.headers.get("location")).toBe("https://avisus.test/dashboard?error=403");
  });

  it("allows authenticated admin users to continue to admin", async () => {
    mockSupabase({ user: { id: "admin-1", email: "admin@avisus.test" }, isAdmin: true });

    const response = await updateSession(createRequest("/admin/cupons"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-avisus-user-id")).toBe("admin-1");
  });

  it("keeps existing protected route redirects for anonymous users", async () => {
    mockSupabase({ user: null });

    const response = await updateSession(createRequest("/dashboard"));

    expect(response.headers.get("location")).toBe("https://avisus.test/login?next=%2Fdashboard");
  });
});
