"use client";

import Link from "next/link";
import { useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { Badge } from "@/components/Badge";
import { BottomSheet } from "@/components/BottomSheet";
import type { Plan } from "@/lib/plan-limits";

import { AddSellerForm } from "./AddSellerForm";
import { useFavoriteSellers, type FavoriteSellerActionResult, type FavoriteSellerItem } from "./hooks";

export type FavoriteSellerListProps = {
  plan: Plan;
  initialSellers: FavoriteSellerItem[];
};

const PLAN_LABEL: Record<Plan, string> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
};

function platformLabel(platform: FavoriteSellerItem["platform"]): string {
  return platform === "shopee" ? "Shopee" : "TikTok";
}

function platformVariant(platform: FavoriteSellerItem["platform"]): "default" | "accent" {
  return platform === "shopee" ? "default" : "accent";
}

function formatRelativeFromNow(value: string | null): string {
  if (!value) {
    return "Sem live recente";
  }

  const ms = Date.now() - Date.parse(value);
  if (Number.isNaN(ms) || ms < 0) {
    return "Agora";
  }

  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 1) {
    return "Agora";
  }

  if (minutes < 60) {
    return `Há ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Há ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `Há ${days} dia${days > 1 ? "s" : ""}`;
}

function formatTime(value: string | null): string {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function FavoriteSellerList({ plan, initialSellers }: FavoriteSellerListProps) {
  const {
    sellers,
    maxFavoriteSellers,
    unlimitedPlan,
    limitReached,
    remainingSlots,
    addSeller,
    removeSeller,
  } = useFavoriteSellers({ plan, initialSellers });

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [upgradeSheetOpen, setUpgradeSheetOpen] = useState(false);

  const planLabel = PLAN_LABEL[plan];
  const usageLabel = unlimitedPlan
    ? `${sellers.length} vendedores favoritados · ilimitado no ${planLabel}`
    : `${sellers.length}/${maxFavoriteSellers} vendedores favoritados · faltam ${remainingSlots} vagas`;

  async function handleAdd(url: string): Promise<FavoriteSellerActionResult> {
    setFeedbackMessage(null);
    const result = await addSeller(url);
    if (!result.ok && result.reason === "limit") {
      setUpgradeSheetOpen(true);
    }
    return result;
  }

  async function handleRemove(id: string): Promise<void> {
    setFeedbackMessage(null);
    setDeletingId(id);

    const result = await removeSeller(id);
    if (!result.ok) {
      setFeedbackMessage(result.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">Favoritos</p>
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Vendedores monitorados</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-2">
          Cadastre links de vendedores da Shopee e TikTok para acompanhar status offline/ao vivo.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-text-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg px-2.5 py-1 text-xs font-semibold text-text-2">
            <AppIcon name="heart" size={13} className="text-accent-light" />
            Plano {planLabel}
          </span>
          <span>{usageLabel}</span>
        </div>

        <AddSellerForm
          disabled={limitReached && !unlimitedPlan}
          onSubmit={handleAdd}
          onLimitReached={() => setUpgradeSheetOpen(true)}
          onSuccess={() => setFeedbackMessage("Vendedor adicionado com sucesso.")}
        />

        {limitReached && !unlimitedPlan ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/35 bg-warning/10 px-3 py-2.5 text-sm text-warning">
            <p>Você atingiu o limite de {maxFavoriteSellers} vendedores no plano atual.</p>
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

      {sellers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <p className="text-base font-semibold text-text-1">Você ainda não favoritou vendedores</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-text-2">
            Adicione vendedores por link para receber alertas quando eles entrarem ao vivo.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sellers.map((seller) => {
            const isDeleting = deletingId === seller.id;
            return (
              <li key={seller.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={platformVariant(seller.platform)} size="sm">
                        <AppIcon
                          name={seller.platform === "shopee" ? "bag" : "video"}
                          size={12}
                          className="shrink-0"
                        />
                        {platformLabel(seller.platform)}
                      </Badge>
                      {seller.is_live ? (
                        <Badge variant="danger" size="sm">
                          <AppIcon name="flame" size={12} className="shrink-0 text-danger" />
                          Ao vivo
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          <AppIcon name="clock" size={12} className="shrink-0" />
                          Offline
                        </Badge>
                      )}
                    </div>

                    <p className="truncate text-base font-semibold text-text-1">
                      {seller.seller_name?.trim() || `@${seller.seller_username}`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-3">
                      <span>{seller.is_live ? `Iniciou ${formatRelativeFromNow(seller.last_live_at)}` : formatRelativeFromNow(seller.last_live_at)}</span>
                      <span aria-hidden>•</span>
                      <span>Última verificação: {formatTime(seller.last_checked_at)}</span>
                    </div>

                    <Link
                      href={seller.seller_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent-light underline-offset-2 hover:underline"
                    >
                      Abrir perfil
                      <AppIcon name="arrowUpRight" size={12} className="text-accent-light" />
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRemove(seller.id)}
                    disabled={isDeleting || Boolean(deletingId)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-danger/35 bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <AppIcon name="trash" size={14} className="text-danger" />
                    {isDeleting ? "Removendo..." : "Remover"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <BottomSheet
        isOpen={upgradeSheetOpen}
        onClose={() => setUpgradeSheetOpen(false)}
        title="Limite de favoritos atingido"
        description={`Seu plano ${planLabel} já atingiu o teto de vendedores favoritados.`}
      >
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            Faça upgrade para adicionar mais vendedores e ampliar seus alertas de live.
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
