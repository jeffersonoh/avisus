"use client";

import Link from "next/link";

import { Toggle } from "@/components/Toggle";
import { getPlanLimit, isUnlimited, type Plan } from "@/lib/plan-limits";

import { ProfileCompleteness } from "./ProfileCompleteness";
import { RegionSelector } from "./RegionSelector";
import { useProfile, type ProfileAlertChannel } from "./hooks";

type ProfileFormProps = {
  plan: Plan;
  initialName: string;
  initialEmail: string;
  initialPhone: string | null;
  initialUf: string | null;
  initialCity: string | null;
  initialTelegramUsername: string | null;
  initialAlertChannels: string[];
};

const PLAN_LABEL: Record<Plan, string> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
};

function normalizeInitialChannels(channels: string[]): ProfileAlertChannel[] {
  const output = new Set<ProfileAlertChannel>();
  for (const channel of channels) {
    if (channel === "web" || channel === "telegram") {
      output.add(channel);
    }
  }

  if (output.size === 0) {
    output.add("web");
  }

  return [...output];
}

function formatLimit(value: number): string {
  return isUnlimited(value) ? "Ilimitado" : String(value);
}

export function ProfileForm({
  plan,
  initialName,
  initialEmail,
  initialPhone,
  initialUf,
  initialCity,
  initialTelegramUsername,
  initialAlertChannels,
}: ProfileFormProps) {
  const { profile, updateProfileField, toggleAlertChannel, isSaving, error, saveFeedback } = useProfile(
    {
      initialProfile: {
        name: initialName,
        email: initialEmail,
        phone: initialPhone ?? "",
        uf: initialUf ?? "",
        city: initialCity ?? "",
        telegramUsername: initialTelegramUsername ?? "",
        alertChannels: normalizeInitialChannels(initialAlertChannels),
        lgpdConsent: true,
      },
    },
  );

  const planCtaLabel = plan === "pro" ? "Planos" : "Upgrade";
  const maxInterests = getPlanLimit(plan, "maxInterests");
  const maxAlerts = getPlanLimit(plan, "maxAlertsPerDay");
  const maxSellers = getPlanLimit(plan, "maxFavoriteSellers");

  const canDisableWeb = !(profile.alertChannels.length === 1 && profile.alertChannels.includes("web"));
  const canDisableTelegram =
    !(profile.alertChannels.length === 1 && profile.alertChannels.includes("telegram"));

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">Perfil</p>
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Dados da conta e LGPD</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-2">
          Mantenha seu perfil atualizado para personalizar alertas e filtros de oportunidade.
        </p>
      </header>

      <ProfileCompleteness
        name={profile.name}
        email={profile.email}
        uf={profile.uf}
        city={profile.city}
        alertChannels={profile.alertChannels}
      />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-1">Informações essenciais</h2>
          <p className="text-sm font-semibold text-success" role="status" aria-live="polite">
            {saveFeedback || (isSaving ? "Salvando..." : "")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-text-2">Nome</span>
            <input
              value={profile.name}
              onChange={(event) => updateProfileField("name", event.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2"
            />
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-text-2">E-mail</span>
            <input
              value={profile.email}
              readOnly
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-2 outline-none"
            />
            <span className="text-xs text-text-3">O e-mail é gerenciado pelo login da conta.</span>
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-text-2">Telefone (opcional)</span>
            <input
              value={profile.phone}
              onChange={(event) => updateProfileField("phone", event.target.value)}
              placeholder="Ex.: +5548999999999"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2"
            />
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-text-2">Telegram (opcional)</span>
            <input
              value={profile.telegramUsername}
              onChange={(event) => updateProfileField("telegramUsername", event.target.value)}
              placeholder="@seuusuario"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2"
            />
          </label>
        </div>

        <div className="mt-4">
          <RegionSelector
            uf={profile.uf}
            city={profile.city}
            onUfChange={(nextUf) => {
              const normalizedUf = nextUf.trim().toUpperCase();
              updateProfileField("uf", normalizedUf);
              updateProfileField("city", "");
            }}
            onCityChange={(nextCity) => updateProfileField("city", nextCity)}
          />
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-bg p-4">
          <p className="text-sm font-medium text-text-1">Canais de alerta</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-2">Web</span>
            <Toggle
              checked={profile.alertChannels.includes("web")}
              onChange={(next) => toggleAlertChannel("web", next)}
              disabled={!canDisableWeb}
              aria-label="Canal web"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-2">Telegram</span>
            <Toggle
              checked={profile.alertChannels.includes("telegram")}
              onChange={(next) => toggleAlertChannel("telegram", next)}
              disabled={!canDisableTelegram}
              aria-label="Canal telegram"
            />
          </div>
          <p className="text-xs text-text-3">É necessário manter ao menos um canal ativo.</p>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-bg p-4">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={profile.lgpdConsent}
              onChange={(event) => updateProfileField("lgpdConsent", event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent-light/40"
            />
            <span className="text-sm text-text-2">
              Concordo com o uso dos meus dados para personalização de alertas, cálculo de frete e
              margem, conforme a LGPD. Leia a{" "}
              <Link
                href="https://avisus.app/politica-de-privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent-light underline-offset-2 hover:underline"
              >
                política de privacidade
              </Link>
              .
            </span>
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-danger/35 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text-2">Plano atual</p>
            <p className="mt-1 text-2xl font-bold text-accent-dark">{PLAN_LABEL[plan]}</p>
            <ul className="mt-3 space-y-1 text-sm text-text-2">
              <li>Interesses: {formatLimit(maxInterests)}</li>
              <li>Alertas por dia: {formatLimit(maxAlerts)}</li>
              <li>Vendedores favoritos: {formatLimit(maxSellers)}</li>
            </ul>
          </div>

          <Link
            href="/planos"
            className={`inline-flex rounded-xl px-4 py-2 text-sm font-semibold transition ${
              plan === "pro"
                ? "border border-border bg-bg text-text-2 hover:border-accent-light hover:text-text-1"
                : "bg-accent text-white hover:bg-accent-dark"
            }`}
          >
            {planCtaLabel}
          </Link>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm text-text-2">Quer personalizar seu cálculo de margem de revenda?</p>
          <Link
            href="/perfil/margem"
            className="mt-2 inline-flex text-sm font-semibold text-accent-light underline-offset-2 hover:underline"
          >
            Configurar taxas de margem
          </Link>
        </div>
      </section>
    </section>
  );
}
