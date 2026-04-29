"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppIcon } from "@/components/AppIcon";
import { Toggle } from "@/components/Toggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  POPULAR_INTEREST_SUGGESTIONS,
  useInterests,
  type InterestItem,
} from "@/features/interests/hooks";
import { RegionSelector } from "@/features/profile/RegionSelector";
import type { Plan } from "@/lib/plan-limits";
import { btnPrimary, btnSecondary, hintBoxStyle, inputStyle, labelStyle } from "@/lib/styles";

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
    if (channel === "web" || channel === "telegram") set.add(channel);
  }
  if (set.size === 0) set.add("web");
  return [...set];
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
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customTerm, setCustomTerm] = useState("");
  const [deletingInterestId, setDeletingInterestId] = useState<string | null>(null);
  const [uf, setUf] = useState((initialUf ?? "").trim().toUpperCase());
  const [city, setCity] = useState(initialCity ?? "");
  const [alertChannels, setAlertChannels] = useState<WizardChannel[]>(
    normalizeChannels(initialAlertChannels),
  );
  const [telegramUsername, setTelegramUsername] = useState(initialTelegramUsername ?? "");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [isFinishing, startFinishing] = useTransition();

  const { interests, createInterest, deleteInterest, maxInterests, unlimitedPlan, limitReached } =
    useInterests({ plan, initialInterests });

  const stepTitles = ["Seus interesses", "Sua região", "Canal de alertas"];
  const stepSubtitles = [
    "Escolha o que você quer monitorar",
    "Localização para relevância de oportunidades",
    "Por onde você quer receber os alertas",
  ];

  function clearError() {
    if (errorMessage) setErrorMessage(null);
  }

  async function addCustomTerm() {
    const term = customTerm.trim();
    if (!term || limitReached) return;
    clearError();
    const result = await createInterest(term);
    if (result.ok) {
      setCustomTerm("");
    } else {
      setErrorMessage(result.message);
    }
  }

  async function handleSuggestion(term: string) {
    clearError();
    const result = await createInterest(term);
    if (!result.ok) setErrorMessage(result.message);
  }

  async function handleDeleteInterest(id: string) {
    clearError();
    setDeletingInterestId(id);
    const result = await deleteInterest(id);
    setDeletingInterestId(null);
    if (!result.ok) setErrorMessage(result.message);
  }

  function goBack() {
    clearError();
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }

  function goNext() {
    clearError();
    if (step === 1) {
      if (interests.length < 1) {
        setErrorMessage("Cadastre ao menos um interesse para continuar.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
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
      if (enabled) set.add(channel);
      else set.delete(channel);
      return set.size === 0 ? prev : [...set];
    });
  }

  function conclude() {
    if (!lgpdConsent) {
      setErrorMessage("Você precisa aceitar os termos LGPD para continuar.");
      return;
    }
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

  const canAdvance =
    step === 1 ? interests.length > 0 : step === 2 ? uf.trim().length === 2 && city.trim().length >= 2 : true;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme === "dark" ? "/assets/logo-dark-new.png" : "/assets/logo-light-new.png"}
            alt="Avisus"
            style={{ height: 180, objectFit: "contain" }}
          />
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28, padding: "0 4px" }}>
          {([1, 2, 3] as Step[]).map((n) => {
            const done = n < step;
            const active = n === step;
            return (
              <div
                key={n}
                style={{ display: "flex", alignItems: "center", flex: n < 3 ? 1 : "none" }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: done ? "var(--success)" : active ? "var(--accent)" : "var(--margin-block-bg)",
                    border: done || active ? "none" : "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: done || active ? "#fff" : "var(--text-3)",
                    transition: "all 0.3s",
                  }}
                >
                  {done ? <AppIcon name="check" size={14} stroke="#fff" /> : n}
                </div>
                {n < 3 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: done ? "var(--success)" : "var(--margin-block-bg)",
                      margin: "0 4px",
                      borderRadius: 1,
                      transition: "background 0.3s",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 24,
            padding: "28px 24px",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          {/* Card header */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--accent-light)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              Passo {step} de 3
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--text-1)",
                marginBottom: 6,
                fontFamily: "var(--font-display)",
              }}
            >
              {stepTitles[step - 1]}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>{stepSubtitles[step - 1]}</div>
          </div>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  value={customTerm}
                  onChange={(e) => setCustomTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void addCustomTerm()}
                  placeholder="Ex: Parafusadeira, PlayStation 5..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => void addCustomTerm()}
                  disabled={!customTerm.trim() || limitReached}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: !customTerm.trim() || limitReached ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-body)",
                    flexShrink: 0,
                    opacity: !customTerm.trim() || limitReached ? 0.5 : 1,
                  }}
                >
                  <AppIcon name="plus" size={14} stroke="#fff" />
                </button>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  fontWeight: 700,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                Sugestões populares
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {POPULAR_INTEREST_SUGGESTIONS.map((term) => {
                  const active = interests.some(
                    (i) => i.term.toLowerCase() === term.toLowerCase(),
                  );
                  return (
                    <button
                      key={term}
                      type="button"
                      onClick={() => !active && void handleSuggestion(term)}
                      disabled={active || (limitReached && !active)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: active || (limitReached && !active) ? "not-allowed" : "pointer",
                        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: active
                          ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                          : "var(--margin-block-bg)",
                        color: active ? "var(--accent)" : "var(--text-2)",
                        fontFamily: "var(--font-body)",
                        opacity: limitReached && !active ? 0.45 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {active && <AppIcon name="check" size={12} stroke="var(--accent)" />}
                      {term}
                    </button>
                  );
                })}
              </div>

              {interests.length > 0 && (
                <>
                  <div
                    style={{ ...hintBoxStyle("success"), padding: "10px 12px", borderRadius: 10, marginBottom: 10 }}
                  >
                    {interests.length}
                    {!unlimitedPlan ? `/${maxInterests}` : ""} selecionados:{" "}
                    {interests.map((i) => i.term).join(", ")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {interests.map((interest) => (
                      <div
                        key={interest.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--margin-block-bg)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text-1)",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          {interest.term}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteInterest(interest.id)}
                          disabled={deletingInterestId === interest.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border:
                              "1px solid color-mix(in srgb, var(--danger) 30%, var(--border))",
                            background: "color-mix(in srgb, var(--danger) 8%, transparent)",
                            cursor:
                              deletingInterestId === interest.id ? "not-allowed" : "pointer",
                            flexShrink: 0,
                            opacity: deletingInterestId === interest.id ? 0.6 : 1,
                          }}
                        >
                          <AppIcon name="x" size={12} stroke="var(--danger)" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {limitReached && !unlimitedPlan && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "color-mix(in srgb, var(--warning) 8%, var(--card))",
                    border: "1px solid color-mix(in srgb, var(--warning) 22%, var(--border))",
                    fontSize: 12,
                    color: "var(--warning)",
                  }}
                >
                  Limite do plano atingido ({maxInterests} interesses).
                </div>
              )}
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Web App */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: alertChannels.includes("web")
                    ? "1px solid color-mix(in srgb, var(--accent-light) 40%, var(--border))"
                    : "1px solid var(--border)",
                  background: alertChannels.includes("web")
                    ? "color-mix(in srgb, var(--accent-light) 6%, var(--card))"
                    : "var(--margin-block-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "color-mix(in srgb, var(--accent-light) 14%, transparent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppIcon name="monitor" size={18} stroke="var(--accent-light)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                      Web App
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                      Notificações no navegador
                    </div>
                  </div>
                </div>
                <Toggle
                  checked={alertChannels.includes("web")}
                  onChange={(next) => toggleChannel("web", next)}
                  aria-label="Canal web"
                />
              </div>

              {/* Telegram */}
              <div>
                <label style={labelStyle}>
                  Telegram (opcional)
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-3)",
                      pointerEvents: "none",
                    }}
                  >
                    <AppIcon name="send" size={16} />
                  </span>
                  <input
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="@seu_username"
                    style={{ ...inputStyle, paddingLeft: 42 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>
                  Informe seu @ se quiser. A entrega pelo Telegram é ativada no Perfil, conectando o bot do Avisus.
                </div>
              </div>

              {/* WhatsApp hint */}
              <div
                style={{ ...hintBoxStyle("warning"), padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                <AppIcon name="bell" size={14} stroke="var(--warning)" />
                WhatsApp disponível nos planos STARTER e PRO.
              </div>

              {/* Margin calculation hint */}
              <div
                style={{ ...hintBoxStyle("info"), padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                <AppIcon name="percent" size={14} stroke="var(--text-2)" />
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                    Cálculo da margem
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
                    Começamos com taxas médias por marketplace: Mercado Livre 15% e Magazine Luiza 16%.
                    Depois, ajuste esses valores em <strong>Perfil &gt; Margem de revenda</strong> para refletir as taxas reais do seu plano.
                  </div>
                </div>
              </div>

              {/* LGPD */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: lgpdConsent
                    ? "1px solid color-mix(in srgb, var(--success) 35%, var(--border))"
                    : "1px solid var(--border)",
                  background: "var(--margin-block-bg)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={(e) => {
                    clearError();
                    setLgpdConsent(e.target.checked);
                  }}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                  Li e concordo com o uso dos meus dados para personalização de alertas e cálculos
                  de margem/frete conforme LGPD.
                </span>
              </label>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div
              role="alert"
              style={{ ...hintBoxStyle("danger"), marginTop: 16, padding: "12px 14px", fontSize: 13 }}
            >
              {errorMessage}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={isFinishing}
                style={{ ...btnSecondary, cursor: isFinishing ? "not-allowed" : "pointer" }}
              >
                Voltar
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                style={{
                  ...btnPrimary,
                  flex: 1,
                  background: canAdvance ? "var(--accent)" : "var(--margin-block-bg)",
                  cursor: canAdvance ? "pointer" : "not-allowed",
                  opacity: canAdvance ? 1 : 0.65,
                }}
              >
                Próximo <AppIcon name="chevron-right" size={14} stroke="#fff" />
              </button>
            ) : (
              <button
                type="button"
                onClick={conclude}
                disabled={isFinishing || !lgpdConsent}
                style={{
                  ...btnPrimary,
                  flex: 1,
                  background: lgpdConsent ? "var(--accent)" : "var(--margin-block-bg)",
                  cursor: isFinishing || !lgpdConsent ? "not-allowed" : "pointer",
                  opacity: isFinishing || !lgpdConsent ? 0.65 : 1,
                }}
              >
                {isFinishing ? "Processando..." : "Começar a monitorar"}{" "}
                <AppIcon name="arrowUpRight" size={14} stroke="#fff" />
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-3)" }}>
          Você pode ajustar tudo isso depois nas configurações.
        </div>
      </div>
    </div>
  );
}
