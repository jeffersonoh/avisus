"use client";

import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import { Badge } from "@/components/Badge";
import { PLAN_LIMITS, isUnlimited, type Plan } from "@/lib/plan-limits";

import { usePlanCheckout, type CheckoutPlan } from "./hooks";

type PlanComparisonProps = {
  currentPlan: Plan;
  checkoutStatus?: "success" | "cancelled" | null;
};

type PlanCardConfig = {
  id: Plan;
  title: string;
  subtitle: string;
  priceLabel: string;
  highlight: boolean;
};

const PLAN_CARDS: PlanCardConfig[] = [
  {
    id: "free",
    title: "FREE",
    subtitle: "Entrada para validar oportunidades",
    priceLabel: "R$ 0/mês",
    highlight: false,
  },
  {
    id: "starter",
    title: "STARTER",
    subtitle: "Para operação ativa com mais frequência",
    priceLabel: "R$ 49/mês",
    highlight: true,
  },
  {
    id: "pro",
    title: "PRO",
    subtitle: "Máxima cobertura para revenda profissional",
    priceLabel: "R$ 99/mês",
    highlight: false,
  },
];

function formatLimit(value: number): string {
  return isUnlimited(value) ? "Ilimitado" : String(value);
}

function checkoutButtonLabel(currentPlan: Plan, targetPlan: Plan): string {
  if (currentPlan === targetPlan) {
    return "Plano atual";
  }

  if (currentPlan === "pro") {
    return "Incluído no PRO";
  }

  return "Fazer upgrade";
}

export function PlanComparison({ currentPlan, checkoutStatus = null }: PlanComparisonProps) {
  const { startCheckout, isPending, error } = usePlanCheckout(currentPlan);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">Planos</p>
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Escolha seu plano Avisus</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-2">
          Compare limites e funcionalidades para decidir o nível ideal de monitoramento.
        </p>
      </header>

      {checkoutStatus === "cancelled" ? (
        <p className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm text-warning">
          Checkout cancelado. Você pode tentar novamente quando quiser.
        </p>
      ) : null}

      {checkoutStatus === "success" ? (
        <p className="rounded-xl border border-success/35 bg-success/10 px-4 py-3 text-sm text-success">
          Pagamento concluído. O plano será atualizado após confirmação do webhook.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLAN_CARDS.map((planCard) => {
          const limits = PLAN_LIMITS[planCard.id];
          const isCurrent = currentPlan === planCard.id;
          const canCheckout =
            (planCard.id === "starter" || planCard.id === "pro") &&
            !isCurrent &&
            !(currentPlan === "pro");

          return (
            <article
              key={planCard.id}
              className={`rounded-2xl border bg-card p-5 shadow-sm ${
                planCard.highlight ? "border-accent/40" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-text-2">{planCard.title}</p>
                  <p className="mt-1 text-xs text-text-3">{planCard.subtitle}</p>
                </div>
                {isCurrent ? (
                  <Badge variant="success" size="sm">
                    <AppIcon name="check" size={12} className="shrink-0" />
                    Ativo
                  </Badge>
                ) : null}
              </div>

              <p className="mt-4 text-2xl font-bold text-accent-dark">{planCard.priceLabel}</p>

              <ul className="mt-4 space-y-1.5 text-sm text-text-2">
                <li>Interesses: {formatLimit(limits.maxInterests)}</li>
                <li>Alertas/dia: {formatLimit(limits.maxAlertsPerDay)}</li>
                <li>Scan: a cada {limits.scanIntervalMin} min</li>
                <li>Histórico: {limits.historyDays} dias</li>
                <li>Vendedores favoritos: {formatLimit(limits.maxFavoriteSellers)}</li>
              </ul>

              {canCheckout ? (
                <button
                  type="button"
                  onClick={() => startCheckout(planCard.id as CheckoutPlan)}
                  disabled={isPending}
                  className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Redirecionando..." : checkoutButtonLabel(currentPlan, planCard.id)}
                </button>
              ) : (
                <div className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-text-2">
                  {checkoutButtonLabel(currentPlan, planCard.id)}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="text-xs text-text-3">
        Pagamento processado pelo Stripe Checkout em ambiente seguro. Ao concluir, você retorna ao
        dashboard e a atualização do plano depende da confirmação do webhook.
      </p>

      <Link href="/dashboard" className="inline-flex text-sm font-semibold text-accent-light underline-offset-2 hover:underline">
        Voltar para o dashboard
      </Link>
    </section>
  );
}
