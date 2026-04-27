import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearReferralCookie,
  getReferralCookieOptions,
  readReferralCookie,
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
} from "./cookies";

describe("referral cookies", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defines secure first-party cookie options", () => {
    expect(getReferralCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 86400,
    });
    expect(REFERRAL_COOKIE_MAX_AGE_SECONDS).toBe(86400);
  });

  it("marks the referral cookie as secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(getReferralCookieOptions().secure).toBe(true);
  });

  it("reads and normalizes a valid referral cookie", () => {
    expect(
      readReferralCookie({
        get: (name) => (name === REFERRAL_COOKIE_NAME ? { value: " parceiro_2026 " } : undefined),
      }),
    ).toBe("PARCEIRO_2026");
  });

  it("ignores missing or invalid referral cookies", () => {
    expect(readReferralCookie({ get: () => undefined })).toBeNull();
    expect(
      readReferralCookie({
        get: () => ({ value: "abc-1" }),
      }),
    ).toBeNull();
  });

  it("clears the referral cookie by expiring it", () => {
    const calls: Array<{ name: string; value: string; maxAge: number }> = [];

    clearReferralCookie({
      set: (name, value, options) => calls.push({ name, value, maxAge: options.maxAge }),
    });

    expect(calls).toStrictEqual([{ name: REFERRAL_COOKIE_NAME, value: "", maxAge: 0 }]);
  });
});
