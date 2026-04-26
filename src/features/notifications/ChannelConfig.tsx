"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { Toggle } from "@/components/Toggle";
import type { Plan } from "@/lib/plan-limits";
import { cardOverflowStyle, hintBoxStyle } from "@/lib/styles";

import {
  useNotificationSettings,
  type NotificationSettingsInput,
} from "./hooks";

type ChannelConfigProps = NotificationSettingsInput & { plan: Plan };

type SilencePreset = {
  id: string;
  label: string;
  icon: "moon" | "flame" | "sun";
  start: string;
  end: string;
  description: string;
};

const SILENCE_PRESETS: SilencePreset[] = [
  { id: "night", label: "Noite", icon: "moon", start: "22:00", end: "07:00", description: "Descanso padrão" },
  { id: "late", label: "Madrugada", icon: "flame", start: "00:00", end: "06:00", description: "Dormir tarde" },
  { id: "long", label: "Sono leve", icon: "sun", start: "23:00", end: "08:00", description: "Período estendido" },
];

const MINUTES_IN_DAY = 24 * 60;

function parseTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function silenceDuration(start: string, end: string): { hours: number; minutes: number; totalMinutes: number } | null {
  const s = parseTime(start);
  const e = parseTime(end);
  if (s === null || e === null) return null;
  let diff = e - s;
  if (diff <= 0) diff += MINUTES_IN_DAY;
  return { hours: Math.floor(diff / 60), minutes: diff % 60, totalMinutes: diff };
}

function formatDuration(d: { hours: number; minutes: number }): string {
  if (d.hours === 0) return `${d.minutes}min`;
  if (d.minutes === 0) return `${d.hours}h`;
  return `${d.hours}h ${d.minutes}min`;
}

/** Returns the SVG segments (x%, width%) painting the silent window on a 24h horizontal axis. */
function silenceSegments(start: string, end: string): Array<{ x: number; width: number }> {
  const s = parseTime(start);
  const e = parseTime(end);
  if (s === null || e === null) return [];
  if (e > s) {
    return [{ x: (s / MINUTES_IN_DAY) * 100, width: ((e - s) / MINUTES_IN_DAY) * 100 }];
  }
  // crosses midnight
  return [
    { x: (s / MINUTES_IN_DAY) * 100, width: ((MINUTES_IN_DAY - s) / MINUTES_IN_DAY) * 100 },
    { x: 0, width: (e / MINUTES_IN_DAY) * 100 },
  ];
}

