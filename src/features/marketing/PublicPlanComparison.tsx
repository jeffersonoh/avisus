import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";

import { MARKETING_TRUST_ITEMS, PUBLIC_PLAN_CARDS } from "./content";

export function PublicPlanComparison() {
  return (
    <section aria-labelledby="planos-publicos-title" data-marketing-plans-section="true" style={{ display: "grid", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            color: "var(--accent-light)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            marginBottom: 8,
            textTransform: "uppercase" as const,
          }}
        >
          Planos
        </div>
        <h2
          id="planos-publicos-title"
          style={{
            color: "var(--text-1)",
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 800,
            lineHeight: 1.18,
            margin: 0,
          }}
        >
          Escolha como quer monitorar oportunidades
        </h2>
        <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.6, margin: "10px auto 0", maxWidth: 640 }}>
          Compare limites, velocidade de scanner e recursos antes de criar sua conta. O PRO concentra os
          diferenciais para quem precisa agir com mais contexto.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        {PUBLIC_PLAN_CARDS.map((plan) => {
          const isFeatured = Boolean(plan.featured);

          return (
            <article
              key={plan.id}
              aria-label={`Plano ${plan.name}`}
              style={{
                background: isFeatured
                  ? `linear-gradient(165deg, color-mix(in srgb, ${plan.accent} 8%, var(--card)), color-mix(in srgb, var(--accent-light) 4%, var(--card)))`
                  : "var(--card)",
                border: isFeatured ? `2px solid ${plan.accent}` : `1px solid color-mix(in srgb, ${plan.accent} 22%, var(--border))`,
                borderRadius: 24,
                boxShadow: isFeatured
                  ? `0 18px 44px color-mix(in srgb, ${plan.accent} 20%, transparent)`
                  : "var(--card-shadow)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative" as const,
              }}
            >
              <div style={{ background: isFeatured ? `linear-gradient(90deg, ${plan.accent}, var(--accent-light))` : plan.accent, height: 5 }} />

              <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: "24px 22px" }}>
                <div style={{ alignItems: "flex-start", display: "flex", gap: 12, justifyContent: "space-between", marginBottom: 18 }}>
                  <div>
                    <div style={{ color: plan.accent, fontSize: 13, fontWeight: 900, letterSpacing: "0.08em" }}>
                      {plan.name}
                    </div>
                    <div style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.45, marginTop: 6 }}>
                      {plan.subtitle}
                    </div>
                  </div>

                  {isFeatured ? (
                    <div
                      aria-label="Plano recomendado"
                      style={{
                        alignItems: "center",
                        background: `color-mix(in srgb, ${plan.accent} 12%, var(--card))`,
                        border: `1px solid color-mix(in srgb, ${plan.accent} 28%, var(--border))`,
                        borderRadius: 999,
                        color: plan.accent,
                        display: "inline-flex",
                        flexShrink: 0,
                        fontSize: 10,
                        fontWeight: 900,
                        gap: 5,
                        letterSpacing: "0.06em",
                        padding: "6px 10px",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      <AppIcon name="crown" size={12} stroke={plan.accent} />
                      Recomendado
                    </div>
                  ) : null}
                </div>

                <div aria-label={`Preço ${plan.name} ${plan.price}${plan.period}`} style={{ alignItems: "baseline", display: "flex", gap: 4, marginBottom: 18 }}>
                  <span style={{ color: isFeatured ? plan.accent : "var(--text-1)", fontFamily: "var(--font-mono)", fontSize: 38, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {plan.price}
                  </span>
                  <span style={{ color: "var(--text-3)", fontSize: 14, fontWeight: 600 }}>{plan.period}</span>
                </div>

                <ul style={{ display: "grid", gap: 11, listStyle: "none", margin: 0, padding: 0 }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ alignItems: "flex-start", color: "var(--text-2)", display: "flex", fontSize: 13, gap: 9, lineHeight: 1.45 }}>
                      <span
                        style={{
                          alignItems: "center",
                          background: `color-mix(in srgb, ${plan.accent} 10%, transparent)`,
                          borderRadius: 999,
                          display: "inline-flex",
                          flexShrink: 0,
                          height: 20,
                          justifyContent: "center",
                          marginTop: 1,
                          width: 20,
                        }}
                      >
                        <AppIcon name="check" size={12} stroke={plan.accent} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.cta.href}
                  data-marketing-event={plan.cta.event}
                  data-marketing-href={plan.cta.href}
                  data-marketing-plan={plan.id}
                  style={{
                    alignItems: "center",
                    background: isFeatured ? plan.accent : "transparent",
                    border: isFeatured ? "none" : `1px solid color-mix(in srgb, ${plan.accent} 34%, var(--border))`,
                    borderRadius: 14,
                    color: isFeatured ? "#fff" : plan.accent,
                    display: "flex",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 800,
                    gap: 8,
                    justifyContent: "center",
                    marginTop: "auto",
                    padding: "13px 18px",
                    textDecoration: "none",
                  }}
                >
                  {plan.cta.label}
                  <AppIcon name="arrowUpRight" size={14} stroke={isFeatured ? "#fff" : plan.accent} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div
        aria-label="Informações de confiança dos planos"
        className="grid gap-3 md:grid-cols-3"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          boxShadow: "var(--card-shadow)",
          padding: 16,
        }}
      >
        {MARKETING_TRUST_ITEMS.map((item) => (
          <div key={item.title} style={{ alignItems: "flex-start", display: "flex", gap: 10 }}>
            <div
              style={{
                alignItems: "center",
                background: "color-mix(in srgb, var(--accent-light) 10%, transparent)",
                borderRadius: 12,
                display: "flex",
                flexShrink: 0,
                height: 34,
                justifyContent: "center",
                width: 34,
              }}
            >
              <AppIcon name="lock" size={15} stroke="var(--accent-light)" />
            </div>
            <div>
              <div style={{ color: "var(--text-1)", fontSize: 13, fontWeight: 800 }}>{item.title}</div>
              <div style={{ color: "var(--text-3)", fontSize: 12, lineHeight: 1.45, marginTop: 3 }}>{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
