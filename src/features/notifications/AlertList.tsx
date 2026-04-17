"use client";

import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import { Badge } from "@/components/Badge";

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

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: string): string {
  if (status === "sent") return "Enviado";
  if (status === "read") return "Lido";
  if (status === "silenced") return "Silenciado";
  if (status === "failed") return "Falhou";
  if (status === "skipped_limit") return "Ignorado por limite";
  if (status === "skipped_silence") return "Ignorado por silêncio";
  return status;
}

function statusVariant(status: string): "default" | "accent" | "success" | "danger" {
  if (status === "sent" || status === "read") return "success";
  if (status === "pending") return "accent";
  if (status === "silenced" || status === "skipped_silence" || status === "skipped_limit") {
    return "default";
  }
  if (status === "failed") return "danger";
  return "default";
}

function typeLabel(type: UnifiedAlertItem["type"]): string {
  if (type === "live") return "Live";
  return "Oferta";
}

function typeVariant(type: UnifiedAlertItem["type"]): "default" | "accent" {
  if (type === "live") return "accent";
  return "default";
}

export function AlertList({ opportunityAlerts, liveAlerts }: AlertListProps) {
  const alerts = useAlerts({ opportunityAlerts, liveAlerts });

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-bold text-accent-dark">Alertas recentes</h2>
        <p className="text-sm text-text-2">
          Lista unificada de alertas de ofertas e início de lives, do mais recente para o mais antigo.
        </p>
      </header>

      {alerts.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-bg px-4 py-10 text-center">
          <p className="text-sm font-semibold text-text-1">Ainda não há alertas para exibir</p>
          <p className="mt-1 text-sm text-text-3">
            Quando novas oportunidades ou lives forem detectadas, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {alerts.map((alert) => (
            <li key={`${alert.type}-${alert.id}`} className="rounded-xl border border-border bg-bg p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={typeVariant(alert.type)} size="sm">
                      <AppIcon
                        name={alert.type === "live" ? "video" : "bell"}
                        size={12}
                        className="shrink-0"
                      />
                      {typeLabel(alert.type)}
                    </Badge>
                    <Badge variant={statusVariant(alert.status)} size="sm">
                      {statusLabel(alert.status)}
                    </Badge>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-text-1">{alert.title}</p>
                  <p className="mt-1 text-xs text-text-3">{alert.subtitle || "Sem detalhes adicionais."}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium text-text-3">{formatDateTime(alert.createdAt)}</p>
                  {alert.actionUrl ? (
                    <Link
                      href={alert.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent-light underline-offset-2 hover:underline"
                    >
                      Abrir link
                      <AppIcon name="arrowUpRight" size={12} className="text-accent-light" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
