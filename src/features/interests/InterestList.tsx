"use client";

import Link from "next/link";
import { useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { BottomSheet } from "@/components/BottomSheet";
import { Chip } from "@/components/Chip";
import type { Plan } from "@/lib/plan-limits";

import { InterestForm } from "./InterestForm";
import {
  POPULAR_INTEREST_SUGGESTIONS,
  useInterests,
  type InterestActionResult,
  type InterestItem,
} from "./hooks";

export type InterestListProps = {
  plan: Plan;
  initialInterests: InterestItem[];
};

const PLAN_LABEL: Record<Plan, string> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
};

export function InterestList({ plan, initialInterests }: InterestListProps) {
  const {
    interests,
    maxInterests,
    unlimitedPlan,
    limitReached,
    remainingSlots,
    createInterest,
    updateInterest,
    deleteInterest,
  } = useInterests({ plan, initialInterests });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [upgradeSheetOpen, setUpgradeSheetOpen] = useState(false);

  const planLabel = PLAN_LABEL[plan];
  const usageLabel = unlimitedPlan
    ? `${interests.length} termos ativos · ilimitado no ${planLabel}`
    : `${interests.length}/${maxInterests} termos ativos · faltam ${remainingSlots} vagas`;

  async function handleCreate(term: string): Promise<InterestActionResult> {
    setFeedbackMessage(null);
    const result = await createInterest(term);
    if (!result.ok && result.reason === "limit") {
      setUpgradeSheetOpen(true);
    }
    return result;
  }

  async function handleUpdate(id: string, term: string): Promise<InterestActionResult> {
    setFeedbackMessage(null);
    const result = await updateInterest(id, term);
    if (result.ok) {
      setEditingId(null);
      setFeedbackMessage("Interesse atualizado com sucesso.");
    }
    return result;
  }

  async function handleDelete(id: string): Promise<void> {
    setFeedbackMessage(null);
    setDeletingId(id);
    const result = await deleteInterest(id);
    if (!result.ok) {
      setFeedbackMessage(result.message);
      setDeletingId(null);
      return;
    }

    if (editingId === id) {
      setEditingId(null);
    }

    setDeletingId(null);
  }

  async function handleSuggestion(term: string): Promise<void> {
    setFeedbackMessage(null);
    const result = await createInterest(term);
    if (!result.ok) {
      if (result.reason === "limit") {
        setUpgradeSheetOpen(true);
      } else {
        setFeedbackMessage(result.message);
      }
      return;
    }
    setFeedbackMessage(`"${term}" foi adicionado à sua lista.`);
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">Interesses</p>
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Perfil de monitoramento</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-2">
          Cadastre termos para direcionar o scanner. Edições e exclusões são aplicadas na hora e o
          limite do plano é respeitado durante o cadastro.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-text-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg px-2.5 py-1 text-xs font-semibold text-text-2">
            <AppIcon name="target" size={13} className="text-accent-light" />
            Plano {planLabel}
          </span>
          <span>{usageLabel}</span>
        </div>

        <InterestForm
          mode="create"
          submitLabel="Adicionar termo"
          onSubmit={handleCreate}
          onLimitReached={() => setUpgradeSheetOpen(true)}
        />

        {limitReached && !unlimitedPlan ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/35 bg-warning/10 px-3 py-2.5 text-sm text-warning">
            <p>Você atingiu o limite de {maxInterests} termos no plano atual.</p>
            <Link
              href="/planos"
              className="inline-flex items-center gap-1 font-semibold text-warning underline-offset-2 hover:underline"
            >
              Ver opções de upgrade
              <AppIcon name="arrowUpRight" size={14} className="text-warning" />
            </Link>
          </div>
        ) : null}
      </div>

      {feedbackMessage ? (
        <p className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-2" role="status">
          {feedbackMessage}
        </p>
      ) : null}

      {interests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <p className="text-base font-semibold text-text-1">Você ainda não tem termos cadastrados</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-text-2">
            Use sugestões populares para começar rápido e receber ofertas mais alinhadas ao seu nicho.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {POPULAR_INTEREST_SUGGESTIONS.map((term) => (
              <Chip key={term} label={term} icon="plus" onClick={() => void handleSuggestion(term)} />
            ))}
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {interests.map((interest) => {
            const isEditing = editingId === interest.id;
            const isDeleting = deletingId === interest.id;

            return (
              <li key={interest.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                {isEditing ? (
                  <InterestForm
                    mode="edit"
                    defaultValue={interest.term}
                    submitLabel="Salvar"
                    onSubmit={(term) => handleUpdate(interest.id, term)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-text-1">{interest.term}</p>
                      <p className="mt-1 text-xs text-text-3">Monitorando termo ativo para seu perfil.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(interest.id)}
                        disabled={Boolean(deletingId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-medium text-text-2 transition hover:border-accent-light hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <AppIcon name="sliders" size={14} className="text-text-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(interest.id)}
                        disabled={isDeleting || Boolean(deletingId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-danger/35 bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <AppIcon name="trash" size={14} className="text-danger" />
                        {isDeleting ? "Removendo..." : "Remover"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <BottomSheet
        isOpen={upgradeSheetOpen}
        onClose={() => setUpgradeSheetOpen(false)}
        title="Limite de interesses atingido"
        description={`Seu plano ${planLabel} já atingiu o teto de termos ativos.`}
      >
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            Para cadastrar novos termos, faça upgrade do plano e libere mais capacidade de monitoramento.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setUpgradeSheetOpen(false)}
              className="rounded-xl border border-border bg-bg px-4 py-2 text-sm font-medium text-text-2 transition hover:border-accent-light hover:text-text-1"
            >
              Agora não
            </button>
            <Link
              href="/planos"
              onClick={() => setUpgradeSheetOpen(false)}
              className="inline-flex items-center gap-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
            >
              Fazer upgrade
              <AppIcon name="arrowUpRight" size={14} className="text-white" />
            </Link>
          </div>
        </div>
      </BottomSheet>
    </section>
  );
}
