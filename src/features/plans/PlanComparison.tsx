"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AppIcon } from "@/components/AppIcon";
import type { Plan } from "@/lib/plan-limits";

import { usePlanCheckout, type CheckoutPlan } from "./hooks";

type PlanComparisonProps = {
  currentPlan: Plan;
  checkoutStatus?: "success" | "cancelled" | null;
};

type PlanFeature = {
  text: string;
  included: boolean;
  highlight?: boolean;
  warn?: boolean;
};

type PlanConfig = {
  id: Plan;
  name: string;
  price: string;
  period: string;
  subtitle: string;
  accent: string;
  popular?: boolean;
  recommended?: boolean;
  savings?: string;
  features: PlanFeature[];
};

const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: "free",
    name: "FREE",
    price: "0",
    period: "",
    subtitle: "Validação e aquisição",
    accent: "#7B42C9",
    features: [
      { text: "5 termos de interesse", included: true },
      { text: "3 marketplaces", included: true },
      { text: "5 alertas por dia", included: true },
      { text: "Alerta via Telegram + Web", included: true },
      { text: "Scan a cada 2h", included: true, warn: true },
      { text: "Histórico 7 dias", included: true, warn: true },
      { text: "Até 3 vendedores favoritos", included: true },
      { text: "WhatsApp", included: false },
      { text: "Tendências de preços", included: false },
      { text: "Score de oportunidade", included: false },
    ],
  },
  {
    id: "starter",
    name: "STARTER",
    price: "49",
    period: "/mês",
    subtitle: "Para o revendedor ativo",
    accent: "#D4A017",
    recommended: true,
    savings: "Economize até R$ 2.400/mês",
    features: [
      { text: "Até 20 termos de interesse", included: true },
      { text: "Todos os marketplaces", included: true },
      { text: "Alertas ilimitados/dia", included: true },
      { text: "Alerta via WhatsApp + Telegram", included: true },
      { text: "Scan a cada 30 min", included: true, highlight: true },
      { text: "Histórico 30 dias", included: true },
      { text: "Score básico de oportunidade", included: true, highlight: true },
      { text: "Tendências 30 dias", included: true, highlight: true },
      { text: "Até 15 vendedores favoritos", included: true },
      { text: "Sazonalidade e volume", included: false },
    ],
  },
  {
    id: "pro",
    name: "PRO",
    price: "99",
    period: "/mês",
    subtitle: "Comprar com estratégia",
    accent: "#2E8B57",
    popular: true,
    savings: "ROI médio de 12x o valor",
    features: [
      { text: "Termos de interesse ilimitados", included: true, highlight: true },
      { text: "Todos os marketplaces", included: true },
      { text: "WhatsApp + Telegram", included: true },
      { text: "Scan a cada 5 min", included: true, highlight: true },
      { text: "Histórico 90 dias", included: true },
      { text: "Tendências 90 dias", included: true, highlight: true },
      { text: "Sazonalidade detectada", included: true, highlight: true },
      { text: "Score inteligente com IA", included: true, highlight: true },
      { text: "Sugestão de volume de compra", included: true, highlight: true },
      { text: "Vendedores favoritos ilimitados", included: true, highlight: true },
    ],
  },
];

const TESTIMONIALS = [
  { name: "Rafael M.", role: "Revendedor SP", text: "Com o PRO encontrei um PS5 abaixo do custo. Faturei R$ 1.800 em um dia.", plan: "PRO" },
  { name: "Camila S.", role: "Lojista SC", text: "Upgrade pro Starter e já paguei o plano na primeira semana.", plan: "STARTER" },
  { name: "André L.", role: "Revendedor PR", text: "O delay de 2 min me dá vantagem sobre quem ainda usa o FREE.", plan: "PRO" },
];

const TRUST_ITEMS = [
  { icon: "lock" as const, text: "Pagamento seguro" },
  { icon: "check" as const, text: "7 dias de garantia" },
  { icon: "globe" as const, text: "Cartão ou Pix" },
  { icon: "x" as const, text: "Cancele quando quiser" },
];

