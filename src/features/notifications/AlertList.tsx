"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppIcon } from "@/components/AppIcon";

import {
  useAlerts,
  type LiveAlertItem,
  type OpportunityAlertItem,
  type UnifiedAlertItem,
} from "./hooks";

export type AlertListProps = {
  opportunityAlerts: OpportunityAlertItem[];
  liveAlerts: LiveAlertItem[];
};

const MARKETPLACE_CONFIG: Record<string, { color: string; logo: string }> = {
  "Mercado Livre": { color: "#ffe600", logo: "/assets/marketplaces/mercado-livre.svg" },
  Shopee: { color: "#ee4d2d", logo: "/assets/marketplaces/shopee.svg" },
  "Magazine Luiza": { color: "#0086ff", logo: "/assets/marketplaces/magalu.svg" },
};

function formatRelative(value: string): string {
  const diff = Date.now() - Date.parse(value);
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function statusLabel(status: string): string {
  if (status === "sent") return "Enviado";
  if (status === "read") return "Lido";
  if (status === "silenced") return "Silenciado";
  if (status === "failed") return "Falhou";
  if (status === "pending") return "Pendente";
  if (status === "skipped_limit") return "Ignorado (limite)";
  if (status === "skipped_silence") return "Silenciado";
  return status;
}

function channelLabel(channel: string): string {
  if (channel === "telegram") return "Telegram";
  if (channel === "web") return "Web";
  return channel;
}

function isUnread(alert: UnifiedAlertItem): boolean {
  return alert.status === "sent" || alert.status === "pending";
}

export function AlertList({ opportunityAlerts, liveAlerts }: AlertListProps) {
  const alerts = useAlerts({ opportunityAlerts, liveAlerts });
  const [onlyPending, setOnlyPending] = useState(false);

  const unreadCount = useMemo(() => alerts.filter(isUnread).length, [alerts]);
  const sentCount = useMemo(
    () => alerts.filter((a) => a.status === "sent" || a.status === "read").length,
    [alerts],
  );
  const silencedCount = useMemo(
    () => alerts.filter((a) => a.status === "silenced" || a.status === "skipped_silence").length,
    [alerts],
  );
  const liveCount = useMemo(() => alerts.filter((a) => a.type === "live").length, [alerts]);

  const visible = useMemo(
    () => (onlyPending ? alerts.filter(isUnread) : alerts),
    [alerts, onlyPending],
  );

  const stats = [
    { label: "Novos", value: unreadCount, icon: "bell" as const, color: "var(--accent)", sub: "não lidos" },
    { label: "Enviados", value: sentCount, icon: "trend" as const, color: "var(--success)", sub: "entregues" },
    { label: "Silenciados", value: silencedCount, icon: "moon" as const, color: "var(--info)", sub: "no período" },
    ...(liveCount > 0
      ? [{ label: "Lives", value: liveCount, icon: "video" as const, color: "var(--danger)", sub: "transmissões" }]
      : []),
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Stats strip */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "14px 16px",
              boxShadow: "var(--card-shadow)", position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: s.color, borderRadius: "16px 16px 0 0",
            }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {s.label}
              </span>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AppIcon name={s.icon} size={14} stroke={s.color} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "var(--font-mono)", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerts card */}
      <div style={{
        background: "var(--card)", borderRadius: 20,
        border: "1px solid var(--border)", overflow: "hidden",
        boxShadow: "var(--card-shadow)",
      }}>
        {/* Card header */}
        <div style={{
          background: "color-mix(in srgb, var(--info) 6%, var(--card))",
          borderBottom: "1px solid var(--border)",
          padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "color-mix(in srgb, var(--info) 16%, transparent)",
              border: "1px solid color-mix(in srgb, var(--info) 30%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AppIcon name="bell" size={16} stroke="var(--info)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Alertas recentes</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Oportunidades que casam com seus interesses</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {unreadCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--border))",
                color: "var(--accent)",
              }}>
                {unreadCount} novo{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
            <span style={{
              padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: "var(--margin-block-bg)", border: "1px solid var(--border)",
              color: "var(--text-3)",
            }}>
              {alerts.length} total
            </span>
          </div>
        </div>

        <div style={{ padding: "14px 20px" }}>
          {/* Filter row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setOnlyPending(!onlyPending)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--margin-block-bg)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 10px", cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              <span style={{
                width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                border: onlyPending ? "none" : "1.5px solid var(--text-3)",
                background: onlyPending ? "var(--accent)" : "transparent",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                {onlyPending && <AppIcon name="check" size={10} stroke="#fff" />}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 600, whiteSpace: "nowrap" }}>
                Apenas não lidos
              </span>
            </button>
          </div>

          {visible.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "32px 16px", borderRadius: 16,
              border: "1px dashed var(--border)",
              background: "color-mix(in srgb, var(--accent) 2%, var(--card))",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "color-mix(in srgb, var(--info) 12%, transparent)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
              }}>
                <AppIcon name="bell" size={22} stroke="var(--info)" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
                {onlyPending ? "Nenhum alerta não lido" : "Nenhum alerta ainda"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, maxWidth: 300, margin: "0 auto" }}>
                {onlyPending
                  ? "Todos os alertas já foram lidos ou processados."
                  : "Quando novas oportunidades forem detectadas, elas aparecerão aqui."}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visible.map((alert, idx) => (
                <AlertItem key={`${alert.type}-${alert.id}`} alert={alert} index={idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertItem({ alert, index }: { alert: UnifiedAlertItem; index: number }) {
  const mp = MARKETPLACE_CONFIG[alert.title] ?? MARKETPLACE_CONFIG[alert.subtitle?.split(" · ")[0] ?? ""];
  const unread = isUnread(alert);
  const isLive = alert.type === "live";

  return (
    <div
      style={{
        padding: 14, borderRadius: 16, position: "relative",
        background: unread
          ? "color-mix(in srgb, var(--accent) 4%, var(--card))"
          : "var(--margin-block-bg)",
        border: unread
          ? "1px solid color-mix(in srgb, var(--accent) 18%, var(--border))"
          : "1px solid var(--border)",
        animation: `cardIn 0.3s cubic-bezier(.2,.8,.3,1) ${index * 50}ms both`,
      }}
    >
      {/* Row 1: icon + title + time + channel badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, overflow: "hidden",
            background: isLive
              ? "color-mix(in srgb, var(--danger) 14%, transparent)"
              : "color-mix(in srgb, var(--accent) 10%, transparent)",
            border: isLive
              ? "1px solid color-mix(in srgb, var(--danger) 25%, transparent)"
              : "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {!isLive && mp?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mp.logo} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
            ) : (
              <AppIcon name={isLive ? "video" : "bell"} size={16} stroke={isLive ? "var(--danger)" : "var(--accent)"} />
            )}
          </div>
          {unread && (
            <span style={{
              position: "absolute", top: -2, right: -2,
              width: 9, height: 9, borderRadius: "50%",
              background: "var(--accent)", border: "2px solid var(--card)",
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "var(--text-1)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {alert.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>há {formatRelative(alert.createdAt)}</span>
            {alert.subtitle && (
              <>
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>•</span>
                <span style={{ fontSize: 10, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                  {alert.subtitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status + channel badges */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
            background: unread
              ? "color-mix(in srgb, var(--accent) 10%, transparent)"
              : "color-mix(in srgb, var(--success) 10%, transparent)",
            color: unread ? "var(--accent)" : "var(--success)",
          }}>
            {statusLabel(alert.status)}
          </span>
          <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-3)" }}>
            {channelLabel(alert.channel)}
          </span>
        </div>
      </div>

      {/* Type badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
          background: isLive
            ? "color-mix(in srgb, var(--danger) 10%, transparent)"
            : "color-mix(in srgb, var(--info) 10%, transparent)",
          color: isLive ? "var(--danger)" : "var(--info)",
          border: `1px solid ${isLive
            ? "color-mix(in srgb, var(--danger) 22%, transparent)"
            : "color-mix(in srgb, var(--info) 22%, transparent)"}`,
        }}>
          <AppIcon name={isLive ? "video" : "bell"} size={9} stroke={isLive ? "var(--danger)" : "var(--info)"} />
          {isLive ? "Live" : "Oferta"}
        </span>
      </div>

      {/* Action */}
      {alert.actionUrl && (
        <div style={{ marginTop: 10 }}>
          <Link
            href={alert.actionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 14px", borderRadius: 10, textDecoration: "none",
              background: "color-mix(in srgb, var(--accent) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
              fontSize: 12, fontWeight: 700, color: "var(--accent-dark)",
              fontFamily: "var(--font-body)",
            }}
          >
            <AppIcon name="arrowUpRight" size={13} stroke="var(--accent-dark)" />
            {isLive ? "Entrar na live" : "Ver oferta"}
          </Link>
        </div>
      )}
    </div>
  );
}
