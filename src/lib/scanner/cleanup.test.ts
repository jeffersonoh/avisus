import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/types/database";

import { runCleanupJob } from "./cleanup";

type SelectResponse = {
  data: Array<{ id: string }> | null;
  error: { message: string } | null;
};

function createSupabaseMock(selectResponses: SelectResponse[]) {
  const calls: Array<{ table: string; filters: Array<{ method: string; args: unknown[] }> }> = [];

  const from = (table: string) => {
    const filters: Array<{ method: string; args: unknown[] }> = [];
    calls.push({ table, filters });

    const chain = {
      update: () => chain,
      delete: () => chain,
      eq: (...args: unknown[]) => {
        filters.push({ method: "eq", args });
        return chain;
      },
      not: (...args: unknown[]) => {
        filters.push({ method: "not", args });
        return chain;
      },
      lt: (...args: unknown[]) => {
        filters.push({ method: "lt", args });
        return chain;
      },
      select: async () => selectResponses.shift() ?? { data: [], error: null },
    };

    return chain;
  };

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    calls,
  };
}

describe("cleanup job", () => {
  it("expires and removes stale records and resets stale is_live", async () => {
    const { supabase, calls } = createSupabaseMock([
      { data: [{ id: "opp-1" }, { id: "opp-2" }], error: null },
      { data: [{ id: "ph-1" }], error: null },
      { data: [{ id: "old-opp" }], error: null },
      { data: [{ id: "seller-1" }], error: null },
    ]);

    const result = await runCleanupJob(supabase, {
      now: () => new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(result).toEqual({
      expired: 2,
      deletedPriceHistory: 1,
      deletedOpportunities: 1,
      resetLive: 1,
    });

    expect(calls).toHaveLength(4);
    expect(calls[0]?.table).toBe("opportunities");
    expect(calls[0]?.filters.some((entry) => entry.method === "not")).toBe(true);
    expect(calls[1]?.table).toBe("price_history");
    expect(calls[1]?.filters.some((entry) => entry.method === "lt")).toBe(true);
    expect(calls[2]?.table).toBe("opportunities");
    expect(calls[2]?.filters.some((entry) => entry.method === "eq")).toBe(true);
    expect(calls[3]?.table).toBe("favorite_sellers");
    expect(calls[3]?.filters.some((entry) => entry.method === "eq")).toBe(true);
    expect(calls[3]?.filters.some((entry) => entry.method === "lt")).toBe(true);
  });

  it("resets sellers with last_checked_at older than 1h", async () => {
    const { supabase, calls } = createSupabaseMock([
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [{ id: "stale-seller" }], error: null },
    ]);

    const now = new Date("2026-04-18T12:00:00.000Z");
    const result = await runCleanupJob(supabase, { now: () => now });

    expect(result.resetLive).toBe(1);

    const liveResetCall = calls[3];
    const ltFilter = liveResetCall?.filters.find((f) => f.method === "lt");
    expect(ltFilter?.args[0]).toBe("last_checked_at");
    expect(ltFilter?.args[1]).toBe(new Date(now.getTime() - 60 * 60 * 1000).toISOString());
  });

  it("returns resetLive=0 when no sellers have stale is_live", async () => {
    const { supabase } = createSupabaseMock([
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await runCleanupJob(supabase);
    expect(result.resetLive).toBe(0);
  });

  it("throws when one cleanup operation fails", async () => {
    const { supabase } = createSupabaseMock([
      { data: [{ id: "opp-1" }], error: null },
      { data: null, error: { message: "permission denied" } },
      { data: [{ id: "old-opp" }], error: null },
      { data: [], error: null },
    ]);

    await expect(runCleanupJob(supabase)).rejects.toThrow(
      "Cleanup failed while deleting price_history: permission denied",
    );
  });

  it("throws when resetLive operation fails", async () => {
    const { supabase } = createSupabaseMock([
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: null, error: { message: "update failed" } },
    ]);

    await expect(runCleanupJob(supabase)).rejects.toThrow(
      "Cleanup failed while resetting stale is_live: update failed",
    );
  });
});
