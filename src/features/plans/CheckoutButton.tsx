"use client";

import { AppIcon } from "@/components/AppIcon";
import type { Plan } from "@/lib/plan-limits";

import { usePlanCheckout, type CheckoutPlan } from "./hooks";

type CheckoutButtonProps = {
  currentPlan: Plan;
  targetPlan: CheckoutPlan;
  accent: string;
  popular?: boolean;
};

export function CheckoutButton({ currentPlan, targetPlan, accent, popular = false }: CheckoutButtonProps) {
  const { startCheckout, isPending, error } = usePlanCheckout(currentPlan);

  return (
    <>
      <button
        type="button"
        onClick={() => startCheckout(targetPlan)}
        disabled={isPending}
        style={{
          width: "100%",
          padding: "14px 0",
          borderRadius: 14,
          marginTop: 28,
          border: "none",
          background: popular
            ? `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 80%, var(--warning)))`
            : accent,
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: isPending ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body)",
          boxShadow: popular
            ? `0 6px 24px color-mix(in srgb, ${accent} 35%, transparent)`
            : `0 4px 16px color-mix(in srgb, ${accent} 20%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          letterSpacing: "0.02em",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {popular ? (
          <>
            <AppIcon name="zap" size={16} stroke="#B7DB47" />{" "}
            {isPending ? "Redirecionando..." : "Começar agora"}
          </>
        ) : (
          <>
            <AppIcon name="arrowUpRight" size={15} stroke="#fff" />{" "}
            {isPending ? "Redirecionando..." : "Fazer upgrade"}
          </>
        )}
      </button>
      <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>
        Cancele a qualquer momento • Sem fidelidade
      </div>
      {error && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 12,
            color: "var(--danger)",
            background: "color-mix(in srgb, var(--danger) 8%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--danger) 25%, var(--border))",
          }}
          role="alert"
        >
          {error}
        </div>
      )}
    </>
  );
}
