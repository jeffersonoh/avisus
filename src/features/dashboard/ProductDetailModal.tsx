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
  onToggleBought?: (id: string) => void;
  onDismiss?: (id: string) => void;
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
  const [compactViewport, setCompactViewport] = useState(false);

  useEffect(() => {
    const updateViewport = () => setCompactViewport(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    const prevBodyOverflowX = document.body.style.overflowX;
    const prevHtmlOverflowX = document.documentElement.style.overflowX;
    if (window.scrollX !== 0) {
      window.scrollTo({ left: 0, top: window.scrollY });
    }
    document.body.style.overflow = "hidden";
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
      document.body.style.overflowX = prevBodyOverflowX;
      document.documentElement.style.overflowX = prevHtmlOverflowX;
    };
  }, [open, onClose]);

  if (!open || !opportunity) return null;

  const opp = opportunity;
  const mp = MARKETPLACE_CONFIG[opp.marketplace];
  const q = QUALITY_CONFIG[opp.quality];
  const discount = discountPercent(opp.price, opp.originalPrice);
  const acqTotal = getAcqTotal(opp);
  const best = getBestChannel(opp.channelMargins);
  // fee vem como percentual (ex.: 15 para 15%), igual ao DB/channel_margins.fee_pct.
  const profit = best
    ? Math.round((best.marketPrice * (1 - best.fee / 100) - acqTotal) * 100) / 100
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
        display: "flex", alignItems: compactViewport ? "stretch" : "center", justifyContent: "center",
        padding: compactViewport ? 0 : "8px 8px calc(8px + env(safe-area-inset-bottom))", overflowY: "auto", overflowX: "hidden",
        overscrollBehavior: "contain",
        animation: "authFadeIn 0.2s ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
          boxSizing: "border-box",
          width: compactViewport ? "100%" : "min(520px, calc(100vw - 16px))",
          maxWidth: compactViewport ? "100%" : "calc(100vw - 16px)",
          minWidth: 0, flexShrink: 1, position: "relative",
          display: "flex", flexDirection: "column",
          height: compactViewport ? "100dvh" : undefined,
          maxHeight: compactViewport ? "100dvh" : "calc(100dvh - 16px)",
          overflow: "hidden",
          borderRadius: compactViewport ? 0 : 24,
          border: compactViewport ? "none" : "1px solid var(--border)",
        }}
      >
        {/* ── Hero image ── */}
        <div style={{
          position: "relative", height: compactViewport ? "clamp(112px, 24dvh, 168px)" : "clamp(136px, 28dvh, 200px)", overflow: "hidden", flexShrink: 0,
          borderRadius: compactViewport ? 0 : "24px 24px 0 0",
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
          <div style={{ position: "absolute", top: 12, left: 12, right: 56, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 8,
              background: "var(--glass-strong)", backdropFilter: "blur(8px)",
              fontSize: 11, fontWeight: 700, border: "1px solid var(--border)",
              color: "var(--text-1)", maxWidth: "100%", minWidth: 0,
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
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opp.marketplace}</span>
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
        <div style={{ padding: "clamp(12px, 4vw, 20px)", overflowY: "auto", overflowX: "hidden", flex: 1, minHeight: 0 }}>
          {/* Title + badges */}
          <div style={{ marginBottom: 14 }}>
            <h2
              id={titleId}
              style={{ fontSize: "clamp(17px, 5vw, 20px)", fontWeight: 800, color: "var(--text-1)", margin: "0 0 8px", lineHeight: 1.3, overflowWrap: "anywhere" }}
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
            padding: "12px clamp(12px, 4vw, 16px)", borderRadius: 14,
            background: "var(--margin-block-bg)", border: "1px solid var(--border)",
            flexWrap: "wrap", minWidth: 0,
          }}>
            <span style={{
              fontSize: "clamp(22px, 7vw, 28px)", fontWeight: 800, color: "var(--text-1)",
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
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--success)", marginLeft: compactViewport ? 0 : "auto", maxWidth: "100%", overflowWrap: "anywhere" }}>
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
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
                  padding: "10px 14px",
                  background: i % 2 === 0 ? "var(--margin-block-bg)" : "var(--card)",
                  borderBottom: i < details.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <AppIcon name={d.icon} size={14} stroke="var(--text-3)" />
                  <span style={{ fontSize: 12, color: "var(--text-2)", minWidth: 0 }}>{d.label}</span>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: d.bold ? 800 : 700,
                  color: d.color, fontFamily: "var(--font-mono)", marginLeft: "auto", maxWidth: "100%", overflowWrap: "anywhere", textAlign: "right",
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
                    display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 0.9fr) minmax(0, 0.45fr) minmax(0, 0.75fr)",
                    padding: "8px 14px 6px", borderTop: "1px solid var(--border)",
                    columnGap: 6,
                  }}>
                    {["Canal", "Preço médio", "Taxa", "Margem"].map((h) => (
                      <span key={h} style={{
                        fontSize: 10, fontWeight: 700, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
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
                          display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 0.9fr) minmax(0, 0.45fr) minmax(0, 0.75fr)",
                          padding: "10px 14px",
                          background: isBest
                            ? "color-mix(in srgb, var(--success) 7%, var(--card))"
                            : i % 2 === 0 ? "var(--card)" : "var(--margin-block-bg)",
                          borderTop: "1px solid var(--border)",
                          alignItems: "center", columnGap: 6, minWidth: 0,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
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
                          <span style={{ fontSize: 12, fontWeight: isBest ? 700 : 500, color: isBest ? "var(--text-1)" : "var(--text-2)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ch.channel}{isBest ? " ★" : ""}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "var(--font-mono)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {formatBrl(ch.marketPrice)}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", minWidth: 0 }}>
                          {Math.round(ch.fee)}%
                        </span>
                        <span style={{
                          fontSize: 12, fontWeight: 800,
                          color: isBest ? "var(--success)" : "var(--text-2)",
                          fontFamily: "var(--font-mono)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
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
          padding: "12px clamp(12px, 4vw, 20px) calc(12px + env(safe-area-inset-bottom))",
          background: "var(--card)", borderTop: "1px solid var(--border)",
          borderRadius: "0 0 24px 24px",
          display: "flex", flexDirection: "column", gap: 8, flexShrink: 0,
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a
              href={opp.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: "1 1 180px", minWidth: 0, padding: "12px 14px", borderRadius: 14,
                textDecoration: "none", textAlign: "center",
                background: "var(--accent)", color: "#fff",
                fontSize: 14, fontWeight: 700, fontFamily: "var(--font-body)",
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
                  flex: "1 1 120px", minWidth: 0, padding: "12px 14px", borderRadius: 14, cursor: "pointer",
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
