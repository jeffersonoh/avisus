import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ANON_KEY,
  createServiceClient,
  createTestUser,
  deleteTestUser,
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  uniqueEmail,
} from "./setup";

const mockExchangeCodeForSession = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
        getUser: () => mockGetUser(),
      },
    }),
}));

// Import GET after mocking
const { GET } = await import("@/app/auth/callback/route");

function uniqueReferralCode(prefix: string): string {
  return `${prefix}_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

describe("OAuth callback with referral cookie", () => {
  const password = "AvisusTest2026!";
  const createdCouponIds: string[] = [];

  let admin: ReturnType<typeof createServiceClient>;
  let userId: string;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;
  });

  beforeEach(async () => {
    admin = createServiceClient();
    const user = await createTestUser(uniqueEmail("oauth-callback"), password);
    userId = user.id;
  });

  afterEach(async () => {
    await deleteTestUser(userId);

    if (createdCouponIds.length > 0) {
      await admin.from("referral_coupons").delete().in("id", createdCouponIds);
      createdCouponIds.length = 0;
    }
  });

  async function createCoupon(overrides: { is_active?: boolean; expires_at?: string | null } = {}) {
    const { data, error } = await admin
      .from("referral_coupons")
      .insert({
        code: uniqueReferralCode("OAUTH"),
        partner_name: "Parceiro OAuth",
        commission_rate_pct: 10,
        ...overrides,
      })
      .select("id, code")
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    createdCouponIds.push(data!.id);
    return data!;
  }

  function createMockNextRequest({
    code = "mock-oauth-code",
    next = "/dashboard",
    referralCookie,
  }: {
    code?: string;
    next?: string;
    referralCookie?: string;
  }): import("next/server").NextRequest {
    const url = new URL("http://localhost:3000/auth/callback");
    url.searchParams.set("code", code);
    if (next) url.searchParams.set("next", next);

    const headers = new Headers();
    if (referralCookie) {
      headers.set("cookie", `avisus_referral_code=${referralCookie}`);
    }

    const request = new Request(url.toString(), { headers });

    // Add mock cookies interface compatible with NextRequest
    const cookieMap = new Map<string, string>();
    if (referralCookie) {
      cookieMap.set("avisus_referral_code", referralCookie);
    }

    Object.defineProperty(request, "cookies", {
      value: {
        get: (name: string) => {
          const value = cookieMap.get(name);
          return value ? { name, value } : undefined;
        },
        getAll: () => Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value })),
        has: (name: string) => cookieMap.has(name),
        delete: (name: string) => cookieMap.delete(name),
        set: () => {},
        clear: () => cookieMap.clear(),
        [Symbol.for("next.cookies")]: true,
      },
      writable: true,
    });

    return request as unknown as import("next/server").NextRequest;
  }

  it("registers referral conversion when valid cookie is present", async () => {
    const coupon = await createCoupon();

    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });

    const request = createMockNextRequest({
      referralCookie: coupon.code,
      next: "/dashboard",
    });

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");

    // Verify conversion was created
    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("coupon_id, user_id, plan_selected")
      .eq("user_id", userId)
      .single();

    expect(conversion).toStrictEqual({
      coupon_id: coupon.id,
      user_id: userId,
      plan_selected: "free",
    });

    // Verify cookie was cleared (maxAge=0)
    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toContain("avisus_referral_code=");
    expect(setCookieHeader).toContain("Max-Age=0");
  });

  it("redirects without creating conversion when no referral cookie", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });

    const request = createMockNextRequest({ next: "/onboarding" });

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/onboarding");

    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    expect(conversion).toBeNull();
  });

  it("redirects to login when OAuth code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: { message: "Invalid code" } });

    const request = createMockNextRequest({ code: "invalid-code" });

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=oauth");
  });
});

describe("Email signup referral integration", () => {
  const password = "AvisusTest2026!";
  const createdCouponIds: string[] = [];

  let admin: ReturnType<typeof createServiceClient>;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;
  });

  beforeEach(() => {
    admin = createServiceClient();
  });

  afterEach(async () => {
    if (createdCouponIds.length > 0) {
      await admin.from("referral_coupons").delete().in("id", createdCouponIds);
      createdCouponIds.length = 0;
    }
  });

  async function createCoupon(overrides: { is_active?: boolean; expires_at?: string | null } = {}) {
    const { data, error } = await admin
      .from("referral_coupons")
      .insert({
        code: uniqueReferralCode("EMAIL"),
        partner_name: "Parceiro Email",
        commission_rate_pct: 15,
        ...overrides,
      })
      .select("id, code")
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    createdCouponIds.push(data!.id);
    return data!;
  }

  it("creates user and conversion when signup has valid referral code", async () => {
    const coupon = await createCoupon();
    const email = uniqueEmail("referral-email");

    // Create user via Supabase admin
    const user = await createTestUser(email, password);

    // Simulate what signUpWithEmail does after successful signup
    const result = await import("@/features/referrals/server").then((mod) =>
      mod.recordSignupReferral({ userId: user.id, code: coupon.code, source: "coupon" }),
    );

    expect(result).toStrictEqual({ ok: true });

    // Verify conversion
    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("coupon_id, user_id, plan_selected")
      .eq("user_id", user.id)
      .single();

    expect(conversion).toStrictEqual({
      coupon_id: coupon.id,
      user_id: user.id,
      plan_selected: "free",
    });

    // Verify profile attribution
    const { data: profile } = await admin
      .from("profiles")
      .select("referral_coupon_id, referral_source")
      .eq("id", user.id)
      .single();

    expect(profile).toStrictEqual({
      referral_coupon_id: coupon.id,
      referral_source: "coupon",
    });

    await deleteTestUser(user.id);
  });

  it("does not create conversion for invalid referral code", async () => {
    const email = uniqueEmail("referral-invalid");
    const user = await createTestUser(email, password);

    const result = await import("@/features/referrals/server").then((mod) =>
      mod.recordSignupReferral({ userId: user.id, code: "INVALID-CODE", source: "coupon" }),
    );

    expect(result).toStrictEqual({ ok: false, reason: "invalid_format" });

    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    expect(conversion).toBeNull();

    await deleteTestUser(user.id);
  });

  it("creates user without conversion when no referral code", async () => {
    const email = uniqueEmail("referral-none");
    const user = await createTestUser(email, password);

    const { data: conversion } = await admin
      .from("referral_conversions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    expect(conversion).toBeNull();

    const { data: profile } = await admin
      .from("profiles")
      .select("referral_coupon_id, referral_source")
      .eq("id", user.id)
      .single();

    expect(profile).toStrictEqual({
      referral_coupon_id: null,
      referral_source: "direct",
    });

    await deleteTestUser(user.id);
  });
});
