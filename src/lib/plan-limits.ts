/**
 * Fonte unica de verdade para limites de plano do Avisus.
 *
 * Convencao de percentuais:
 * Todo campo terminado em `_pct` representa percentual em escala inteira.
 * Exemplo: 15 significa 15% (e nunca 0.15).
 */

export type Plan = "free" | "starter" | "pro";

export function normalizePlan(value: string | null | undefined): Plan {
  if (value === "free" || value === "starter" || value === "pro") {
    return value;
  }
  return "free";
}

export interface PlanLimits {
  maxInterests: number;
  maxAlertsPerDay: number;
  scanIntervalMin: number;
  historyDays: number;
  maxFavoriteSellers: number;
  liveAlertsUnlimited: boolean;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxInterests: 5,
    maxAlertsPerDay: 5,
    scanIntervalMin: 120,
    historyDays: 7,
    maxFavoriteSellers: 3,
    liveAlertsUnlimited: false,
  },
  starter: {
    maxInterests: 20,
    maxAlertsPerDay: UNLIMITED,
    scanIntervalMin: 30,
    historyDays: 30,
    maxFavoriteSellers: 15,
    liveAlertsUnlimited: true,
  },
  pro: {
    maxInterests: UNLIMITED,
    maxAlertsPerDay: UNLIMITED,
    scanIntervalMin: 5,
    historyDays: 90,
    maxFavoriteSellers: UNLIMITED,
    liveAlertsUnlimited: true,
  },
};

export function getPlanLimit<K extends keyof PlanLimits>(
  plan: Plan,
  key: K,
): PlanLimits[K] {
  return PLAN_LIMITS[plan][key];
}

export function isUnlimited(value: number): boolean {
  return value === UNLIMITED;
}
