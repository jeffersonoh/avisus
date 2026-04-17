"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { AppIcon } from "@/components/AppIcon";
import { Chip } from "@/components/Chip";
import { Toggle } from "@/components/Toggle";
import { InterestForm } from "@/features/interests/InterestForm";
import {
  POPULAR_INTEREST_SUGGESTIONS,
  useInterests,
  type InterestActionResult,
  type InterestItem,
} from "@/features/interests/hooks";
import { RegionSelector } from "@/features/profile/RegionSelector";
import type { Plan } from "@/lib/plan-limits";

import { finishOnboarding } from "./actions";

type OnboardingWizardProps = {
  plan: Plan;
  redirectTo?: string;
  initialInterests: InterestItem[];
  initialUf?: string | null;
  initialCity?: string | null;
  initialAlertChannels?: string[];
  initialTelegramUsername?: string | null;
};

type Step = 1 | 2 | 3;

type WizardChannel = "web" | "telegram";

function normalizeChannels(input: string[] | undefined): WizardChannel[] {
  const set = new Set<WizardChannel>();
  for (const channel of input ?? []) {
    if (channel === "web" || channel === "telegram") {
      set.add(channel);
    }
  }

  if (set.size === 0) {
    set.add("web");
  }

  return [...set];
}

function stepPercent(step: Step): number {
  if (step === 1) return 33;
  if (step === 2) return 66;
  return 100;
}