export function PlanComparison({ currentPlan, checkoutStatus = null }: PlanComparisonProps) {
  const { startCheckout, isPending, error } = usePlanCheckout(currentPlan);

  const urgencyStats = useMemo(() => {
    if (currentPlan === "pro") {
      return [
        { icon: "zap" as const, value: "5 min", label: "Frequência de scan", color: "var(--success)", sub: "O mais rápido disponível" },
        { icon: "eye" as const, value: "∞", label: "Termos monitorados", color: "var(--success)", sub: "Ilimitado no PRO" },
        { icon: "trending-up" as const, value: "90d", label: "Histórico de preços", color: "var(--success)", sub: "Tendências de longo prazo" },
      ];
    }
    if (currentPlan === "starter") {
      return [
        { icon: "clock" as const, value: "30min", label: "Frequência de scan", color: "var(--warning)", sub: "vs 5 min no PRO" },
        { icon: "eye" as const, value: "20", label: "Termos monitorados", color: "var(--warning)", sub: "vs ilimitado no PRO" },
        { icon: "trending-up" as const, value: "30d", label: "Histórico de preços", color: "var(--warning)", sub: "vs 90 dias no PRO" },
      ];
    }
    return [
      { icon: "clock" as const, value: "2h", label: "Frequência de scan", color: "var(--danger)", sub: "vs 5 min no PRO" },
      { icon: "eye" as const, value: "5", label: "Termos monitorados", color: "var(--warning)", sub: "vs 20 no STARTER" },
      { icon: "trending-up" as const, value: "R$ 0", label: "Tendências", color: "var(--text-3)", sub: "Disponível no STARTER+" },
    ];
  }, [currentPlan]);

  return (
    <div>
      {/* Status alerts */}
      {checkoutStatus === "cancelled" && (
        <div style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 12, fontSize: 13,
          color: "var(--warning)",
          background: "color-mix(in srgb, var(--warning) 8%, var(--card))",
          border: "1px solid color-mix(in srgb, var(--warning) 25%, var(--border))",
        }}>
          Checkout cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}
      {checkoutStatus === "success" && (
        <div style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 12, fontSize: 13,
          color: "var(--success)",
          background: "color-mix(in srgb, var(--success) 8%, var(--card))",
          border: "1px solid color-mix(in srgb, var(--success) 25%, var(--border))",
        }}>
          Pagamento concluído. O plano será atualizado após confirmação do webhook.
        </div>
      )}
      {error && (
        <div style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 12, fontSize: 13,
          color: "var(--danger)",
          background: "color-mix(in srgb, var(--danger) 8%, var(--card))",
          border: "1px solid color-mix(in srgb, var(--danger) 25%, var(--border))",
        }} role="alert">
          {error}
        </div>
      )}

      {/* Hero */}
      <div style={{
        textAlign: "center", marginBottom: 32, padding: "32px 20px",
        background: "linear-gradient(145deg, color-mix(in srgb, var(--warning) 6%, var(--card)), color-mix(in srgb, var(--accent-light) 4%, var(--card)))",
        borderRadius: 24, border: "1px solid color-mix(in srgb, var(--warning) 15%, var(--border))",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -60, right: -60, width: 160, height: 160, borderRadius: "50%",
          background: "color-mix(in srgb, var(--warning) 6%, transparent)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -40, width: 120, height: 120, borderRadius: "50%",
          background: "color-mix(in srgb, var(--accent-light) 6%, transparent)", pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--warning)",
            background: "color-mix(in srgb, var(--warning) 10%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--warning) 20%, var(--border))",
            borderRadius: 999, padding: "5px 14px",
          }}>
            <AppIcon name="zap" size={12} stroke="var(--warning)" /> DESBLOQUEIE SEU POTENCIAL
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)",
            marginBottom: 8, lineHeight: 1.2, color: "var(--text-1)",
          }}>
            Pare de perder oportunidades.<br />
            <span style={{ color: "var(--warning)" }}>Evolua seu plano.</span>
          </div>
          <div style={{ fontSize: 14, color: "var(--text-3)", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
            Enquanto você espera, outros revendedores já estão comprando. Um delay menor e mais marketplaces fazem toda a diferença.
          </div>
        </div>
      </div>

      {/* Urgency stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        {urgencyStats.map((s) => (
          <div key={s.label} style={{
            background: "var(--card)", borderRadius: 16, padding: "16px 14px", textAlign: "center",
            border: "1px solid var(--border)", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: s.color, opacity: 0.6,
            }} />
            <AppIcon name={s.icon} size={18} stroke={s.color} />
            <div style={{
              fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)",
              color: s.color, margin: "6px 0 2px", letterSpacing: "-0.02em",
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: "var(--accent-light)", fontWeight: 600 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Social proof */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 20, marginBottom: 28, flexWrap: "wrap",
      }}>
        <div style={{
          fontSize: 12, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 6,
          background: "color-mix(in srgb, var(--success) 10%, var(--card))",
          border: "1px solid color-mix(in srgb, var(--success) 25%, var(--border))",
          borderRadius: 999, padding: "6px 14px",
        }}>
          <AppIcon name="check" size={12} stroke="var(--success)" />
          <strong style={{ color: "var(--success)" }}>347 revendedores</strong>&nbsp;já usam o Avisus
        </div>
        <div style={{
          fontSize: 12, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 6,
          background: "color-mix(in srgb, var(--warning) 10%, var(--card))",
          border: "1px solid color-mix(in srgb, var(--warning) 25%, var(--border))",
          borderRadius: 999, padding: "6px 14px",
        }}>
          <AppIcon name="trending-up" size={12} stroke="var(--warning)" />
          <strong style={{ color: "var(--warning)" }}>82%</strong>&nbsp;migram em 30 dias
        </div>
      </div>

      {/* Plan cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16, alignItems: "start", marginBottom: 36,
      }}>
        {PLAN_CONFIGS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const canCheckout =
            (plan.id === "starter" || plan.id === "pro") &&
            !isCurrent &&
            currentPlan !== "pro";

          return (
            <div
              key={plan.id}
              style={{
                background: plan.popular
                  ? `linear-gradient(165deg, color-mix(in srgb, ${plan.accent} 6%, var(--card)), color-mix(in srgb, var(--warning) 3%, var(--card)))`
                  : isCurrent
                    ? "var(--card)"
                    : `color-mix(in srgb, ${plan.accent} 3%, var(--card))`,
                borderRadius: 20, overflow: "hidden",
                border: plan.popular
                  ? `2px solid ${plan.accent}`
                  : plan.recommended
                    ? `2px solid ${plan.accent}`
                    : "1px solid var(--border)",
                position: "relative", display: "flex", flexDirection: "column",
                transform: plan.popular ? "scale(1.04)" : "scale(1)",
                boxShadow: plan.popular
                  ? `0 12px 40px color-mix(in srgb, ${plan.accent} 22%, transparent), 0 0 0 1px color-mix(in srgb, ${plan.accent} 10%, transparent)`
                  : "var(--card-shadow)",
                zIndex: plan.popular ? 2 : 1,
                opacity: isCurrent ? 0.75 : 1,
              }}
            >
              {plan.popular && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "100%",
                  background: `linear-gradient(180deg, color-mix(in srgb, ${plan.accent} 4%, transparent) 0%, transparent 40%)`,
                  pointerEvents: "none", zIndex: 0,
                }} />
              )}

              {/* Accent bar */}
              <div style={{
                height: plan.popular ? 5 : plan.recommended ? 4 : 3,
                background: plan.popular
                  ? `linear-gradient(90deg, ${plan.accent}, var(--warning))`
                  : plan.accent,
                position: "relative", zIndex: 1,
              }} />

              <div style={{
                padding: "24px 24px 28px", flex: 1,
                display: "flex", flexDirection: "column",
                position: "relative", zIndex: 1,
              }}>
                {/* Plan header */}
                <div style={{ marginBottom: 16 }}>
                  {plan.popular && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10,
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                      color: "#fff", background: plan.accent,
                      padding: "5px 12px", borderRadius: 6,
                      boxShadow: `0 2px 8px color-mix(in srgb, ${plan.accent} 30%, transparent)`,
                    }}>
                      <AppIcon name="star" size={11} stroke="#B7DB47" /> MAIS POPULAR
                    </div>
                  )}
                  {plan.recommended && !plan.popular && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10,
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                      color: plan.accent,
                      background: `color-mix(in srgb, ${plan.accent} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${plan.accent} 25%, transparent)`,
                      padding: "4px 10px", borderRadius: 6,
                    }}>
                      <AppIcon name="arrowUpRight" size={11} stroke={plan.accent} /> RECOMENDADO
                    </div>
                  )}
                  {isCurrent && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", marginBottom: 10,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                      color: "var(--text-3)", background: "var(--margin-block-bg)",
                      border: "1px solid var(--border)",
                      padding: "4px 10px", borderRadius: 6,
                    }}>
                      SEU PLANO ATUAL
                    </div>
                  )}
                  <div style={{
                    fontSize: 14, fontWeight: 800, letterSpacing: "0.08em",
                    color: isCurrent ? "var(--text-3)" : plan.accent,
                  }}>
                    {plan.name}
                  </div>
                </div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 600 }}>R$</span>
                  <span style={{
                    fontSize: 44, fontWeight: 800, fontFamily: "var(--font-mono)",
                    color: isCurrent ? "var(--text-3)" : plan.popular ? plan.accent : "var(--text-1)",
                    lineHeight: 1, letterSpacing: "-0.03em",
                  }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>{plan.period}</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: plan.savings ? 8 : 24 }}>
                  {plan.subtitle}
                </div>

                {plan.savings && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 20,
                    alignSelf: "flex-start",
                    fontSize: 11, fontWeight: 700, color: "var(--success)",
                    background: "color-mix(in srgb, var(--success) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
                    borderRadius: 8, padding: "5px 10px",
                  }}>
                    <AppIcon name="trending-up" size={11} stroke="var(--success)" /> {plan.savings}
                  </div>
                )}

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
                  {plan.features.map((f) => (
                    <div
                      key={f.text}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, fontSize: 13,
                        padding: f.highlight ? "4px 8px" : "0",
                        background: f.highlight
                          ? "color-mix(in srgb, var(--success) 6%, transparent)"
                          : "transparent",
                        borderRadius: f.highlight ? 8 : 0,
                        marginLeft: f.highlight ? -8 : 0,
                        marginRight: f.highlight ? -8 : 0,
                      }}
                    >
                      {f.included ? (
                        <span style={{
                          width: 18, display: "inline-flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {f.warn
                            ? <AppIcon name="alert-triangle" size={13} stroke="var(--warning)" />
                            : <AppIcon name="check" size={14} stroke={isCurrent ? "var(--text-3)" : plan.accent} />
                          }
                        </span>
                      ) : (
                        <span style={{
                          width: 18, display: "inline-flex", alignItems: "center", justifyContent: "center",
                          opacity: 0.4, flexShrink: 0,
                        }}>
                          <AppIcon name="x" size={13} stroke="var(--text-3)" />
                        </span>
                      )}
                      <span style={{
                        color: f.included
                          ? f.warn ? "var(--warning)" : "var(--text-1)"
                          : "var(--text-3)",
                        fontWeight: f.included ? (f.highlight ? 700 : 500) : 400,
                        opacity: f.included ? 1 : 0.45,
                      }}>
                        {f.text}
                        {f.highlight && (
                          <span style={{ fontSize: 9, color: "var(--success)", fontWeight: 800, marginLeft: 4 }}>
                            NEW
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{
                    width: "100%", padding: "13px 0", borderRadius: 12, marginTop: 28, textAlign: "center",
                    border: "1px dashed var(--border)", color: "var(--text-3)", fontSize: 13, fontWeight: 600,
                    boxSizing: "border-box",
                  }}>
                    Seu plano atual
                  </div>
                ) : canCheckout ? (
                  <>
                    <button
                      type="button"
                      onClick={() => startCheckout(plan.id as CheckoutPlan)}
                      disabled={isPending}
                      style={{
                        width: "100%", padding: "14px 0", borderRadius: 14, marginTop: 28, border: "none",
                        background: plan.popular
                          ? `linear-gradient(135deg, ${plan.accent}, color-mix(in srgb, ${plan.accent} 80%, var(--warning)))`
                          : plan.accent,
                        color: "#fff", fontSize: 15, fontWeight: 700,
                        cursor: isPending ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-body)",
                        boxShadow: plan.popular
                          ? `0 6px 24px color-mix(in srgb, ${plan.accent} 35%, transparent)`
                          : `0 4px 16px color-mix(in srgb, ${plan.accent} 20%, transparent)`,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        letterSpacing: "0.02em", opacity: isPending ? 0.7 : 1,
                      }}
                    >
                      {plan.popular
                        ? <><AppIcon name="zap" size={16} stroke="#B7DB47" /> {isPending ? "Redirecionando..." : "Começar agora"}</>
                        : <><AppIcon name="arrowUpRight" size={15} stroke="#fff" /> {isPending ? "Redirecionando..." : "Fazer upgrade"}</>
                      }
                    </button>
                    <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>
                      Cancele a qualquer momento • Sem fidelidade
                    </div>
                  </>
                ) : (
                  <div style={{
                    width: "100%", padding: "13px 0", borderRadius: 12, marginTop: 28, textAlign: "center",
                    border: "1px solid var(--border)",
                    background: "var(--margin-block-bg)", color: "var(--text-3)", fontSize: 13, fontWeight: 600,
                    boxSizing: "border-box",
                  }}>
                    {currentPlan === "pro" ? "Incluído no PRO" : "Não disponível"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Testimonials */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 16, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 14, textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <AppIcon name="message-circle" size={18} stroke="var(--warning)" /> O que dizem nossos clientes
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{
              background: "var(--card)", borderRadius: 16, padding: "18px 16px",
              border: "1px solid var(--border)",
            }}>
              <div style={{
                fontSize: 24, color: "var(--warning)", opacity: 0.3,
                fontFamily: "serif", lineHeight: 1, marginBottom: 4,
              }}>&quot;</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 12, fontStyle: "italic" }}>
                {t.text}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{t.role}</div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 6,
                  background: t.plan === "PRO"
                    ? "color-mix(in srgb, #1B2E63 10%, transparent)"
                    : "color-mix(in srgb, #7B42C9 10%, transparent)",
                  color: t.plan === "PRO" ? "#1B2E63" : "#7B42C9",
                  border: `1px solid ${t.plan === "PRO" ? "color-mix(in srgb, #1B2E63 20%, transparent)" : "color-mix(in srgb, #7B42C9 20%, transparent)"}`,
                }}>
                  {t.plan}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust strip */}
      <div style={{
        background: "var(--card)", borderRadius: 16, padding: "20px 24px",
        border: "1px solid var(--border)", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {TRUST_ITEMS.map((item) => (
            <div key={item.text} style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "var(--text-3)", fontWeight: 500,
            }}>
              <AppIcon name={item.icon} size={14} stroke="var(--accent-light)" /> {item.text}
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5 }}>
        Pagamento processado pelo Stripe Checkout em ambiente seguro. Ao concluir, você retorna ao dashboard e a atualização do plano depende da confirmação do webhook.
      </div>

      <Link href="/dashboard" style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 13, fontWeight: 600, color: "var(--accent-light)", textDecoration: "none",
      }}>
        <AppIcon name="arrow-left" size={14} stroke="var(--accent-light)" /> Voltar para o dashboard
      </Link>
    </div>
  );
}
