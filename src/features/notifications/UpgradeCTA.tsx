import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import type { Plan } from "@/lib/plan-limits";

type UpgradeCTAProps = {
  plan: Plan;
  alertsSentToday: number;
  dailyLimit?: number;
};

const DEFAULT_DAILY_LIMIT = 5;

export function UpgradeCTA({
  plan,
  alertsSentToday,
  dailyLimit = DEFAULT_DAILY_LIMIT,
}: UpgradeCTAProps) {
  if (plan !== "free" || alertsSentToday < dailyLimit) {
    return null;
  }

  return (
    <section
      aria-label="Limite diario de alertas atingido"
      style={{
        borderRadius: 18,
        padding: "16px 18px",
        border: "1px solid color-mix(in srgb, var(--warning) 32%, var(--border))",
        background:
          "linear-gradient(135deg, color-mix(in srgb, #ffb020 18%, var(--card)) 0%, color-mix(in srgb, #f97316 16%, var(--card)) 100%)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "color-mix(in srgb, #ffb020 16%, transparent)",
              border: "1px solid color-mix(in srgb, #ffb020 34%, transparent)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AppIcon name="zap" size={16} stroke="var(--warning)" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>
              Voce atingiu o limite diario do plano FREE
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, lineHeight: 1.45 }}>
              Foram {alertsSentToday} alertas hoje. Faça upgrade para liberar notificacoes ilimitadas.
            </div>
          </div>
        </div>

        <Link
          href="/planos"
          aria-label="Fazer upgrade para receber alertas ilimitados"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: 10,
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 800,
            color: "#fff",
            background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
            border: "1px solid color-mix(in srgb, #ef4444 42%, transparent)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Upgrade
          <AppIcon name="arrowUpRight" size={14} stroke="#fff" />
        </Link>
      </div>
    </section>
  );
}