export function OnboardingWizard({
  plan,
  redirectTo,
  initialInterests,
  initialUf,
  initialCity,
  initialAlertChannels,
  initialTelegramUsername,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingInterestId, setDeletingInterestId] = useState<string | null>(null);
  const [uf, setUf] = useState((initialUf ?? "").trim().toUpperCase());
  const [city, setCity] = useState(initialCity ?? "");
  const [alertChannels, setAlertChannels] = useState<WizardChannel[]>(
    normalizeChannels(initialAlertChannels),
  );
  const [telegramUsername, setTelegramUsername] = useState(initialTelegramUsername ?? "");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [isFinishing, startFinishing] = useTransition();

  const {
    interests,
    createInterest,
    deleteInterest,
    maxInterests,
    unlimitedPlan,
    limitReached,
  } = useInterests({
    plan,
    initialInterests,
  });

  const stepTitle = useMemo(() => {
    if (step === 1) return "Passo 1 de 3 - Interesses";
    if (step === 2) return "Passo 2 de 3 - Região";
    return "Passo 3 de 3 - Alertas e LGPD";
  }, [step]);

  function clearError() {
    if (errorMessage) {
      setErrorMessage(null);
    }
  }

  async function handleAddInterest(term: string): Promise<InterestActionResult> {
    clearError();
    const result = await createInterest(term);
    if (!result.ok) {
      setErrorMessage(result.message);
    }
    return result;
  }

  async function handleSuggestion(term: string): Promise<void> {
    clearError();
    const result = await createInterest(term);
    if (!result.ok) {
      setErrorMessage(result.message);
    }
  }

  async function handleDeleteInterest(id: string): Promise<void> {
    clearError();
    setDeletingInterestId(id);
    const result = await deleteInterest(id);
    setDeletingInterestId(null);
    if (!result.ok) {
      setErrorMessage(result.message);
    }
  }

  function goBack() {
    clearError();
    if (step > 1) {
      setStep((prev) => (prev === 3 ? 2 : 1));
    }
  }

  function goNext() {
    clearError();

    if (step === 1) {
      if (interests.length < 1) {
        setErrorMessage("Cadastre ao menos um interesse para continuar.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (uf.trim().length !== 2 || city.trim().length < 2) {
        setErrorMessage("Selecione UF e cidade para avançar.");
        return;
      }
      setStep(3);
    }
  }

  function toggleChannel(channel: WizardChannel, enabled: boolean) {
    clearError();

    setAlertChannels((prev) => {
      const set = new Set<WizardChannel>(prev);
      if (enabled) {
        set.add(channel);
      } else {
        set.delete(channel);
      }

      if (set.size === 0) {
        return prev;
      }

      return [...set];
    });
  }

  function conclude() {
    clearError();

    startFinishing(async () => {
      const result = await finishOnboarding({
        redirectTo,
        uf,
        city,
        alertChannels,
        telegramUsername,
        lgpdConsent,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      router.push(result.redirectTo);
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-text-1 sm:px-6 sm:py-14">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">Onboarding Avisus</p>
          <h1 className="text-2xl font-bold text-accent-dark">{stepTitle}</h1>
          <div className="h-2 overflow-hidden rounded-full bg-text-3/20">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${stepPercent(step)}%` }}
            />
          </div>
        </header>

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-text-2">
              Cadastre os termos que você quer monitorar para começar a receber oportunidades relevantes.
            </p>

            <InterestForm
              mode="create"
              submitLabel="Adicionar interesse"
              onSubmit={handleAddInterest}
            />

            {limitReached && !unlimitedPlan ? (
              <p className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-sm text-warning">
                Você atingiu o limite do plano atual ({maxInterests} interesses).
              </p>
            ) : null}

            {interests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-bg px-4 py-5 text-center">
                <p className="text-sm font-semibold text-text-1">Sem interesses ainda</p>
                <p className="mt-1 text-sm text-text-3">
                  Use as sugestões populares para acelerar seu primeiro alerta.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {POPULAR_INTEREST_SUGGESTIONS.map((term) => (
                    <Chip
                      key={term}
                      label={term}
                      icon="plus"
                      onClick={() => void handleSuggestion(term)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {interests.map((interest) => (
                  <li
                    key={interest.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg px-3 py-2"
                  >
                    <span className="truncate text-sm font-medium text-text-1">{interest.term}</span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteInterest(interest.id)}
                      disabled={deletingInterestId === interest.id}
                      className="inline-flex items-center gap-1 rounded-md border border-danger/35 bg-danger/10 px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <AppIcon name="trash" size={12} className="text-danger" />
                      {deletingInterestId === interest.id ? "Removendo..." : "Remover"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-text-2">
              Defina sua região para melhorar os cálculos de frete e relevância das oportunidades.
            </p>

            <RegionSelector
              uf={uf}
              city={city}
              onUfChange={(nextUf) => {
                setUf(nextUf.trim().toUpperCase());
                setCity("");
              }}
              onCityChange={setCity}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-text-2">
              Escolha onde receber alertas e confirme o consentimento LGPD para concluir o cadastro.
            </p>

            <div className="space-y-3 rounded-xl border border-border bg-bg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-2">Canal Web</span>
                <Toggle
                  checked={alertChannels.includes("web")}
                  onChange={(next) => toggleChannel("web", next)}
                  aria-label="Canal web"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-text-2">Telegram</span>
                <Toggle
                  checked={alertChannels.includes("telegram")}
                  onChange={(next) => toggleChannel("telegram", next)}
                  aria-label="Canal telegram"
                />
              </div>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-text-2">Telegram username (opcional)</span>
                <input
                  value={telegramUsername}
                  onChange={(event) => setTelegramUsername(event.target.value)}
                  placeholder="@seuusuario"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2"
                />
              </label>
            </div>

            <label className="flex items-start gap-2 rounded-xl border border-border bg-bg p-4">
              <input
                type="checkbox"
                checked={lgpdConsent}
                onChange={(event) => {
                  clearError();
                  setLgpdConsent(event.target.checked);
                }}
                className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent-light/40"
              />
              <span className="text-sm text-text-2">
                Li e concordo com o uso dos meus dados para personalização de alertas e cálculos de
                margem/frete conforme LGPD.
              </span>
            </label>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1 || isFinishing}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-bg px-4 py-2 text-sm font-medium text-text-2 transition hover:border-accent-light hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AppIcon name="arrow-left" size={14} className="text-text-3" />
            Voltar
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
            >
              Próximo
              <AppIcon name="arrowUpRight" size={14} className="text-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={conclude}
              disabled={isFinishing}
              className="inline-flex items-center gap-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isFinishing ? "Concluindo..." : "Concluir onboarding"}
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}
