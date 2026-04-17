export type OpportunityQuality = "exceptional" | "great" | "good";

export const QUALITY_THRESHOLDS: Record<OpportunityQuality, number> = {
  exceptional: 40,
  great: 25,
  good: 15,
};
