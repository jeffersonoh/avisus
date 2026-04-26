"use client";

import { useState, useTransition } from "react";

import type { Plan } from "@/lib/plan-limits";

import { createCheckoutSession } from "./actions";

export type CheckoutPlan = Exclude<Plan, "free">;

export function usePlanCheckout(currentPlan: Plan) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startCheckout(targetPlan: CheckoutPlan) {
    if (currentPlan === "pro") {
      setError("Seu plano já é o mais completo disponível.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createCheckoutSession(targetPlan);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      window.location.href = result.checkoutUrl;
    });
  }

  return {
    startCheckout,
    isPending,
    error,
    clearError: () => setError(null),
  };
}
