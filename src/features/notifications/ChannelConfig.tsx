"use client";

import Link from "next/link";
import { useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { Toggle } from "@/components/Toggle";
import type { Plan } from "@/lib/plan-limits";
import { cardOverflowStyle, hintBoxStyle } from "@/lib/styles";

import {
  useNotificationSettings,
  type NotificationSettingsInput,
} from "./hooks";

type ChannelConfigProps = NotificationSettingsInput & { plan: Plan };

const SILENCE_PRESETS: Array<[string, string]> = [
  ["22:00", "07:00"],
  ["23:00", "08:00"],
  ["00:00", "06:00"],
];

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

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
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: quietOn ? 14 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "color-mix(in srgb, var(--info) 12%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AppIcon name="moon" size={16} stroke="var(--info)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Modo silêncio</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {quietOn && silenceStart && silenceEnd
                    ? `${silenceStart} — ${silenceEnd} • Sem push`
                    : "Sem notificações no período"}
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
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>De</label>
                <select
                  value={silenceStart}
                  onChange={(e) => setSilenceStart(e.target.value)}
                  disabled={saving}
                  style={{
                    padding: "7px 10px", borderRadius: 10, border: "1px solid var(--border)",
                    background: "var(--card)", color: "var(--text-1)", fontSize: 13, fontWeight: 600,
                    fontFamily: "var(--font-mono)", cursor: "pointer", outline: "none",
                  }}
                >
                  {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Até</label>
                <select
                  value={silenceEnd}
                  onChange={(e) => setSilenceEnd(e.target.value)}
                  disabled={saving}
                  style={{
                    padding: "7px 10px", borderRadius: 10, border: "1px solid var(--border)",
                    background: "var(--card)", color: "var(--text-1)", fontSize: 13, fontWeight: 600,
                    fontFamily: "var(--font-mono)", cursor: "pointer", outline: "none",
                  }}
                >
                  {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SILENCE_PRESETS.map(([s, e]) => (
                  <button
                    key={`${s}-${e}`}
                    type="button"
                    onClick={() => { setSilenceStart(s); setSilenceEnd(e); }}
                    disabled={saving}
                    style={{
                      padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      border: silenceStart === s && silenceEnd === e
                        ? "1px solid color-mix(in srgb, var(--info) 50%, var(--border))"
                        : "1px solid var(--border)",
                      background: silenceStart === s && silenceEnd === e
                        ? "color-mix(in srgb, var(--info) 12%, var(--card))"
                        : "var(--card)",
                      color: silenceStart === s && silenceEnd === e ? "var(--info)" : "var(--text-3)",
                    }}
                  >
                    {s}–{e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ ...hintBoxStyle("danger"), marginTop: 10, padding: "8px 12px", borderRadius: 10 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
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
