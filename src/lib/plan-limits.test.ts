import { describe, expect, it } from "vitest";

import { getPlanLimit, isUnlimited, normalizePlan, PLAN_LIMITS } from "./plan-limits";

describe("plan-limits", () => {
  describe("normalizePlan", () => {
    it("returns 'free' for null", () => {
      expect(normalizePlan(null)).toBe("free");
    });

    it("returns 'free' for undefined", () => {
      expect(normalizePlan(undefined)).toBe("free");
    });

    it("returns 'free' for unknown string", () => {
      expect(normalizePlan("enterprise")).toBe("free");
    });

    it("passes through valid plan values", () => {
      expect(normalizePlan("free")).toBe("free");
      expect(normalizePlan("starter")).toBe("starter");
      expect(normalizePlan("pro")).toBe("pro");
    });
  });

  describe("getPlanLimit", () => {
    it("returns correct maxInterests per plan", () => {
      expect(getPlanLimit("free", "maxInterests")).toBe(5);
      expect(getPlanLimit("starter", "maxInterests")).toBe(20);
      expect(getPlanLimit("pro", "maxInterests")).toBe(Number.POSITIVE_INFINITY);
    });

    it("returns correct scanIntervalMin per plan", () => {
      expect(getPlanLimit("free", "scanIntervalMin")).toBe(120);
      expect(getPlanLimit("starter", "scanIntervalMin")).toBe(30);
      expect(getPlanLimit("pro", "scanIntervalMin")).toBe(5);
    });

    it("returns correct maxAlertsPerDay per plan", () => {
      expect(getPlanLimit("free", "maxAlertsPerDay")).toBe(5);
      expect(getPlanLimit("starter", "maxAlertsPerDay")).toBe(Number.POSITIVE_INFINITY);
      expect(getPlanLimit("pro", "maxAlertsPerDay")).toBe(Number.POSITIVE_INFINITY);
    });

    it("liveAlertsUnlimited is false for free and true for paid plans", () => {
      expect(getPlanLimit("free", "liveAlertsUnlimited")).toBe(false);
      expect(getPlanLimit("starter", "liveAlertsUnlimited")).toBe(true);
      expect(getPlanLimit("pro", "liveAlertsUnlimited")).toBe(true);
    });
  });

  describe("isUnlimited", () => {
    it("returns true for Infinity", () => {
      expect(isUnlimited(Number.POSITIVE_INFINITY)).toBe(true);
    });

    it("returns false for finite numbers", () => {
      expect(isUnlimited(5)).toBe(false);
      expect(isUnlimited(0)).toBe(false);
    });
  });

  it("all plans have consistent non-negative finite or Infinity values", () => {
    for (const plan of ["free", "starter", "pro"] as const) {
      const limits = PLAN_LIMITS[plan];
      expect(limits.maxInterests).toBeGreaterThanOrEqual(0);
      expect(limits.maxAlertsPerDay).toBeGreaterThanOrEqual(0);
      expect(limits.scanIntervalMin).toBeGreaterThan(0);
      expect(limits.historyDays).toBeGreaterThan(0);
      expect(limits.maxFavoriteSellers).toBeGreaterThanOrEqual(0);
    }
  });
});
