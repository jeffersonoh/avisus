import type { DashboardFilters } from "./search-params";
import { discountPercent } from "./format";
import type { Opportunity } from "./types";

function bestNetMargin(opp: Opportunity): number {
  const fromChannels = opp.channelMargins.map((c) => c.netMargin);
  return Math.max(opp.margin, ...fromChannels);
}

function matchesDiscount(opp: Opportunity, discount: DashboardFilters["discount"]): boolean {
  if (discount === "all") return true;
  const d = discountPercent(opp.price, opp.originalPrice);
  if (discount === "d15") return d >= 15;
  if (discount === "d30") return d >= 30;
  return d >= 45;
}

function matchesMargin(opp: Opportunity, margin: DashboardFilters["margin"]): boolean {
  if (margin === "all") return true;
  const m = bestNetMargin(opp);
  if (margin === "m20") return m >= 20;
  if (margin === "m30") return m >= 30;
  return m >= 40;
}

export function filterOpportunities(opportunities: Opportunity[], filters: DashboardFilters): Opportunity[] {
  return opportunities.filter((opp) => {
    if (filters.marketplace !== "all" && opp.marketplace !== filters.marketplace) {
      return false;
    }
    if (filters.category !== "all" && opp.category !== filters.category) {
      return false;
    }
    if (!matchesDiscount(opp, filters.discount)) {
      return false;
    }
    if (!matchesMargin(opp, filters.margin)) {
      return false;
    }
    if (filters.region !== "all" && opp.region !== filters.region) {
      return false;
    }
    return true;
  });
}

export function sortOpportunities(opportunities: Opportunity[], sort: DashboardFilters["sort"]): Opportunity[] {
  const list = [...opportunities];
  if (sort === "margin") {
    list.sort((a, b) => bestNetMargin(b) - bestNetMargin(a));
  } else if (sort === "discount") {
    list.sort(
      (a, b) =>
        discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice),
    );
  } else {
    list.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }
  return list;
}

export function filterAndSortOpportunities(
  opportunities: Opportunity[],
  filters: DashboardFilters,
): Opportunity[] {
  return sortOpportunities(filterOpportunities(opportunities, filters), filters.sort);
}
