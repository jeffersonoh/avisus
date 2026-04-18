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
  it("expires and removes stale records", async () => {
    const { supabase, calls } = createSupabaseMock([
      { data: [{ id: "opp-1" }, { id: "opp-2" }], error: null },
      { data: [{ id: "ph-1" }], error: null },
      { data: [{ id: "old-opp" }], error: null },
    ]);

    const result = await runCleanupJob(supabase, {
      now: () => new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(result).toEqual({
      expired: 2,
      deletedPriceHistory: 1,
      deletedOpportunities: 1,
    });

    expect(calls).toHaveLength(3);
    expect(calls[0]?.table).toBe("opportunities");
    expect(calls[0]?.filters.some((entry) => entry.method === "not")).toBe(true);
    expect(calls[1]?.table).toBe("price_history");
    expect(calls[1]?.filters.some((entry) => entry.method === "lt")).toBe(true);
    expect(calls[2]?.table).toBe("opportunities");
    expect(calls[2]?.filters.some((entry) => entry.method === "eq")).toBe(true);
  });

  it("throws when one cleanup operation fails", async () => {
    const { supabase } = createSupabaseMock([
      { data: [{ id: "opp-1" }], error: null },
      { data: null, error: { message: "permission denied" } },
      { data: [{ id: "old-opp" }], error: null },
    ]);

    await expect(runCleanupJob(supabase)).rejects.toThrow(
      "Cleanup failed while deleting price_history: permission denied",
    );
  });
});
