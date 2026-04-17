"use client";

import Link from "next/link";
import { useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import type { AppIconName } from "@/components/AppIcon";
import { BottomSheet } from "@/components/BottomSheet";
import type { Plan } from "@/lib/plan-limits";

import { InterestForm } from "./InterestForm";
import {
  useInterests,
  type InterestActionResult,
  type InterestItem,
} from "./hooks";

export type InterestListProps = {
  plan: Plan;
  initialInterests: InterestItem[];
};

const PLAN_LABEL: Record<Plan, string> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
};

type CategorySuggestion = {
  category: string;
  icon: AppIconName;
  color: string;
  terms: string[];
};

const CATEGORY_SUGGESTIONS: CategorySuggestion[] = [
  { category: "Ferramentas", icon: "zap", color: "var(--warning)", terms: ["Parafusadeira", "Furadeira", "Kit Chaves"] },
  { category: "Games", icon: "monitor", color: "#8B5CF6", terms: ["PlayStation 5", "Controle Xbox", "Nintendo Switch"] },
  { category: "Eletrônicos", icon: "sparkles", color: "var(--info)", terms: ["Fone JBL", "Echo Dot", "Caixa Bluetooth"] },
  { category: "Calçados", icon: "bag", color: "var(--success)", terms: ["Tênis Nike", "Air Max", "Adidas"] },
  { category: "Casa & Cozinha", icon: "store", color: "#EC4899", terms: ["Air Fryer", "Aspirador Robô", "Smart TV"] },
  { category: "Apple", icon: "star", color: "var(--text-2)", terms: ["iPhone", "AirPods", "Apple Watch"] },
];

