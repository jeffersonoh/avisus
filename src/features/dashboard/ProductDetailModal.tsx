"use client";

import { useEffect, useId } from "react";

import { AppIcon } from "@/components/AppIcon";
import { cn } from "@/lib/cn";

import { discountPercent, formatBrl } from "./format";
import type { Opportunity } from "./types";

export type ProductDetailModalProps = {
  opportunity: Opportunity | null;
  open: boolean;
  onClose: () => void;
};

export function ProductDetailModal({ opportunity, open, onClose }: ProductDetailModalProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !opportunity) {
    return null;
  }

  const opp = opportunity;
  const discount = discountPercent(opp.price, opp.originalPrice);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-text-1/50 backdrop-blur-[2px]"
        aria-label="Fechar modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[61] flex max-h-[min(92vh,880px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl",
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-3">{opp.marketplace}</p>
            <h2 id={titleId} className="mt-1 text-lg font-bold leading-snug text-text-1">
              {opp.name}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-xl border border-border p-2 text-text-2 transition hover:bg-text-3/10"
            onClick={onClose}
            aria-label="Fechar"
          >
            <AppIcon name="x" size={18} />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <span className="font-mono text-3xl font-extrabold text-text-1">{formatBrl(opp.price)}</span>
            <span className="font-mono text-sm text-text-3 line-through">{formatBrl(opp.originalPrice)}</span>
            <span className="rounded-lg bg-accent/15 px-2 py-1 text-xs font-bold text-accent-dark dark:text-accent-light">
              -{discount}%
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border bg-text-3/5 p-3 dark:bg-text-3/10">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Categoria</dt>
              <dd className="mt-1 font-medium text-text-1">{opp.category}</dd>
            </div>
            <div className="rounded-xl border border-border bg-text-3/5 p-3 dark:bg-text-3/10">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Região</dt>
              <dd className="mt-1 font-medium text-text-1">
                {opp.region} — {opp.city}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-text-3/5 p-3 dark:bg-text-3/10">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Prazo</dt>
              <dd className="mt-1 font-medium text-text-1">{opp.expiresLabel}</dd>
            </div>
            <div className="rounded-xl border border-border bg-text-3/5 p-3 dark:bg-text-3/10">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Frete</dt>
              <dd className="mt-1 font-medium text-text-1">
                {opp.freightFree ? "Grátis" : formatBrl(opp.freight)}
              </dd>
            </div>
          </dl>

          <section>
            <h3 className="mb-2 text-sm font-bold text-text-1">Canais de revenda (RF-09.1)</h3>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-text-3/10 text-[11px] font-bold uppercase tracking-wide text-text-3">
                  <tr>
                    <th className="px-3 py-2">Canal</th>
                    <th className="px-3 py-2">Preço mercado</th>
                    <th className="px-3 py-2">Taxa</th>
                    <th className="px-3 py-2 text-right">Margem líq.</th>
                  </tr>
                </thead>
                <tbody>
                  {opp.channelMargins.map((row) => (
                    <tr key={row.channel} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-text-1">{row.channel}</td>
                      <td className="px-3 py-2 font-mono text-text-2">{formatBrl(row.marketPrice)}</td>
                      <td className="px-3 py-2 text-text-2">{(row.fee * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-success">{row.netMargin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <a
            href={opp.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Abrir anúncio
            <AppIcon name="arrowUpRight" size={16} className="text-white" />
          </a>
        </div>
      </div>
    </div>
  );
}
