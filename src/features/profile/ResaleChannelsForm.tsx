"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { z } from "zod";

import { calculateNetMarginPercent } from "@/lib/scanner/margin-calculator";

import { updateResaleSettings } from "./actions";

type ResaleMode = "average" | "custom";

type ResaleFees = {
  "Mercado Livre": number;
  "Magazine Luiza": number;
};

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
const SAMPLE_MARKET_PRICES = {
  "Mercado Livre": 179,
  "Magazine Luiza": 172,
} as const;

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

  const previewMargins = useMemo(() => {
    return {
      "Mercado Livre": calculateNetMarginPercent({
        cost: SAMPLE_COST,
        marketPrice: SAMPLE_MARKET_PRICES["Mercado Livre"],
        userFeePct: effectiveFees["Mercado Livre"],
      }),
      "Magazine Luiza": calculateNetMarginPercent({
        cost: SAMPLE_COST,
        marketPrice: SAMPLE_MARKET_PRICES["Magazine Luiza"],
        userFeePct: effectiveFees["Magazine Luiza"],
      }),
    };
  }, [effectiveFees]);

  function handleFeeChange(channel: keyof ResaleFees, value: string) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return;
    }

    setErrorMessage(null);
    setFees((prev) => ({
      ...prev,
      [channel]: numeric,
    }));
  }

  function handleSave() {
    setErrorMessage(null);

    const parsed = feeSchema.safeParse(fees);
    if (!parsed.success) {
      setErrorMessage("As taxas precisam estar entre 0% e 50%.");
      return;
    }

    startSaving(async () => {
      const result = await updateResaleSettings({
        mode,
        fees: parsed.data,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setSaveFeedback("Salvo");
    });
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">Perfil</p>
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Margem de revenda</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-2">
          Ajuste as taxas para simular margem com valores médios de mercado ou com suas taxas
          personalizadas.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("average")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "average"
                ? "bg-accent text-white"
                : "border border-border bg-bg text-text-2 hover:border-accent-light hover:text-text-1"
            }`}
          >
            Taxas médias
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "custom"
                ? "bg-accent text-white"
                : "border border-border bg-bg text-text-2 hover:border-accent-light hover:text-text-1"
            }`}
          >
            Taxas personalizadas
          </button>
        </div>

        <p className="mt-3 text-sm text-text-2">
          {mode === "average"
            ? "Você está usando estimativa com taxas médias de mercado."
            : "Você está usando suas taxas personalizadas para estimar margem."}
        </p>

        {mode === "custom" ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-text-2">Taxa Mercado Livre (%)</span>
              <input
                type="number"
                min={0}
                max={50}
                step={0.1}
                value={fees["Mercado Livre"]}
                onChange={(event) => handleFeeChange("Mercado Livre", event.target.value)}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-text-2">Taxa Magazine Luiza (%)</span>
              <input
                type="number"
                min={0}
                max={50}
                step={0.1}
                value={fees["Magazine Luiza"]}
                onChange={(event) => handleFeeChange("Magazine Luiza", event.target.value)}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-border bg-bg p-4">
            <p className="text-sm font-semibold text-text-1">Mercado Livre</p>
            <p className="mt-1 text-xs text-text-3">Taxa aplicada: {effectiveFees["Mercado Livre"]}%</p>
            <p className="mt-3 text-2xl font-bold text-success">{previewMargins["Mercado Livre"]}%</p>
          </article>

          <article className="rounded-xl border border-border bg-bg p-4">
            <p className="text-sm font-semibold text-text-1">Magazine Luiza</p>
            <p className="mt-1 text-xs text-text-3">Taxa aplicada: {effectiveFees["Magazine Luiza"]}%</p>
            <p className="mt-3 text-2xl font-bold text-success">{previewMargins["Magazine Luiza"]}%</p>
          </article>
        </div>

        <p className="mt-3 text-xs text-text-3">
          Fórmula aplicada: net_margin = ((market_price * (1 - fee/100)) - cost) / cost * 100
        </p>

        {errorMessage ? (
          <p className="mt-4 rounded-lg border border-danger/35 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Salvando..." : "Salvar configuração"}
          </button>

          <p className="text-sm font-semibold text-success" role="status" aria-live="polite">
            {saveFeedback}
          </p>
        </div>
      </div>

      <Link
        href="/perfil"
        className="inline-flex text-sm font-semibold text-accent-light underline-offset-2 hover:underline"
      >
        Voltar para perfil
      </Link>
    </section>
  );
}
