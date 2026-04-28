import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw Object.assign(new Error(`NEXT_REDIRECT: ${path}`), {
      digest: `NEXT_REDIRECT;replace;${path};307;`,
    });
  }),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceRoleClient: mocks.createServiceRoleClient,
}));

import { isAdmin, requireAdmin } from "./admin";

function mockServiceProfile(profile: { is_admin: boolean } | null): void {
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  mocks.createServiceRoleClient.mockReturnValue({ from });
}

function mockServerUser(user: { id: string } | null): void {
  mocks.createServerClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  });
}

describe("admin auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerUser({ id: "user-1" });
    mockServiceProfile({ is_admin: false });
  });

  it("returns true when profiles.is_admin is true", async () => {
    mockServiceProfile({ is_admin: true });

    await expect(isAdmin("admin-1")).resolves.toBe(true);
  });

  it("returns false when the profile is missing", async () => {
    mockServiceProfile(null);

    await expect(isAdmin("missing-profile")).resolves.toBe(false);
  });

  it("returns false when profiles.is_admin is false", async () => {
    mockServiceProfile({ is_admin: false });

    await expect(isAdmin("user-1")).resolves.toBe(false);
  });

  it("redirects to login when requireAdmin has no authenticated user", async () => {
    mockServerUser(null);

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT: /login");
    expect(mocks.createServiceRoleClient).not.toHaveBeenCalled();
  });

  it("redirects authenticated non-admin users away from admin", async () => {
    mockServerUser({ id: "user-1" });
    mockServiceProfile({ is_admin: false });

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT: /dashboard?error=403");
  });

  it("returns the user id for authenticated admins", async () => {
    mockServerUser({ id: "admin-1" });
    mockServiceProfile({ is_admin: true });

    await expect(requireAdmin()).resolves.toStrictEqual({ userId: "admin-1" });
  });
});
