import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { upsertProducts } from "./products";

function createProductsSupabaseMock(returnedRows: Array<{ id: string; marketplace: string; external_id: string }>) {
  const select = vi.fn().mockResolvedValue({ data: returnedRows, error: null });
  const upsert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ upsert });

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    from,
    upsert,
    select,
  };
}

describe("products writer", () => {
  it("first scan upserts products without duplication", async () => {
    const { supabase, from, upsert, select } = createProductsSupabaseMock([
      { id: "product-1", marketplace: "Mercado Livre", external_id: "MLB123" },
    ]);

    const scannedAt = "2026-04-17T18:00:00.000Z";
    const result = await upsertProducts(
      supabase,
      [
        {
          marketplace: "Mercado Livre",
          externalId: "MLB123",
          name: "Produto teste",
          category: "ferramentas",
          imageUrl: "https://img.example/produto.jpg",
          price: 199.9,
        },
      ],
      scannedAt,
    );

    expect(from).toHaveBeenCalledWith("products");
    expect(select).toHaveBeenCalledWith("id, marketplace, external_id");

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          marketplace: "Mercado Livre",
          external_id: "MLB123",
          name: "Produto teste",
          category: "ferramentas",
          image_url: "https://img.example/produto.jpg",
          last_price: 199.9,
          last_seen_at: scannedAt,
        },
      ],
      { onConflict: "marketplace,external_id" },
    );

    expect(result.byExternalKey.get("Mercado Livre:mlb123")).toBe("product-1");
  });

  it("second scan keeps one product row and updates last_seen_at", async () => {
    const { supabase, upsert } = createProductsSupabaseMock([
      { id: "product-1", marketplace: "Mercado Livre", external_id: "MLB123" },
    ]);

    const firstScanAt = "2026-04-17T18:00:00.000Z";
    const secondScanAt = "2026-04-17T18:05:00.000Z";

    await upsertProducts(
      supabase,
      [
        {
          marketplace: "Mercado Livre",
          externalId: "MLB123",
          name: "Produto teste",
          category: null,
          imageUrl: null,
          price: 199.9,
        },
      ],
      firstScanAt,
    );

    await upsertProducts(
      supabase,
      [
        {
          marketplace: "Mercado Livre",
          externalId: "MLB123",
          name: "Produto teste",
          category: null,
          imageUrl: null,
          price: 189.9,
        },
      ],
      secondScanAt,
    );

    const firstPayload = upsert.mock.calls[0]?.[0] as Array<{ last_seen_at: string }>;
    const secondPayload = upsert.mock.calls[1]?.[0] as Array<{ last_seen_at: string }>;

    expect(firstPayload).toHaveLength(1);
    expect(secondPayload).toHaveLength(1);
    expect(firstPayload[0]?.last_seen_at).toBe(firstScanAt);
    expect(secondPayload[0]?.last_seen_at).toBe(secondScanAt);
  });
});
