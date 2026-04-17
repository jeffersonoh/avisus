import { describe, expect, it } from "vitest";

import {
  calculateTrigramSimilarity,
  dedupeProductsByExternalKey,
  findSecondaryInterestMatches,
  isInterestEligibleForScan,
} from "@/lib/scanner/opportunity-matcher";

describe("opportunity-matcher helpers", () => {
  it("does not process FREE interests before 120 minutes", () => {
    const now = new Date("2026-04-17T15:00:00.000Z");
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

    expect(isInterestEligibleForScan(thirtyMinutesAgo, "free", now)).toBe(false);
    expect(isInterestEligibleForScan(thirtyMinutesAgo, "pro", now)).toBe(true);
  });

  it("dedupes duplicated opportunities by marketplace and external id", () => {
    const deduped = dedupeProductsByExternalKey([
      {
        marketplace: "Mercado Livre",
        externalId: "MLB123",
        name: "Produto A",
        price: 100,
        originalPrice: 120,
        discountPct: 16.67,
        freight: 0,
        freightFree: true,
        unitsSold: null,
        category: null,
        buyUrl: "https://example.com/a",
        imageUrl: null,
      },
      {
        marketplace: "Mercado Livre",
        externalId: "mlb123",
        name: "Produto A (duplicado)",
        price: 98,
        originalPrice: 120,
        discountPct: 18.33,
        freight: 0,
        freightFree: true,
        unitsSold: null,
        category: null,
        buyUrl: "https://example.com/a2",
        imageUrl: null,
      },
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.externalId).toBe("MLB123");
  });

  it("matches similar terms using trigram threshold >= 0.3", () => {
    const opportunityName = "Samsung Galaxy S23 256GB";

    const similarity = calculateTrigramSimilarity(opportunityName, "Samsumg S23 256GB");
    expect(similarity).toBeGreaterThanOrEqual(0.3);

    const matches = findSecondaryInterestMatches({
      opportunityName,
      interests: [
        {
          id: "interest-1",
          user_id: "user-1",
          term: "Samsumg S23 256GB",
          last_scanned_at: null,
        },
        {
          id: "interest-2",
          user_id: "user-2",
          term: "Liquidificador 220v",
          last_scanned_at: null,
        },
      ],
      threshold: 0.3,
    });

    expect(matches.map((match) => match.id)).toEqual(["interest-1"]);
  });
});
