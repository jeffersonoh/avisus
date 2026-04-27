"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { z } from "zod";

import { AppIcon } from "@/components/AppIcon";
import { calculateNetMarginPercent } from "@/lib/scanner/margin-calculator";
import { btnPrimary, cardStyle, hintBoxStyle } from "@/lib/styles";

import { updateResaleSettings } from "./actions";

type ResaleMode = "average" | "custom";

type ResaleFees = {
  "Mercado Livre": number;
  "Magazine Luiza": number;
};

type ChannelKey = keyof ResaleFees;

type ResaleChannelsFormProps = {
  initialMode: ResaleMode;
  initialFees: ResaleFees;
};

const feeSchema = z.object({
  "Mercado Livre": z.number().min(0).max(50),
  "Magazine Luiza": z.number().min(0).max(50),
});

const AVERAGE_FEES: ResaleFees = {
  "Mercado Livre": 15,
  "Magazine Luiza": 16,
};

const SAMPLE_COST = 120;
const SAMPLE_MARKET_PRICES: Record<ChannelKey, number> = {
  "Mercado Livre": 179,
  "Magazine Luiza": 172,
};

const CHANNEL_META: Record<ChannelKey, { accent: string; tag: string }> = {
  "Mercado Livre": { accent: "#D4A017", tag: "ML" },
  "Magazine Luiza": { accent: "#2E8B57", tag: "MAGALU" },
};

const CHANNELS: ChannelKey[] = ["Mercado Livre", "Magazine Luiza"];

type ModeCard = {
  id: ResaleMode;
  icon: "sparkles" | "sliders";
  title: string;
  description: string;
};

const MODE_OPTIONS: ModeCard[] = [
  {
    id: "average",
    icon: "sparkles",
    title: "Taxas médias",
    description: "Use estimativas atualizadas do mercado para simulação rápida.",
  },
  {
    id: "custom",
    icon: "sliders",
    title: "Taxas personalizadas",
    description: "Ajuste cada marketplace com as taxas reais do seu plano.",
  },
];

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function marginTone(margin: number): { color: string; background: string; label: string } {
  if (margin >= 20) {
    return {
      color: "var(--success)",
      background: "color-mix(in srgb, var(--success) 10%, var(--card))",
      label: "Excelente",
    };
  }
  if (margin >= 10) {
    return {
      color: "var(--warning)",
      background: "color-mix(in srgb, var(--warning) 10%, var(--card))",
      label: "Atenção",
    };
  }
  return {
    color: "var(--danger)",
    background: "color-mix(in srgb, var(--danger) 10%, var(--card))",
    label: "Baixa",
  };
}

