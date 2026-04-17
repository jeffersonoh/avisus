"use client";

import { useTransition } from "react";

import { setDevPlan } from "@/features/plans/dev-actions";
import type { Plan } from "@/lib/plan-limits";

const PLANS: Plan[] = ["free", "starter", "pro"];

const PLAN_COLORS: Record<Plan, string> = {
  free: "#7B42C9",
  starter: "#D4A017",
  pro: "#2E8B57",
};

export function DevPlanSwitcher({ currentPlan }: { currentPlan: Plan }) {
  const [isPending, startTransition] = useTransition();

  function switchPlan(plan: Plan) {
    if (plan === currentPlan || isPending) return;
    startTransition(async () => {
      await setDevPlan(plan);
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 88,
        right: 14,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        pointerEvents: isPending ? "none" : "auto",
        opacity: isPending ? 0.7 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "var(--text-3)",
          textTransform: "uppercase",
          paddingRight: 2,
        }}
      >
        {isPending ? "atualizando…" : "⚙ dev · plano"}
      </div>
      <div
        style={{
          display: "flex",
          gap: 5,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "5px 6px",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {PLANS.map((plan) => {
          const active = plan === currentPlan;
          const color = PLAN_COLORS[plan];
          return (
            <button
              key={plan}
              type="button"
              onClick={() => switchPlan(plan)}
              title={`Mudar para ${plan.toUpperCase()}`}
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                border: active ? `1px solid ${color}` : "1px solid transparent",
                background: active
                  ? `color-mix(in srgb, ${color} 14%, var(--card))`
                  : "transparent",
                color: active ? color : "var(--text-3)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.05em",
                cursor: active ? "default" : "pointer",
                fontFamily: "var(--font-mono)",
                transition: "all 0.15s",
              }}
            >
              {plan.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
