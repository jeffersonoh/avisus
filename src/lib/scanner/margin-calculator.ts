export function calculateNetMarginPercent(input: {
  cost: number;
  marketPrice: number;
  userFeePct: number;
}): number {
  const safeCost = input.cost > 0 ? input.cost : 0;
  if (safeCost <= 0) {
    return 0;
  }

  const netRevenue = input.marketPrice * (1 - input.userFeePct / 100);
  const margin = ((netRevenue - safeCost) / safeCost) * 100;

  if (!Number.isFinite(margin)) {
    return 0;
  }

  return Math.round(margin * 100) / 100;
}