export function ResaleChannelsForm({ initialMode, initialFees }: ResaleChannelsFormProps) {
  const [mode, setMode] = useState<ResaleMode>(initialMode);
  const [fees, setFees] = useState<ResaleFees>(initialFees);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    if (!saveFeedback) return;
    const timer = window.setTimeout(() => setSaveFeedback(null), 2000);
    return () => window.clearTimeout(timer);
  }, [saveFeedback]);

  const effectiveFees = mode === "average" ? AVERAGE_FEES : fees;

  const preview = useMemo(() => {
    return CHANNELS.map((channel) => {
      const marketPrice = SAMPLE_MARKET_PRICES[channel];
      const feePct = effectiveFees[channel];
      const feeAmount = marketPrice * (feePct / 100);
      const net = marketPrice - feeAmount;
      const profit = net - SAMPLE_COST;
      const margin = calculateNetMarginPercent({
        cost: SAMPLE_COST,
        marketPrice,
        userFeePct: feePct,
      });
      return { channel, marketPrice, feePct, feeAmount, net, profit, margin };
    });
  }, [effectiveFees]);

  function handleFeeChange(channel: ChannelKey, value: string) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    setErrorMessage(null);
    setFees((prev) => ({ ...prev, [channel]: numeric }));
  }

  function handleSave() {
    setErrorMessage(null);
    const parsed = feeSchema.safeParse(fees);
    if (!parsed.success) {
      setErrorMessage("As taxas precisam estar entre 0% e 50%.");
      return;
    }

    startSaving(async () => {
      const result = await updateResaleSettings({ mode, fees: parsed.data });
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      setSaveFeedback("Configuração salva");
    });
  }

  return (
    <section style={{ display: "grid", gap: 20 }}>
      {/* Hero */}
      <header
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "28px 24px",
          borderRadius: 24,
          background:
            "linear-gradient(145deg, color-mix(in srgb, var(--accent-light) 8%, var(--card)), color-mix(in srgb, var(--warning) 4%, var(--card)))",
          border: "1px solid color-mix(in srgb, var(--accent-light) 18%, var(--border))",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "color-mix(in srgb, var(--accent-light) 8%, transparent)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "color-mix(in srgb, var(--accent-light) 18%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--accent-light) 30%, var(--border))",
              flexShrink: 0,
            }}
          >
            <AppIcon name="percent" size={22} stroke="var(--accent-light)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "var(--accent-light)",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Perfil · Simulação
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                color: "var(--text-1)",
                letterSpacing: "-0.01em",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Margem de revenda
            </h1>
            <p
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "var(--text-3)",
                lineHeight: 1.5,
                maxWidth: 620,
              }}
            >
              Ajuste as taxas para simular sua margem com valores médios de mercado ou com suas
              taxas personalizadas.
            </p>
          </div>
        </div>
      </header>

      {/* Mode selector */}
      <div
        role="radiogroup"
        aria-label="Modo de cálculo"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {MODE_OPTIONS.map((option) => {
          const active = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(option.id)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                padding: "16px 18px",
                borderRadius: 16,
                border: active
                  ? "1px solid color-mix(in srgb, var(--accent-light) 55%, transparent)"
                  : "1px solid var(--border)",
                background: active
                  ? "color-mix(in srgb, var(--accent-light) 10%, var(--card))"
                  : "var(--card)",
                boxShadow: active
                  ? "0 6px 18px color-mix(in srgb, var(--accent-light) 18%, transparent)"
                  : "var(--card-shadow)",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                fontFamily: "var(--font-body)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active
                    ? "color-mix(in srgb, var(--accent-light) 22%, var(--card))"
                    : "var(--margin-block-bg)",
                  flexShrink: 0,
                }}
              >
                <AppIcon
                  name={option.icon}
                  size={18}
                  stroke={active ? "var(--accent-light)" : "var(--text-3)"}
                />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    color: active ? "var(--accent-light)" : "var(--text-1)",
                    marginBottom: 4,
                  }}
                >
                  {option.title}
                  {active && <AppIcon name="check" size={14} stroke="var(--accent-light)" />}
                </span>
                <span style={{ display: "block", fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom fees input */}
      {mode === "custom" && (
        <div
          style={{
            ...cardStyle,
            padding: 20,
            display: "grid",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AppIcon name="sliders" size={16} stroke="var(--accent-light)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              Suas taxas por marketplace
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {CHANNELS.map((channel) => {
              const meta = CHANNEL_META[channel];
              const value = fees[channel];
              return (
                <label key={channel} style={{ display: "block" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: meta.accent,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: `color-mix(in srgb, ${meta.accent} 12%, var(--card))`,
                        border: `1px solid color-mix(in srgb, ${meta.accent} 30%, var(--border))`,
                        color: meta.accent,
                        letterSpacing: "0.08em",
                      }}
                    >
                      {meta.tag}
                    </span>
                    {channel}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--margin-block-bg)",
                    }}
                  >
                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={0.5}
                      value={value}
                      onChange={(event) => handleFeeChange(channel, event.target.value)}
                      style={{ flex: 1, accentColor: meta.accent }}
                      aria-label={`Taxa ${channel}`}
                    />
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: 2,
                        minWidth: 72,
                        justifyContent: "flex-end",
                      }}
                    >
                      <input
                        type="number"
                        min={0}
                        max={50}
                        step={0.1}
                        value={value}
                        onChange={(event) => handleFeeChange(channel, event.target.value)}
                        style={{
                          width: 52,
                          border: "none",
                          background: "transparent",
                          color: "var(--text-1)",
                          fontSize: 18,
                          fontWeight: 800,
                          fontFamily: "var(--font-mono)",
                          textAlign: "right",
                          outline: "none",
                          padding: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 600 }}>%</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Simulation preview */}
      <div
        style={{
          ...cardStyle,
          padding: 20,
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AppIcon name="target" size={16} stroke="var(--warning)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              Simulação de margem
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-3)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <AppIcon name="info" size={12} stroke="var(--text-3)" />
            Custo exemplo: <strong style={{ color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>{formatCurrency(SAMPLE_COST)}</strong>
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {preview.map((entry) => {
            const meta = CHANNEL_META[entry.channel];
            const tone = marginTone(entry.margin);
            return (
              <article
                key={entry.channel}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  background: "var(--margin-block-bg)",
                  padding: "18px 18px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: meta.accent,
                    opacity: 0.8,
                  }}
                />
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: `color-mix(in srgb, ${meta.accent} 14%, var(--card))`,
                        color: meta.accent,
                        border: `1px solid color-mix(in srgb, ${meta.accent} 30%, transparent)`,
                      }}
                    >
                      {meta.tag}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                      {entry.channel}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      color: tone.color,
                      background: tone.background,
                      border: `1px solid color-mix(in srgb, ${tone.color} 25%, transparent)`,
                    }}
                  >
                    {tone.label}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      color: tone.color,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {entry.margin}%
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>margem líquida</span>
                </div>

                <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-3)" }}>
                    <span>Preço de mercado</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)", fontWeight: 600 }}>
                      {formatCurrency(entry.marketPrice)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-3)" }}>
                    <span>Taxa ({entry.feePct}%)</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--danger)", fontWeight: 600 }}>
                      −{formatCurrency(entry.feeAmount)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-3)" }}>
                    <span>Líquido recebido</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)", fontWeight: 700 }}>
                      {formatCurrency(entry.net)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopStyle: "dashed",
                      borderTopColor: "var(--border)",
                      color: tone.color,
                      fontWeight: 700,
                    }}
                  >
                    <span>Lucro</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(entry.profit)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div style={hintBoxStyle("info")}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontWeight: 700, color: "var(--text-2)" }}>
            <AppIcon name="info" size={12} stroke="var(--text-2)" />
            Como calculamos a margem
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "var(--text-3)",
              lineHeight: 1.6,
            }}
          >
            A margem mostra quanto sobra depois de descontar a taxa do canal e o custo do produto. Exemplo: 20% significa
            R$ 20 de lucro para cada R$ 100 investidos.
          </p>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div role="alert" style={hintBoxStyle("danger")}>
          {errorMessage}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/perfil"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--accent-light)",
            textDecoration: "none",
          }}
        >
          <AppIcon name="arrow-left" size={14} stroke="var(--accent-light)" />
          Voltar para perfil
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saveFeedback && (
            <span
              role="status"
              aria-live="polite"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--success)",
                padding: "6px 12px",
                borderRadius: 999,
                background: "color-mix(in srgb, var(--success) 10%, var(--card))",
                border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)",
              }}
            >
              <AppIcon name="check" size={12} stroke="var(--success)" />
              {saveFeedback}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              ...btnPrimary,
              cursor: isSaving ? "not-allowed" : "pointer",
              gap: 8,
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            <AppIcon name="check" size={14} stroke="#fff" />
            {isSaving ? "Salvando..." : "Salvar configuração"}
          </button>
        </div>
      </div>
    </section>
  );
}