export function InterestList({ plan, initialInterests }: InterestListProps) {
  const {
    interests,
    maxInterests,
    unlimitedPlan,
    limitReached,
    remainingSlots,
    createInterest,
    updateInterest,
    deleteInterest,
  } = useInterests({ plan, initialInterests });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [upgradeSheetOpen, setUpgradeSheetOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const planLabel = PLAN_LABEL[plan];
  const usedCount = interests.length;
  const maxFree = unlimitedPlan ? Infinity : (maxInterests as number);
  const progressPct = unlimitedPlan ? 0 : Math.min(100, (usedCount / (maxInterests as number)) * 100);

  async function handleCreate(term: string): Promise<InterestActionResult> {
    setFeedbackMessage(null);
    const result = await createInterest(term);
    if (!result.ok && result.reason === "limit") setUpgradeSheetOpen(true);
    return result;
  }

  async function handleUpdate(id: string, term: string): Promise<InterestActionResult> {
    setFeedbackMessage(null);
    const result = await updateInterest(id, term);
    if (result.ok) {
      setEditingId(null);
      setFeedbackMessage("Interesse atualizado com sucesso.");
    }
    return result;
  }

  async function handleDelete(id: string): Promise<void> {
    setFeedbackMessage(null);
    setDeletingId(id);
    const result = await deleteInterest(id);
    if (!result.ok) {
      setFeedbackMessage(result.message);
      setDeletingId(null);
      return;
    }
    if (editingId === id) setEditingId(null);
    setDeletingId(null);
  }

  async function handleSuggestion(term: string): Promise<void> {
    setFeedbackMessage(null);
    const result = await createInterest(term);
    if (!result.ok) {
      if (result.reason === "limit") setUpgradeSheetOpen(true);
      else setFeedbackMessage(result.message);
      return;
    }
    setFeedbackMessage(`"${term}" foi adicionado à sua lista.`);
  }

  function isAlreadyAdded(term: string): boolean {
    return interests.some((i) => i.term.toLowerCase() === term.toLowerCase());
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* ── Main card ── */}
      <div style={{
        background: "var(--card)", borderRadius: 20, padding: 20,
        border: "1px solid var(--border)", boxShadow: "var(--card-shadow)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Seus interesses</div>
            <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
              O scanner prioriza ofertas para esses termos. Termos genéricos como <strong>Ferramentas</strong> também buscam por categoria.
            </div>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px",
            borderRadius: 8, fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--border))",
            color: "var(--accent-dark)", whiteSpace: "nowrap",
          }}>
            <AppIcon name="crown" size={11} stroke="var(--accent)" />
            Plano {planLabel}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AppIcon name="tag" size={12} stroke="var(--text-3)" />
              {unlimitedPlan ? `${usedCount} termos ativos` : `${usedCount}/${maxInterests} termos usados`}
            </span>
            <span>
              {limitReached
                ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>Limite atingido</span>
                : unlimitedPlan
                  ? <span style={{ color: "var(--success)", fontWeight: 600 }}>Ilimitado</span>
                  : <>{remainingSlots} vagas livres</>
              }
            </span>
          </div>
          {!unlimitedPlan && (
            <div style={{ height: 6, background: "var(--margin-bar-bg)", borderRadius: 999 }}>
              <div style={{
                height: "100%", borderRadius: 999,
                width: `${progressPct}%`,
                background: limitReached ? "var(--danger)" : "var(--accent)",
                transition: "width 0.3s",
              }} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{
          background: "var(--margin-block-bg)", border: "1px solid var(--border)",
          borderRadius: 14, padding: 12, marginBottom: 16,
        }}>
          <InterestForm
            mode="create"
            submitLabel="Adicionar"
            placeholder="Ex: Parafusadeira, PlayStation 5, Ferramentas..."
            onSubmit={handleCreate}
            onLimitReached={() => setUpgradeSheetOpen(true)}
          />
          {limitReached && !unlimitedPlan && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              Limite do plano {planLabel} atingido.{" "}
              <Link href="/planos" style={{ color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
                <AppIcon name="arrowUpRight" size={12} stroke="var(--accent)" /> Upgrade
              </Link>
            </div>
          )}
        </div>

        {/* Category suggestions */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            Explorar por categoria
          </div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {CATEGORY_SUGGESTIONS.map((cat) => {
              const isExpanded = expandedCategory === cat.category;
              return (
                <div key={cat.category}>
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                      border: isExpanded
                        ? `1px solid color-mix(in srgb, ${cat.color} 40%, var(--border))`
                        : "1px solid var(--border)",
                      background: isExpanded
                        ? `color-mix(in srgb, ${cat.color} 8%, var(--card))`
                        : "var(--margin-block-bg)",
                      fontFamily: "var(--font-body)", textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: `color-mix(in srgb, ${cat.color} 14%, transparent)`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <AppIcon name={cat.icon} size={13} stroke={cat.color} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{cat.category}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {cat.terms.length} sugestões
                    </div>
                  </button>
                  {isExpanded && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 4px 0" }}>
                      {cat.terms.map((term) => {
                        const added = isAlreadyAdded(term);
                        return (
                          <button
                            key={term}
                            type="button"
                            onClick={() => !added && void handleSuggestion(term)}
                            disabled={added || limitReached}
                            style={{
                              padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                              cursor: added || limitReached ? "default" : "pointer",
                              border: added ? "1px solid var(--accent)" : "1px solid var(--border)",
                              background: added
                                ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                                : "var(--margin-block-bg)",
                              color: added ? "var(--accent)" : "var(--text-2)",
                              fontFamily: "var(--font-body)",
                              opacity: !added && limitReached ? 0.4 : 1,
                              display: "inline-flex", alignItems: "center", gap: 4,
                              transition: "all 0.15s",
                            }}
                          >
                            <AppIcon
                              name={added ? "check" : "plus"}
                              size={11}
                              stroke={added ? "var(--accent)" : "var(--text-3)"}
                            />
                            {term}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Interest list */}
        <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Seus termos monitorados
        </div>

        {feedbackMessage && (
          <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 10, background: "color-mix(in srgb, var(--success) 8%, var(--card))", border: "1px solid color-mix(in srgb, var(--success) 22%, var(--border))", fontSize: 12, color: "var(--text-2)" }}>
            {feedbackMessage}
          </div>
        )}

        {interests.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "28px 16px", borderRadius: 16,
            border: "1px dashed var(--border)",
            background: "color-mix(in srgb, var(--accent) 3%, var(--card))",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
            }}>
              <AppIcon name="star" size={22} stroke="var(--accent)" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
              Comece a monitorar oportunidades
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, maxWidth: 320, margin: "0 auto 16px" }}>
              Adicione um termo acima ou use uma das sugestões de categoria para receber alertas alinhados ao seu nicho.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {interests.map((item, index) => {
              const isEditing = editingId === item.id;
              const isDeleting = deletingId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border)",
                    background: "var(--card)",
                    boxShadow: "none",
                    transition: "box-shadow 0.18s ease",
                    animation: `cardIn 0.35s cubic-bezier(.2,.8,.3,1) ${index * 55}ms both`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--card-shadow)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  {isEditing ? (
                    <InterestForm
                      mode="edit"
                      defaultValue={item.term}
                      submitLabel="Salvar"
                      onSubmit={(term) => handleUpdate(item.id, term)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                            background: "color-mix(in srgb, var(--accent) 10%, var(--margin-block-bg))",
                            border: "1px solid var(--border)",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <AppIcon name="tag" size={14} stroke="var(--accent-dark)" />
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.term}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                              Monitorando
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => setEditingId(item.id)}
                            disabled={Boolean(deletingId)}
                            style={{
                              height: 28, padding: "0 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                              border: "1px solid var(--border)", background: "transparent",
                              color: "var(--text-2)", cursor: "pointer",
                              display: "inline-flex", alignItems: "center", gap: 4,
                              opacity: deletingId ? 0.5 : 1,
                            }}
                          >
                            <AppIcon name="sliders" size={12} stroke="var(--text-3)" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            disabled={isDeleting || Boolean(deletingId)}
                            style={{
                              width: 28, height: 28, borderRadius: 8,
                              border: "1px solid var(--border)", background: "transparent",
                              color: "var(--text-3)", cursor: "pointer",
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              opacity: isDeleting || deletingId ? 0.5 : 1,
                            }}
                          >
                            {isDeleting
                              ? <AppIcon name="clock" size={14} stroke="var(--text-3)" />
                              : <AppIcon name="x" size={14} stroke="var(--text-3)" />
                            }
                          </button>
                        </div>
                      </div>
                      {item.last_scanned_at && (
                        <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                          <AppIcon name="clock" size={10} stroke="var(--text-3)" />
                          Último scan: {new Date(item.last_scanned_at).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgrade bottom sheet */}
      <BottomSheet
        isOpen={upgradeSheetOpen}
        onClose={() => setUpgradeSheetOpen(false)}
        title="Limite de interesses atingido"
        description={`Seu plano ${planLabel} já atingiu o teto de ${unlimitedPlan ? "" : maxInterests} termos ativos.`}
      >
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            Para cadastrar novos termos, faça upgrade e libere mais capacidade de monitoramento.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setUpgradeSheetOpen(false)}
              className="rounded-xl border border-border bg-bg px-4 py-2 text-sm font-medium text-text-2 transition hover:border-accent-light hover:text-text-1"
            >
              Agora não
            </button>
            <Link
              href="/planos"
              onClick={() => setUpgradeSheetOpen(false)}
              className="inline-flex items-center gap-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
            >
              Fazer upgrade
              <AppIcon name="arrowUpRight" size={14} className="text-white" />
            </Link>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
