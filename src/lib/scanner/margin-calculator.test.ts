import { describe, expect, it } from "vitest";

import { QUALITY_THRESHOLDS } from "@/lib/scanner/constants";
import {
  calculateMargin,
  calculateNetMarginPercent,
  resolveOpportunityQuality,
} from "@/lib/scanner/margin-calculator";

describe("margin-calculator", () => {
  it("calculates margin by channel and classifies as great", () => {
    const result = calculateMargin({
      price: 100,
      freight: 0,
      channels: [
        {
          channel: "Mercado Livre",
          market_price: 150,
          fee_pct: 15,
        },
      ],
    });

    expect(result.channels).toEqual([
      {
        channel: "Mercado Livre",
        market_price: 150,
        fee_pct: 15,
        net_margin: 27.5,
      },
    ]);
    expect(result.margin_best).toBe(27.5);
    expect(result.margin_best_channel).toBe("Mercado Livre");
    expect(result.quality).toBe("great");
  });

  it("treats freight as zero when freight_free is true", () => {
    const result = calculateMargin({
      price: 100,
      freight: 40,
      freight_free: true,
      channels: [
        {
          channel: "Mercado Livre",
          market_price: 150,
          fee_pct: 15,
        },
      ],
    });

    expect(result.margin_best).toBe(27.5);
    expect(result.quality).toBe("great");
  });

  it("returns null quality when best margin is negative", () => {
    const result = calculateMargin({
      price: 100,
      freight: 20,
      channels: [
        {
          channel: "Magazine Luiza",
          market_price: 100,
          fee_pct: 16,
        },
      ],
    });

    expect(result.margin_best).toBe(-30);
    expect(result.margin_best_channel).toBe("Magazine Luiza");
    expect(result.quality).toBeNull();
  });

  it("picks the channel with best margin", () => {
    const result = calculateMargin({
      price: 100,
      freight: 0,
      channels: [
        {
          channel: "Mercado Livre",
          market_price: 130,
          fee_pct: 15,
        },
        {
          channel: "Magazine Luiza",
          market_price: 170,
          fee_pct: 16,
        },
      ],
    });

    expect(result.margin_best).toBe(42.8);
    expect(result.margin_best_channel).toBe("Magazine Luiza");
    expect(result.quality).toBe("exceptional");
  });

  it("classifies quality thresholds correctly", () => {
    expect(resolveOpportunityQuality(QUALITY_THRESHOLDS.exceptional)).toBe("exceptional");
    expect(resolveOpportunityQuality(QUALITY_THRESHOLDS.great)).toBe("great");
    expect(resolveOpportunityQuality(QUALITY_THRESHOLDS.good)).toBe("good");
    expect(resolveOpportunityQuality(QUALITY_THRESHOLDS.good - 0.01)).toBeNull();
  });

  it("never divides by zero when acquisition cost is zero", () => {
    expect(
      calculateNetMarginPercent({
        cost: 0,
        marketPrice: 150,
        userFeePct: 15,
      }),
    ).toBe(0);

    const result = calculateMargin({
      price: 0,
      freight: 0,
      channels: [
        {
          channel: "Mercado Livre",
          market_price: 150,
          fee_pct: 15,
        },
      ],
    });

    expect(result.margin_best).toBe(0);
    expect(result.quality).toBeNull();
  });

  it("boundary: 14.99% margin yields null quality (below 'good' threshold of 15)", () => {
    expect(resolveOpportunityQuality(14.99)).toBeNull();
  });

  it("boundary: 15.00% margin yields 'good' (exactly at threshold)", () => {
    expect(resolveOpportunityQuality(15.0)).toBe("good");
  });

  it("boundary: 24.99% margin yields 'good', 25.00% yields 'great'", () => {
    expect(resolveOpportunityQuality(24.99)).toBe("good");
    expect(resolveOpportunityQuality(25.0)).toBe("great");
  });

  it("boundary: 39.99% margin yields 'great', 40.00% yields 'exceptional'", () => {
    expect(resolveOpportunityQuality(39.99)).toBe("great");
    expect(resolveOpportunityQuality(40.0)).toBe("exceptional");
  });
});
