"use client";

import { Toggle } from "@/components/Toggle";

import {
  useNotificationSettings,
  type NotificationSettingsInput,
} from "./hooks";

type ChannelConfigProps = NotificationSettingsInput;

function hasChannel(channels: string[], channel: "telegram" | "web"): boolean {
  return channels.includes(channel);
}

export function ChannelConfig(props: ChannelConfigProps) {
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

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-bold text-accent-dark">Canais e silêncio</h2>
        <p className="text-sm text-text-2">
          Escolha onde receber alertas e defina seu horário de silêncio diário.
        </p>
      </header>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-bg px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-text-1">Telegram</p>
            <p className="text-xs text-text-3">Notificações do bot com link direto.</p>
          </div>
          <Toggle
            checked={hasChannel(channels, "telegram")}
            onChange={(next) => toggleChannel("telegram", next)}
            aria-label="Ativar alertas por Telegram"
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-bg px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-text-1">Web</p>
            <p className="text-xs text-text-3">Alertas exibidos no painel do Avisus.</p>
          </div>
          <Toggle
            checked={hasChannel(channels, "web")}
            onChange={(next) => toggleChannel("web", next)}
            aria-label="Ativar alertas na web"
            disabled={saving}
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-bg p-4">
        <p className="text-sm font-semibold text-text-1">Horário de silêncio</p>
        <p className="mt-1 text-xs text-text-3">Use formato 24h (HH:mm). Exemplo: 22:00 até 07:00.</p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-2">Início</span>
            <input
              type="time"
              value={silenceStart}
              onChange={(event) => setSilenceStart(event.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2"
              disabled={saving}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-text-2">Fim</span>
            <input
              type="time"
              value={silenceEnd}
              onChange={(event) => setSilenceEnd(event.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2"
              disabled={saving}
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-danger/35 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Salvando..." : "Salvar preferências"}
        </button>

        <p
          className="min-h-5 text-sm font-semibold text-success"
          role="status"
          aria-live="polite"
        >
          {saveFeedback}
        </p>
      </div>
    </section>
  );
}
