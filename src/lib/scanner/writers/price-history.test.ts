import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { insertPriceHistorySnapshots } from "./price-history";

function createPriceHistorySupabaseMock() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({ insert });

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    from,
    insert,
  };
}

describe("price-history writer", () => {
  it("inserts snapshots and preserves units_sold when available", async () => {
    const { supabase, from, insert } = createPriceHistorySupabaseMock();

    const insertedCount = await insertPriceHistorySnapshots(supabase, [
      {
        productId: "product-1",
        marketplace: "Mercado Livre",
        price: 199.9,
        originalPrice: 249.9,
        discountPct: 20,
        unitsSold: 23,
      },
      {
        productId: "product-2",
        marketplace: "Magazine Luiza",
        price: 120,
        originalPrice: 120,
        discountPct: 0,
        unitsSold: null,
      },
    ]);

    expect(insertedCount).toBe(2);
    expect(from).toHaveBeenCalledWith("price_history");
    expect(insert).toHaveBeenCalledWith([
      {
        product_id: "product-1",
        marketplace: "Mercado Livre",
        price: 199.9,
        original_price: 249.9,
        discount_pct: 20,
        units_sold: 23,
      },
      {
        product_id: "product-2",
        marketplace: "Magazine Luiza",
        price: 120,
        original_price: 120,
        discount_pct: 0,
        units_sold: null,
      },
    ]);
  });

  it("creates a new snapshot in second scan instead of updating existing rows", async () => {
    const { supabase, insert } = createPriceHistorySupabaseMock();

    await insertPriceHistorySnapshots(supabase, [
      {
        productId: "product-1",
        marketplace: "Mercado Livre",
        price: 199.9,
        originalPrice: 249.9,
        discountPct: 20,
        unitsSold: 10,
      },
    ]);

    await insertPriceHistorySnapshots(supabase, [
      {
        productId: "product-1",
        marketplace: "Mercado Livre",
        price: 189.9,
        originalPrice: 239.9,
        discountPct: 20.84,
        unitsSold: 11,
      },
    ]);

    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[0]?.[0]).toEqual([
      {
        product_id: "product-1",
        marketplace: "Mercado Livre",
        price: 199.9,
        original_price: 249.9,
        discount_pct: 20,
        units_sold: 10,
      },
    ]);
    expect(insert.mock.calls[1]?.[0]).toEqual([
      {
        product_id: "product-1",
        marketplace: "Mercado Livre",
        price: 189.9,
        original_price: 239.9,
        discount_pct: 20.84,
        units_sold: 11,
      },
    ]);
  });
});