export function ChannelConfig({ plan, ...props }: ChannelConfigProps) {
  const {
    channels,
    silenceStart,
    silenceEnd,
    saving,
    error,
    saveFeedback,
    setSilenceStart,
    setSilenceEnd,
    toggleChannel,
    saveSettings,
  } = useNotificationSettings(props);

  const telegramActive = channels.includes("telegram");
  const webActive = channels.includes("web");
  const whatsappEnabled = plan === "starter" || plan === "pro";
  const activeCount = (telegramActive ? 1 : 0) + (webActive ? 1 : 0);

  const silenceEnabled = silenceStart.length > 0 && silenceEnd.length > 0;
  const [quietOn, setQuietOn] = useState(silenceEnabled);

  const duration = useMemo(() => silenceDuration(silenceStart, silenceEnd), [silenceStart, silenceEnd]);
  const segments = useMemo(() => silenceSegments(silenceStart, silenceEnd), [silenceStart, silenceEnd]);
  const activePreset = useMemo(
    () => SILENCE_PRESETS.find((p) => p.start === silenceStart && p.end === silenceEnd)?.id ?? null,
    [silenceStart, silenceEnd],
  );

  function handleQuietToggle(next: boolean) {
    setQuietOn(next);
    if (!next) {
      setSilenceStart("");
      setSilenceEnd("");
    } else if (!silenceStart) {
      setSilenceStart("22:00");
      setSilenceEnd("07:00");
    }
  }

  return (
    <div style={cardOverflowStyle}>
      {/* Card header */}
      <div style={{
        background: "color-mix(in srgb, var(--accent-light) 8%, var(--card))",
        borderBottom: "1px solid var(--border)",
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "color-mix(in srgb, var(--accent-light) 16%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent-light) 30%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AppIcon name="bell" size={16} stroke="var(--accent-light)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Canais de alerta</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Escolha como receber notificações</div>
          </div>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          background: "color-mix(in srgb, var(--success) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--success) 25%, var(--border))",
          color: "var(--success)",
        }}>
          <AppIcon name="check" size={10} stroke="var(--success)" /> {activeCount} ativo{activeCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* Channel grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, paddingBottom: 16 }}>
          {/* Telegram */}
          <button
            type="button"
            onClick={() => toggleChannel("telegram", !telegramActive)}
            disabled={saving}
            style={{
              padding: "14px 10px", borderRadius: 14, cursor: "pointer",
              border: telegramActive
                ? "1px solid color-mix(in srgb, #229ED9 40%, var(--border))"
                : "1px solid var(--border)",
              background: telegramActive
                ? "color-mix(in srgb, #229ED9 8%, var(--card))"
                : "var(--margin-block-bg)",
              textAlign: "center", fontFamily: "var(--font-body)",
              transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "color-mix(in srgb, #229ED9 14%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px",
            }}>
              <AppIcon name="send" size={18} stroke={telegramActive ? "#229ED9" : "var(--text-3)"} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: telegramActive ? "var(--text-1)" : "var(--text-3)" }}>
              Telegram
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: telegramActive ? "#229ED9" : "var(--text-3)", marginTop: 4 }}>
              {telegramActive ? "Ativo" : "Inativo"}
            </div>
          </button>

          {/* WhatsApp — plan-gated */}
          <div style={{
            padding: "14px 10px", borderRadius: 14, textAlign: "center", position: "relative",
            border: "1px solid var(--border)",
            background: "var(--margin-block-bg)",
            opacity: whatsappEnabled ? 0.7 : 0.5,
          }}>
            {!whatsappEnabled && (
              <span style={{
                position: "absolute", top: 8, right: 8,
                fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 4,
                background: "color-mix(in srgb, var(--warning) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
                color: "var(--warning)", letterSpacing: "0.05em",
              }}>
                PRO
              </span>
            )}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "color-mix(in srgb, #25D366 14%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px",
            }}>
              <AppIcon name="message" size={18} stroke="var(--text-3)" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)" }}>WhatsApp</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", marginTop: 4 }}>
              {whatsappEnabled ? "Não configurado" : "Plano pago"}
            </div>
            {!whatsappEnabled && (
              <Link href="/planos" style={{ marginTop: 6, display: "block", fontSize: 10, fontWeight: 700, color: "var(--warning)", textDecoration: "underline" }}>
                Ver planos
              </Link>
            )}
          </div>

          {/* Web App */}
          <button
            type="button"
            onClick={() => toggleChannel("web", !webActive)}
            disabled={saving}
            style={{
              padding: "14px 10px", borderRadius: 14, cursor: "pointer",
              border: webActive
                ? "1px solid color-mix(in srgb, var(--accent-light) 40%, var(--border))"
                : "1px solid var(--border)",
              background: webActive
                ? "color-mix(in srgb, var(--accent-light) 8%, var(--card))"
                : "var(--margin-block-bg)",
              textAlign: "center", fontFamily: "var(--font-body)",
              transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "color-mix(in srgb, var(--accent-light) 14%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px",
            }}>
              <AppIcon name="monitor" size={18} stroke={webActive ? "var(--accent-light)" : "var(--text-3)"} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: webActive ? "var(--text-1)" : "var(--text-3)" }}>
              Web App
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: webActive ? "var(--accent-light)" : "var(--text-3)", marginTop: 4 }}>
              {webActive ? "Ativo" : "Inativo"}
            </div>
          </button>
        </div>

        {/* Silence section */}
        <div
          style={{
            marginTop: 6,
            borderRadius: 16,
            overflow: "hidden",
            border: quietOn
              ? "1px solid color-mix(in srgb, var(--info) 35%, var(--border))"
              : "1px solid var(--border)",
            background: quietOn
              ? "linear-gradient(160deg, color-mix(in srgb, var(--info) 10%, var(--card)), color-mix(in srgb, #1B2E63 6%, var(--card)))"
              : "var(--margin-block-bg)",
            transition: "background 0.2s ease, border-color 0.2s ease",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 16px",
              borderBottomWidth: quietOn ? 1 : 0,
              borderBottomStyle: "solid",
              borderBottomColor: "color-mix(in srgb, var(--info) 20%, var(--border))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: quietOn
                    ? "linear-gradient(135deg, var(--info), color-mix(in srgb, var(--info) 60%, #1B2E63))"
                    : "color-mix(in srgb, var(--info) 12%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: quietOn
                    ? "0 6px 16px color-mix(in srgb, var(--info) 30%, transparent)"
                    : "none",
                }}
              >
                <AppIcon name="moon" size={18} stroke={quietOn ? "#fff" : "var(--info)"} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-1)",
                  }}
                >
                  Modo silêncio
                  {quietOn && duration && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "color-mix(in srgb, var(--info) 18%, var(--card))",
                        color: "var(--info)",
                        border: "1px solid color-mix(in srgb, var(--info) 30%, transparent)",
                        textTransform: "uppercase",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {formatDuration(duration)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  {quietOn && silenceStart && silenceEnd ? (
                    <>
                      Notificações pausadas das{" "}
                      <strong style={{ color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>{silenceStart}</strong>
                      {" "}até{" "}
                      <strong style={{ color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>{silenceEnd}</strong>
                    </>
                  ) : (
                    "Defina um intervalo para pausar notificações automaticamente"
                  )}
                </div>
              </div>
            </div>
            <Toggle
              checked={quietOn}
              onChange={handleQuietToggle}
              aria-label="Ativar modo silêncio"
              disabled={saving}
            />
          </div>

          {quietOn && (
            <div style={{ padding: "16px 16px 18px", display: "grid", gap: 16 }}>
              {/* Time inputs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  background: "color-mix(in srgb, var(--info) 6%, var(--card))",
                  borderRadius: 14,
                  padding: 4,
                  border: "1px solid color-mix(in srgb, var(--info) 18%, var(--border))",
                }}
              >
                {/* Start */}
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "var(--card)",
                    border: "1px solid color-mix(in srgb, var(--info) 22%, var(--border))",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <AppIcon name="moon" size={11} stroke="var(--info)" />
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        color: "var(--text-3)",
                        textTransform: "uppercase",
                      }}
                    >
                      Início
                    </span>
                  </div>
                  <input
                    type="time"
                    value={silenceStart}
                    onChange={(event) => setSilenceStart(event.target.value)}
                    disabled={saving}
                    aria-label="Horário de início do silêncio"
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "var(--text-1)",
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      padding: 0,
                      textAlign: "center",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  />
                </label>

                {/* Connector */}
                <div
                  aria-hidden
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    padding: "0 2px",
                    color: "var(--text-3)",
                  }}
                >
                  <AppIcon name="arrowUpRight" size={13} stroke="var(--text-3)" />
                </div>

                {/* End */}
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "var(--card)",
                    border: "1px solid color-mix(in srgb, var(--warning) 22%, var(--border))",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <AppIcon name="sun" size={11} stroke="var(--warning)" />
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        color: "var(--text-3)",
                        textTransform: "uppercase",
                      }}
                    >
                      Fim
                    </span>
                  </div>
                  <input
                    type="time"
                    value={silenceEnd}
                    onChange={(event) => setSilenceEnd(event.target.value)}
                    disabled={saving}
                    aria-label="Horário de fim do silêncio"
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "var(--text-1)",
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      padding: 0,
                      textAlign: "center",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  />
                </label>
              </div>

              {/* 24h timeline visualization */}
              {segments.length > 0 && (
                <div>
                  <div
                    role="img"
                    aria-label={`Janela de silêncio de ${silenceStart} até ${silenceEnd} no período de 24 horas`}
                    style={{
                      position: "relative",
                      height: 28,
                      borderRadius: 8,
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    {segments.map((seg, index) => (
                      <span
                        key={index}
                        aria-hidden
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: `${seg.x}%`,
                          width: `${seg.width}%`,
                          background:
                            "linear-gradient(90deg, color-mix(in srgb, var(--info) 45%, transparent), color-mix(in srgb, #1B2E63 45%, transparent))",
                          borderRight: "1px solid color-mix(in srgb, var(--info) 40%, transparent)",
                          borderLeft: "1px solid color-mix(in srgb, var(--info) 40%, transparent)",
                        }}
                      />
                    ))}
                    {[0, 6, 12, 18].map((hour) => (
                      <span
                        key={hour}
                        aria-hidden
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: `${(hour / 24) * 100}%`,
                          width: 1,
                          background: "var(--border)",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    aria-hidden
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 4,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "var(--text-3)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <span>00h</span>
                    <span>06h</span>
                    <span>12h</span>
                    <span>18h</span>
                    <span>24h</span>
                  </div>
                </div>
              )}

              {/* Presets */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Presets
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 8,
                  }}
                >
                  {SILENCE_PRESETS.map((preset) => {
                    const active = activePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSilenceStart(preset.start);
                          setSilenceEnd(preset.end);
                        }}
                        disabled={saving}
                        aria-label={`${preset.start}–${preset.end}`}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: active
                            ? "1px solid color-mix(in srgb, var(--info) 50%, var(--border))"
                            : "1px solid var(--border)",
                          background: active
                            ? "color-mix(in srgb, var(--info) 12%, var(--card))"
                            : "var(--card)",
                          cursor: saving ? "not-allowed" : "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          fontFamily: "var(--font-body)",
                          transition: "background 0.15s, border-color 0.15s",
                        }}
                      >
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 9,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: active
                              ? "color-mix(in srgb, var(--info) 18%, var(--card))"
                              : "var(--margin-block-bg)",
                            flexShrink: 0,
                          }}
                        >
                          <AppIcon
                            name={preset.icon}
                            size={14}
                            stroke={active ? "var(--info)" : "var(--text-3)"}
                          />
                        </span>
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              display: "block",
                              fontSize: 12,
                              fontWeight: 700,
                              color: active ? "var(--info)" : "var(--text-1)",
                            }}
                          >
                            {preset.label}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: 10,
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-3)",
                              marginTop: 1,
                            }}
                          >
                            {preset.start}–{preset.end} · {preset.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ ...hintBoxStyle("danger"), marginTop: 10, padding: "8px 12px", borderRadius: 10 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={saving}
            style={{
              padding: "10px 20px", borderRadius: 12, border: "none", cursor: saving ? "not-allowed" : "pointer",
              background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: "var(--font-body)", opacity: saving ? 0.7 : 1,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <AppIcon name="check" size={14} stroke="#fff" />
            {saving ? "Salvando..." : "Salvar preferências"}
          </button>
          {saveFeedback && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AppIcon name="check" size={13} stroke="var(--success)" /> {saveFeedback}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
