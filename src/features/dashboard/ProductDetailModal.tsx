"use client";

import { useEffect, useId, useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import type { AppIconName } from "@/components/AppIcon";

import { discountPercent, formatBrl } from "./format";
import type { ChannelMargin, Opportunity, OpportunityQuality } from "./types";

export type ProductDetailModalProps = {
  opportunity: Opportunity | null;
  open: boolean;
  onClose: () => void;
  bought?: boolean;
  onToggleBought?: (id: number) => void;
  onDismiss?: (id: number) => void;
};

const QUALITY_CONFIG: Record<OpportunityQuality, { label: string; color: string; icon: AppIconName }> = {
  exceptional: { label: "Excepcional", color: "#B7DB47", icon: "flame" },
  great: { label: "Ótima", color: "#1D8F95", icon: "zap" },
  good: { label: "Boa", color: "#7B42C9", icon: "sparkles" },
};

const MARKETPLACE_CONFIG: Record<string, { color: string; logo: string; gradient: string }> = {
  "Mercado Livre": {
    color: "#ffe600",
    logo: "/assets/marketplaces/mercado-livre.svg",
    gradient: "linear-gradient(135deg, #ffe600 0%, #ffcb00 100%)",
  },
  Shopee: {
    color: "#ee4d2d",
    logo: "/assets/marketplaces/shopee.svg",
    gradient: "linear-gradient(135deg, #ee4d2d 0%, #d13a1d 100%)",
  },
  "Magazine Luiza": {
    color: "#0086ff",
    logo: "/assets/marketplaces/magalu.svg",
    gradient: "linear-gradient(135deg, #0086ff 0%, #0060dd 100%)",
  },
};

function getBestChannel(channelMargins: ChannelMargin[]): ChannelMargin | null {
  if (!channelMargins.length) return null;
  return channelMargins.reduce((a, b) => (a.netMargin > b.netMargin ? a : b));
}

function getAcqTotal(opp: Opportunity): number {
  return opp.price + (opp.freightFree ? 0 : opp.freight);
}

export function ProductDetailModal({
  opportunity,
  open,
  onClose,
  bought,
  onToggleBought,
  onDismiss,
}: ProductDetailModalProps) {
  const titleId = useId();
  const [channelExpanded, setChannelExpanded] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !opportunity) return null;

  const opp = opportunity;
  const mp = MARKETPLACE_CONFIG[opp.marketplace];
  const q = QUALITY_CONFIG[opp.quality];
  const discount = discountPercent(opp.price, opp.originalPrice);
  const acqTotal = getAcqTotal(opp);
  const best = getBestChannel(opp.channelMargins);
  const profit = best
    ? Math.round((best.marketPrice * (1 - best.fee) - acqTotal) * 100) / 100
    : opp.originalPrice - acqTotal;
  const economy = opp.originalPrice - opp.price;

  const details: { label: string; value: string; color: string; icon: AppIconName; bold?: boolean }[] = [
    { label: "Preço de compra", value: formatBrl(opp.price), color: "var(--accent-light)", icon: "tag", bold: true },
    {
      label: "Frete de compra",
      value: opp.freightFree ? "Grátis" : formatBrl(opp.freight),
      color: opp.freightFree ? "var(--success)" : "var(--text-2)",
      icon: "truck",
    },
    { label: "Custo de aquisição", value: formatBrl(acqTotal), color: "var(--text-2)", icon: "tag", bold: true },
    { label: "Desconto detectado", value: `-${discount}%`, color: "var(--accent-light)", icon: "percent" },
    {
      label: "Melhor canal de revenda",
      value: best ? `${best.channel} — ${best.netMargin}%` : `${opp.margin}%`,
      color: "var(--success)",
      icon: "trending-up",
      bold: true,
    },
    { label: "Lucro estimado", value: formatBrl(profit), color: "var(--success)", icon: "bar-chart", bold: true },
    { label: "Validade estimada", value: opp.expiresLabel, color: "var(--warning)", icon: "clock" },
    { label: "Região do vendedor", value: `${opp.city}, ${opp.region}`, color: "var(--text-2)", icon: "pin" },
    { label: "Categoria", value: opp.category, color: "var(--text-2)", icon: "grid" },
  ];

  const sortedChannels = [...opp.channelMargins].sort((a, b) => b.netMargin - a.netMargin);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "72px 16px 24px", overflow: "auto",
        animation: "authFadeIn 0.2s ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)", borderRadius: 24, border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
          width: "100%", maxWidth: 520, flexShrink: 0, position: "relative",
          display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 96px)", overflow: "hidden",
        }}
      >
        {/* ── Hero image ── */}
        <div style={{
          position: "relative", height: 200, overflow: "hidden",
          borderRadius: "24px 24px 0 0",
          background: mp?.gradient ?? "linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)",
        }}>
          {opp.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={opp.imageUrl}
              alt={opp.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          {/* bottom fade */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
            background: "linear-gradient(to top, var(--card), transparent)",
            pointerEvents: "none",
          }} />
          {/* close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 10,
              width: 36, height: 36, borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <AppIcon name="x" size={16} stroke="#fff" />
          </button>
          {/* badges top-left */}
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 8,
              background: "var(--glass-strong)", backdropFilter: "blur(8px)",
              fontSize: 11, fontWeight: 700, border: "1px solid var(--border)",
              color: "var(--text-1)",
            }}>
              {mp?.logo && (
                <span style={{
                  width: 16, height: 16, borderRadius: 4, background: "#fff",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mp.logo} alt="" style={{ width: 12, height: 12, objectFit: "contain" }} />
                </span>
              )}
              {opp.marketplace}
            </span>
            {opp.hot && (
              <span style={{
                padding: "4px 10px", borderRadius: 8,
                background: "var(--glass-strong)", backdropFilter: "blur(8px)",
                fontSize: 11, fontWeight: 700, color: "var(--danger)",
              }}>
                HOT
              </span>
            )}
          </div>
          {/* discount badge bottom-left */}
          <div style={{ position: "absolute", bottom: 16, left: 16 }}>
            <span style={{
              padding: "5px 12px", borderRadius: 8,
              background: "var(--accent)", color: "#fff",
              fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)",
            }}>
              -{discount}%
            </span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ padding: "16px 20px 20px", overflowY: "auto", flex: 1 }}>
          {/* Title + badges */}
          <div style={{ marginBottom: 14 }}>
            <h2
              id={titleId}
              style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", margin: "0 0 8px", lineHeight: 1.3 }}
            >
              {opp.name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {q && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: `color-mix(in srgb, ${q.color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${q.color} 25%, var(--border))`,
                  color: q.color,
                }}>
                  <AppIcon name={q.icon} size={10} stroke={q.color} /> {q.label}
                </span>
              )}
              {bought && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: "color-mix(in srgb, var(--success) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--success) 25%, var(--border))",
                  color: "var(--success)",
                }}>
                  <AppIcon name="check" size={10} stroke="var(--success)" /> Comprada
                </span>
              )}
              {opp.freightFree && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: "color-mix(in srgb, var(--info) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--info) 22%, var(--border))",
                  color: "var(--info)",
                }}>
                  <AppIcon name="truck" size={10} stroke="var(--info)" /> Frete grátis
                </span>
              )}
            </div>
          </div>

          {/* Price block */}
          <div style={{
            display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16,
            padding: "14px 16px", borderRadius: 14,
            background: "var(--margin-block-bg)", border: "1px solid var(--border)",
            flexWrap: "wrap",
          }}>
            <span style={{
              fontSize: 28, fontWeight: 800, color: "var(--text-1)",
              fontFamily: "var(--font-mono)", lineHeight: 1,
            }}>
              {formatBrl(opp.price)}
            </span>
            <span style={{
              fontSize: 14, color: "var(--text-3)", textDecoration: "line-through",
              fontFamily: "var(--font-mono)",
            }}>
              {formatBrl(opp.originalPrice)}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--success)", marginLeft: "auto" }}>
              Economia {formatBrl(economy)}
            </span>
          </div>

          {/* Detail rows */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 0,
            marginBottom: 16, borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden",
          }}>
            {details.map((d, i) => (
              <div
                key={d.label}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px",
                  background: i % 2 === 0 ? "var(--margin-block-bg)" : "var(--card)",
                  borderBottom: i < details.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AppIcon name={d.icon} size={14} stroke="var(--text-3)" />
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>{d.label}</span>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: d.bold ? 800 : 700,
                  color: d.color, fontFamily: "var(--font-mono)",
                }}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>

          {/* Collapsible channel margin section */}
          {opp.channelMargins.length > 0 && (
            <div style={{ marginBottom: 16, borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setChannelExpanded((v) => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", background: "var(--margin-block-bg)", border: "none",
                  cursor: "pointer", fontFamily: "var(--font-body)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <AppIcon name="trending-up" size={14} stroke="var(--accent-light)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                    Margem por canal de revenda
                  </span>
                  {best && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "var(--success)",
                      background: "color-mix(in srgb, var(--success) 12%, transparent)",
                      padding: "2px 8px", borderRadius: 6,
                      border: "1px solid color-mix(in srgb, var(--success) 25%, var(--border))",
                    }}>
                      Melhor: {best.netMargin}% via {best.channel}
                    </span>
                  )}
                </div>
                <AppIcon
                  name={channelExpanded ? "chevronUp" : "chevronDown"}
                  size={14}
                  stroke="var(--text-3)"
                />
              </button>

              {channelExpanded && (
                <div style={{ padding: "0 0 4px" }}>
                  {/* Header row */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 90px 52px 80px",
                    padding: "8px 14px 6px", borderTop: "1px solid var(--border)",
                  }}>
                    {["Canal", "Preço médio", "Taxa", "Margem"].map((h) => (
                      <span key={h} style={{
                        fontSize: 10, fontWeight: 700, color: "var(--text-3)",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>
                        {h}
                      </span>
                    ))}
                  </div>
                  {sortedChannels.map((ch, i) => {
                    const isBest = ch.channel === best?.channel;
                    const chMp = MARKETPLACE_CONFIG[ch.channel];
                    return (
                      <div
                        key={ch.channel}
                        style={{
                          display: "grid", gridTemplateColumns: "1fr 90px 52px 80px",
                          padding: "10px 14px",
                          background: isBest
                            ? "color-mix(in srgb, var(--success) 7%, var(--card))"
                            : i % 2 === 0 ? "var(--card)" : "var(--margin-block-bg)",
                          borderTop: "1px solid var(--border)",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {chMp?.logo && (
                            <span style={{
                              width: 16, height: 16, borderRadius: 4, background: "#fff",
                              border: "1px solid var(--border)",
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              overflow: "hidden", flexShrink: 0,
                            }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={chMp.logo} alt={ch.channel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </span>
                          )}
                          <span style={{ fontSize: 12, fontWeight: isBest ? 700 : 500, color: isBest ? "var(--text-1)" : "var(--text-2)" }}>
                            {ch.channel}{isBest ? " ★" : ""}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>
                          {formatBrl(ch.marketPrice)}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                          {Math.round(ch.fee * 100)}%
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 800,
                          color: isBest ? "var(--success)" : "var(--text-2)",
                          fontFamily: "var(--font-mono)",
                        }}>
                          {ch.netMargin}%
                        </span>
                      </div>
                    );
                  })}
                  <div style={{
                    padding: "8px 14px", fontSize: 11, color: "var(--text-3)",
                    borderTop: "1px solid var(--border)",
                    background: "var(--margin-block-bg)", lineHeight: 1.45,
                  }}>
                    Margens com taxas médias estimadas por oportunidade. Ative o cálculo personalizado em Perfil para usar suas próprias taxas.
                  </div>
                </div>
              )}
            </div>
          )}

          <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.45, margin: 0 }}>
            O link abre a página de busca do marketplace com este produto. Compra internacional ficará disponível quando houver AliExpress e similares.
          </p>
        </div>

        {/* ── Sticky CTA bar ── */}
        <div style={{
          position: "sticky", bottom: 0,
          padding: "14px 20px 18px",
          background: "var(--card)", borderTop: "1px solid var(--border)",
          borderRadius: "0 0 24px 24px",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={opp.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: "14px 16px", borderRadius: 14,
                textDecoration: "none", textAlign: "center",
                background: "var(--accent)", color: "#fff",
                fontSize: 15, fontWeight: 700, fontFamily: "var(--font-body)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 38%, transparent)",
              }}
            >
              <AppIcon name="arrowUpRight" size={16} stroke="#fff" />
              Ver no {opp.marketplace}
            </a>
            {onToggleBought && (
              <button
                type="button"
                onClick={() => onToggleBought(opp.id)}
                style={{
                  padding: "14px 18px", borderRadius: 14, cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  border: bought
                    ? "1px solid color-mix(in srgb, var(--success) 45%, var(--border))"
                    : "1px solid var(--border)",
                  background: bought
                    ? "color-mix(in srgb, var(--success) 12%, transparent)"
                    : "var(--margin-block-bg)",
                  color: bought ? "var(--success)" : "var(--text-2)",
                  fontSize: 13, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <AppIcon
                  name={bought ? "check" : "bag"}
                  size={16}
                  stroke={bought ? "var(--success)" : "var(--text-2)"}
                />
                {bought ? "Comprada" : "Comprei"}
              </button>
            )}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={() => { onDismiss(opp.id); onClose(); }}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12,
                cursor: "pointer", fontFamily: "var(--font-body)",
                border: "1px dashed var(--border)", background: "transparent",
                color: "var(--text-3)", fontSize: 12, fontWeight: 600,
              }}
            >
              Não tenho interesse — ocultar desta lista
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
