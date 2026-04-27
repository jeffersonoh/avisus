import { describe, expect, it } from "vitest";

import {
  calculateTrigramSimilarity,
  dedupeProductsByExternalKey,
  filterLikelyNewProducts,
  findSecondaryInterestMatches,
  isInterestEligibleForScan,
  resolveMinDiscountPct,
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

  it("filters used, refurbished and open-box products before persistence", () => {
    const products = filterLikelyNewProducts([
      {
        marketplace: "Mercado Livre",
        externalId: "new-tv",
        name: "Smart TV 50 Polegadas 4K WiFi",
        price: 2000,
        originalPrice: 2500,
        discountPct: 20,
        freight: 0,
        freightFree: true,
        unitsSold: null,
        category: null,
        buyUrl: "https://example.com/smart-tv-nova",
        imageUrl: null,
      },
      {
        marketplace: "Mercado Livre",
        externalId: "refurb-watch",
        name: "Apple Watch Ultra 2 Excelente Recondicionado",
        price: 3000,
        originalPrice: 4000,
        discountPct: 25,
        freight: 0,
        freightFree: true,
        unitsSold: null,
        category: null,
        buyUrl: "https://example.com/apple-watch-recondicionado",
        imageUrl: null,
      },
      {
        marketplace: "Magazine Luiza",
        externalId: "used-phone",
        name: "iPhone 15 Pro Seminovo 256GB",
        price: 4500,
        originalPrice: 6000,
        discountPct: 25,
        freight: 0,
        freightFree: false,
        unitsSold: null,
        category: null,
        buyUrl: "https://example.com/iphone-seminovo",
        imageUrl: null,
      },
      {
        marketplace: "Magazine Luiza",
        externalId: "open-box-notebook",
        name: "Notebook Gamer Open Box",
        price: 5000,
        originalPrice: 7000,
        discountPct: 28.57,
        freight: 0,
        freightFree: false,
        unitsSold: null,
        category: null,
        buyUrl: "https://example.com/notebook-open-box",
        imageUrl: null,
      },
    ]);

    expect(products.map((product) => product.externalId)).toEqual(["new-tv"]);
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

  describe("resolveMinDiscountPct", () => {
    it("returns 15 when value is null (default fallback)", () => {
      expect(resolveMinDiscountPct(null)).toBe(15);
    });

    it("returns 15 when value is negative", () => {
      expect(resolveMinDiscountPct(-5)).toBe(15);
    });

    it("returns configured value when set to 25", () => {
      expect(resolveMinDiscountPct(25)).toBe(25);
    });

    it("returns 0 as a valid threshold (no discount filter)", () => {
      expect(resolveMinDiscountPct(0)).toBe(0);
    });

    it("offer at exactly the threshold passes (>= boundary)", () => {
      const threshold = resolveMinDiscountPct(20);
      expect(20 >= threshold).toBe(true);
    });

    it("offer below threshold is filtered out", () => {
      const threshold = resolveMinDiscountPct(25);
      expect(20 >= threshold).toBe(false);
    });
  });
});
