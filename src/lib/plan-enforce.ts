import { getPlanLimit, isUnlimited, type Plan, type PlanLimits } from "@/lib/plan-limits";
import { appActionError, type AppActionError } from "@/lib/errors";

type NumericPlanLimitKey = {
  [K in keyof PlanLimits]: PlanLimits[K] extends number ? K : never;
}[keyof PlanLimits];

type EnforcePlanLimitInput = {
  plan: Plan;
  currentCount: number;
  limitKey: NumericPlanLimitKey;
  message?: string;
};

export function enforcePlanLimit(input: EnforcePlanLimitInput): AppActionError | null {
  const maxAllowed = getPlanLimit(input.plan, input.limitKey);
  if (isUnlimited(maxAllowed)) {
    return null;
  }

  if (input.currentCount < maxAllowed) {
    return null;
  }

  return appActionError(
    "LIMIT_REACHED",
    input.message ?? "Voce atingiu o limite de recursos do seu plano.",
  );
}
