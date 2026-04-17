import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { QUALITY_THRESHOLDS, type OpportunityQuality } from "@/lib/scanner/constants";
import type { Database } from "@/types/database";

import { upsertOpportunitiesWithMargins } from "./opportunities";

type PersistedRow = {
  id: string;
  marketplace: string;
  external_id: string;
};

function resolveQualityFromMargin(margin: number | null): OpportunityQuality | null {
  if (margin === null) {
    return null;
  }

  if (margin >= QUALITY_THRESHOLDS.exceptional) {
    return "exceptional";
  }

  if (margin >= QUALITY_THRESHOLDS.great) {
    return "great";
  }

  if (margin >= QUALITY_THRESHOLDS.good) {
    return "good";
  }

  return null;
}

function createOpportunitiesSupabaseMock(options: {
  existingRows: PersistedRow[];
  persistedRows: PersistedRow[];
}) {
  const opportunitiesSelectEnd = vi
    .fn()
    .mockResolvedValue({ data: options.existingRows, error: null });
  const opportunitiesSelectSecondIn = vi.fn().mockReturnValue({ in: opportunitiesSelectEnd });
  const opportunitiesSelect = vi.fn().mockReturnValue({ in: opportunitiesSelectSecondIn });

  const opportunitiesUpsertSelect = vi
    .fn()
    .mockResolvedValue({ data: options.persistedRows, error: null });
  const opportunitiesUpsert = vi.fn().mockReturnValue({ select: opportunitiesUpsertSelect });

  const channelMarginsUpsert = vi.fn().mockResolvedValue({ error: null });

  let opportunitiesCall = 0;
  const from = vi.fn((table: string) => {
    if (table === "opportunities") {
      opportunitiesCall += 1;
      if (opportunitiesCall === 1) {
        return { select: opportunitiesSelect };
      }

      return { upsert: opportunitiesUpsert };
    }

    if (table === "channel_margins") {
      return { upsert: channelMarginsUpsert };
    }

    throw new Error(`Unexpected table in mock: ${table}`);
  });

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    from,
    opportunitiesSelect,
    opportunitiesSelectSecondIn,
    opportunitiesSelectEnd,
    opportunitiesUpsert,
    opportunitiesUpsertSelect,
    channelMarginsUpsert,
  };
}

describe("opportunities writer", () => {
  it("inserts a new offer with channel margins", async () => {
    const mock = createOpportunitiesSupabaseMock({
      existingRows: [],
      persistedRows: [
        {
          id: "opp-1",
          marketplace: "Mercado Livre",
          external_id: "MLB123",
        },
      ],
    });

    const result = await upsertOpportunitiesWithMargins(
      mock.supabase,
      [
        {
          productId: "product-1",
          marketplace: "Mercado Livre",
          externalId: "MLB123",
          name: "Produto teste",
          price: 100,
          originalPrice: 150,
          discountPct: 33.33,
          freight: 0,
          freightFree: true,
          category: "ferramentas",
          buyUrl: "https://example.com/produto",
          imageUrl: "https://example.com/image.jpg",
          expiresAt: null,
        },
      ],
      new Map([
        ["Mercado Livre", 15],
        ["Magazine Luiza", 16],
      ]),
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("opp-1");
    expect(result[0]?.isNew).toBe(true);

    const expectedMaxMargin = Math.max(...(result[0]?.channelMargins.map((item) => item.net_margin) ?? [0]));
    const expectedBestChannel = result[0]?.channelMargins.find(
      (item) => item.net_margin === expectedMaxMargin,
    )?.channel;

    expect(result[0]?.marginBest).toBe(expectedMaxMargin);
    expect(result[0]?.marginBestChannel).toBe(expectedBestChannel);
    expect(result[0]?.quality).toBe(resolveQualityFromMargin(expectedMaxMargin));

    expect(mock.opportunitiesUpsert).toHaveBeenCalledTimes(1);
    expect(mock.opportunitiesUpsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          product_id: "product-1",
          marketplace: "Mercado Livre",
          external_id: "MLB123",
          status: "active",
          buy_url: "https://example.com/produto",
          image_url: "https://example.com/image.jpg",
        }),
      ],
      { onConflict: "marketplace,external_id" },
    );

    expect(mock.channelMarginsUpsert).toHaveBeenCalledTimes(1);
    expect(mock.channelMarginsUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          opportunity_id: "opp-1",
          channel: "Mercado Livre",
        }),
        expect.objectContaining({
          opportunity_id: "opp-1",
          channel: "Magazine Luiza",
        }),
      ]),
      { onConflict: "opportunity_id,channel" },
    );
  });

  it("reprocessing same offer updates margins without duplicating opportunity", async () => {
    const mock = createOpportunitiesSupabaseMock({
      existingRows: [
        {
          id: "opp-1",
          marketplace: "Mercado Livre",
          external_id: "MLB123",
        },
      ],
      persistedRows: [
        {
          id: "opp-1",
          marketplace: "Mercado Livre",
          external_id: "MLB123",
        },
      ],
    });

    const result = await upsertOpportunitiesWithMargins(
      mock.supabase,
      [
        {
          productId: "product-1",
          marketplace: "Mercado Livre",
          externalId: "MLB123",
          name: "Produto teste",
          price: 125,
          originalPrice: 150,
          discountPct: 16.67,
          freight: 0,
          freightFree: true,
          category: null,
          buyUrl: "https://example.com/produto",
          imageUrl: null,
          expiresAt: null,
        },
      ],
      new Map([
        ["Mercado Livre", 15],
        ["Magazine Luiza", 16],
      ]),
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("opp-1");
    expect(result[0]?.isNew).toBe(false);

    const expectedMaxMargin = Math.max(...(result[0]?.channelMargins.map((item) => item.net_margin) ?? [0]));
    expect(result[0]?.marginBest).toBe(expectedMaxMargin);
    expect(result[0]?.quality).toBe(resolveQualityFromMargin(expectedMaxMargin));

    expect(mock.opportunitiesUpsert).toHaveBeenCalledTimes(1);
    expect(mock.channelMarginsUpsert).toHaveBeenCalledTimes(1);

    const opportunityPayload = mock.opportunitiesUpsert.mock.calls[0]?.[0] as Array<{
      margin_best: number | null;
      margin_best_channel: string | null;
    }>;

    expect(opportunityPayload).toHaveLength(1);
    expect(opportunityPayload[0]?.margin_best).toBe(expectedMaxMargin);
    expect(opportunityPayload[0]?.margin_best_channel).toBe(result[0]?.marginBestChannel ?? null);
  });
});
