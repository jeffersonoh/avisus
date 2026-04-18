import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { runHotRefresh } from "./hot";

function createSupabaseMock(options?: {
  rpcError?: { message: string } | null;
  countError?: { message: string } | null;
  count?: number | null;
}) {
  const rpc = vi.fn().mockResolvedValue({
    data: null,
    error: options?.rpcError ?? null,
  });

  const countQuery = {
    eq: vi.fn(),
  };

  countQuery.eq.mockImplementation((_column: string, value: unknown) => {
    if (value === true) {
      return Promise.resolve({
        count: options?.count ?? 0,
        error: options?.countError ?? null,
      });
    }

    return countQuery;
  });

  const select = vi.fn().mockReturnValue(countQuery);
  const from = vi.fn().mockReturnValue({ select });

  return {
    supabase: {
      rpc,
      from,
    } as unknown as SupabaseClient<Database>,
    rpc,
    from,
    select,
    countQuery,
  };
}

describe("hot refresh", () => {
  it("runs refresh_hot_flags and returns active hot count", async () => {
    const mock = createSupabaseMock({ count: 12 });

    const result = await runHotRefresh(mock.supabase);

    expect(result).toEqual({ refreshed: 12 });
    expect(mock.rpc).toHaveBeenCalledWith("refresh_hot_flags");
    expect(mock.from).toHaveBeenCalledWith("opportunities");
    expect(mock.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
  });

  it("throws when refresh_hot_flags rpc fails", async () => {
    const mock = createSupabaseMock({
      rpcError: { message: "permission denied" },
    });

    await expect(runHotRefresh(mock.supabase)).rejects.toThrow(
      "Failed to refresh hot flags: permission denied",
    );
  });
});
