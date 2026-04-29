"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { BottomSheet } from "@/components/BottomSheet";
import type { Plan } from "@/lib/plan-limits";

import { AddSellerForm } from "./AddSellerForm";
import { useFavoriteSellers, type FavoriteSellerActionResult, type FavoriteSellerItem } from "./hooks";

export type FavoriteSellerListProps = {
  plan: Plan;
  initialSellers: FavoriteSellerItem[];
};

const PLAN_LABEL: Record<Plan, string> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
};

const PLATFORM_CONFIG: Record<string, { color: string; label: string }> = {
  shopee: { color: "#EE4D2D", label: "Shopee" },
  tiktok: { color: "#69C9D0", label: "TikTok" },
};

function formatRelativeFromNow(value: string | null): string {
  if (!value) return "Sem live recente";
  const ms = Date.now() - Date.parse(value);
  if (Number.isNaN(ms) || ms < 0) return "Agora";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Há ${days} dia${days > 1 ? "s" : ""}`;
}

export function FavoriteSellerList({ plan, initialSellers }: FavoriteSellerListProps) {
  const {
    sellers,
    maxFavoriteSellers,
    unlimitedPlan,
    limitReached,
    addSeller,
    removeSeller,
  } = useFavoriteSellers({ plan, initialSellers });

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [upgradeSheetOpen, setUpgradeSheetOpen] = useState(false);

  const planLabel = PLAN_LABEL[plan];
  const isPro = plan === "pro";
  const liveSellers = useMemo(() => sellers.filter((s) => s.is_live), [sellers]);

  async function handleAdd(url: string): Promise<FavoriteSellerActionResult> {
    setFeedbackMessage(null);
    const result = await addSeller(url);
    if (!result.ok && result.reason === "limit") {
      setUpgradeSheetOpen(true);
    }
    return result;
  }

  async function handleRemove(id: string): Promise<void> {
    setFeedbackMessage(null);
    setDeletingId(id);
    const result = await removeSeller(id);
    if (!result.ok) {
      setFeedbackMessage(result.message);
    }
    setDeletingId(null);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{
        background: "var(--card)", borderRadius: 20,
        border: "1px solid var(--border)", overflow: "hidden",
        boxShadow: "var(--card-shadow)",
      }}>
        {/* Card header */}
        <div style={{
          background: "color-mix(in srgb, var(--danger) 5%, var(--card))",
          borderBottom: "1px solid var(--border)",
          padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "color-mix(in srgb, var(--danger) 14%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AppIcon name="video" size={18} stroke="var(--danger)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Monitor de lives</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Acompanhe vendedores e criadores quando entrarem ao vivo</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {liveSellers.length > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                color: "var(--danger)", animation: "subtlePulse 2s ease-in-out infinite",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)" }} />
                {liveSellers.length} AO VIVO
              </span>
            )}
            <span style={{
              padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: "var(--margin-block-bg)", border: "1px solid var(--border)",
              color: "var(--text-3)",
            }}>
              {sellers.length}/{unlimitedPlan ? "∞" : maxFavoriteSellers}
            </span>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {/* Add form */}
          <div style={{ marginBottom: 16 }}>
            <AddSellerForm
              disabled={limitReached && !unlimitedPlan}
              onSubmit={handleAdd}
              onLimitReached={() => setUpgradeSheetOpen(true)}
              onSuccess={() => setFeedbackMessage("Vendedor adicionado com sucesso.")}
            />
            {limitReached && !unlimitedPlan && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <AppIcon name="info" size={12} stroke="var(--warning)" />
                <span style={{ fontSize: 12, color: "var(--warning)", fontWeight: 600 }}>
                  Limite de {maxFavoriteSellers} vendedor{maxFavoriteSellers !== 1 ? "es" : ""} no plano {planLabel}.
                </span>
                {plan !== "pro" && (
                  <Link href="/planos" style={{
                    color: "var(--warning)", fontSize: 12, fontWeight: 700, textDecoration: "underline",
                  }}>
                    Fazer upgrade
                  </Link>
                )}
              </div>
            )}
          </div>

          {feedbackMessage && (
            <div style={{
              marginBottom: 12, padding: "8px 12px", borderRadius: 10, fontSize: 12,
              color: "var(--success)",
              background: "color-mix(in srgb, var(--success) 8%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--success) 25%, var(--border))",
            }}>
              {feedbackMessage}
            </div>
          )}

          {/* Sellers list */}
          {sellers.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "28px 16px", borderRadius: 14,
              border: "1px dashed var(--border)",
              background: "color-mix(in srgb, var(--accent) 2%, var(--card))",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
              }}>
                <AppIcon name="video" size={20} stroke="var(--danger)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
                Nenhum perfil monitorado
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, maxWidth: 280, margin: "0 auto" }}>
                Adicione vendedores ou criadores da Shopee e TikTok que fazem lives com promoções. Você será avisado quando começarem uma transmissão.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sellers.map((seller, idx) => {
                const pConfig = PLATFORM_CONFIG[seller.platform] ?? { color: "var(--accent)", label: seller.platform };
                const isDeleting = deletingId === seller.id;
                return (
                  <div
                    key={seller.id}
                    style={{
                      padding: "12px 14px", borderRadius: 14,
                      display: "flex", alignItems: "center", gap: 12,
                      background: seller.is_live
                        ? "color-mix(in srgb, var(--danger) 5%, var(--card))"
                        : "var(--margin-block-bg)",
                      border: seller.is_live
                        ? "1px solid color-mix(in srgb, var(--danger) 25%, var(--border))"
                        : "1px solid var(--border)",
                      animation: `cardIn 0.3s cubic-bezier(.2,.8,.3,1) ${idx * 40}ms both`,
                    }}
                  >
                    {/* Platform icon */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: `color-mix(in srgb, ${pConfig.color} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${pConfig.color} 25%, transparent)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <AppIcon
                          name={seller.platform === "shopee" ? "bag" : "video"}
                          size={18}
                          stroke={pConfig.color}
                        />
                      </div>
                      {seller.is_live && (
                        <span style={{
                          position: "absolute", top: -3, right: -3,
                          width: 12, height: 12, borderRadius: "50%",
                          background: "var(--danger)", border: "2px solid var(--card)",
                          animation: "subtlePulse 1.5s ease-in-out infinite",
                        }} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: "var(--text-1)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {seller.seller_name?.trim() || `@${seller.seller_username}`}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: pConfig.color }}>
                          {pConfig.label}
                        </span>
                        {seller.seller_username && (
                          <>
                            <span style={{ fontSize: 10, color: "var(--text-3)" }}>•</span>
                            <span style={{ fontSize: 10, color: "var(--text-3)" }}>@{seller.seller_username}</span>
                          </>
                        )}
                      </div>
                      {seller.is_live && (
                        <div style={{
                          fontSize: 11, color: "var(--danger)", fontWeight: 600, marginTop: 4,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          Iniciou {formatRelativeFromNow(seller.last_live_at)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {seller.is_live ? (
                        <Link
                          href={seller.seller_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "7px 12px", borderRadius: 8,
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: "var(--danger)", color: "#fff", textDecoration: "none",
                            fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)",
                            animation: "subtlePulse 2s ease-in-out infinite",
                          }}
                        >
                          <AppIcon name="play" size={10} stroke="#fff" />
                          ENTRAR
                        </Link>
                      ) : (
                        <span style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: "color-mix(in srgb, var(--text-3) 8%, transparent)",
                          color: "var(--text-3)",
                        }}>
                          Offline
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleRemove(seller.id)}
                        disabled={isDeleting || Boolean(deletingId)}
                        title="Remover vendedor"
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: "1px solid var(--border)", background: "transparent",
                          cursor: isDeleting || Boolean(deletingId) ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: isDeleting ? 0.5 : 1,
                          flexShrink: 0,
                        }}
                      >
                        <AppIcon name="x" size={12} stroke="var(--text-3)" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Plan hint */}
          <div style={{
            marginTop: 16, padding: "12px 14px", borderRadius: 12,
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "color-mix(in srgb, var(--info) 4%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--info) 15%, var(--border))",
          }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              <AppIcon name="info" size={14} stroke="var(--info)" />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.4 }}>
              {plan === "free" ? (
                <>Plano FREE: até <strong>3</strong> perfis monitorados, alertas de live contam no limite de 5/dia. <strong>Upgrade</strong> para mais perfis e alertas ilimitados.</>
              ) : plan === "starter" ? (
                <>Plano STARTER: até <strong>15</strong> perfis monitorados, alertas de live ilimitados. <strong>PRO</strong> libera perfis ilimitados + métricas de engajamento.</>
              ) : (
                <>Plano PRO: perfis monitorados <strong>ilimitados</strong>, alertas ilimitados + métricas de engajamento (clicou? entrou?).</>
              )}
            </div>
          </div>

          {/* PRO engagement metrics */}
          {isPro && sellers.length > 0 && (
            <div style={{
              marginTop: 12, padding: "12px 14px", borderRadius: 12,
              background: "color-mix(in srgb, #2E8B57 6%, var(--card))",
              border: "1px solid color-mix(in srgb, #2E8B57 20%, var(--border))",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <AppIcon name="eye" size={12} stroke="#2E8B57" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2E8B57" }}>Métricas de engajamento</span>
                <span style={{
                  fontSize: 8, fontWeight: 800, padding: "1px 6px", borderRadius: 4,
                  background: "color-mix(in srgb, #2E8B57 12%, transparent)",
                  border: "1px solid color-mix(in srgb, #2E8B57 30%, transparent)",
                  color: "#2E8B57",
                }}>PRO</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { value: liveSellers.length, label: "Lives ativas", color: "var(--text-1)" },
                  { value: Math.floor(sellers.length * 0.7), label: "Cliques em links", color: "var(--success)" },
                  { value: Math.floor(sellers.length * 0.4), label: "Entradas em live", color: "var(--info)" },
                ].map((m) => (
                  <div key={m.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: "var(--font-mono)" }}>
                      {m.value}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-3)" }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={upgradeSheetOpen}
        onClose={() => setUpgradeSheetOpen(false)}
        title="Limite de perfis monitorados atingido"
        description={`Seu plano ${planLabel} já atingiu o teto de perfis monitorados para lives.`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>
            Faça upgrade para adicionar mais perfis e ampliar seus alertas de live.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              onClick={() => setUpgradeSheetOpen(false)}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border)",
                background: "var(--margin-block-bg)", color: "var(--text-2)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              Agora não
            </button>
            <Link
              href="/planos"
              onClick={() => setUpgradeSheetOpen(false)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "8px 16px", borderRadius: 10,
                background: "var(--accent)", color: "#fff",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}
            >
              Fazer upgrade
              <AppIcon name="arrowUpRight" size={14} stroke="#fff" />
            </Link>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
