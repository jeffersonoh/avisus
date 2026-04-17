"use client";

import { useMemo, useState } from "react";

import { useFilters, useOpportunities } from "./hooks";
import { FilterPanel } from "./FilterPanel";
import { ProductCard } from "./ProductCard";
import { ProductDetailModal } from "./ProductDetailModal";
import type { DashboardFilters } from "./search-params";
import type { Opportunity } from "./types";

export type OpportunityListProps = {
  opportunities: Opportunity[];
  initialFilters: DashboardFilters;
};

export function OpportunityList({ opportunities, initialFilters }: OpportunityListProps) {
  const { filters, setFilters } = useFilters(initialFilters);
  const visible = useOpportunities(opportunities, filters);
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const o of opportunities) {
      set.add(o.category);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [opportunities]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const o of opportunities) {
      set.add(o.region);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [opportunities]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">Oportunidades</p>
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Painel de ofertas</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-2">
          Filtros e ordenação refletem na URL para você compartilhar ou salvar atalhos. Dados mockados até a
          integração com Supabase.
        </p>
      </header>

      <FilterPanel filters={filters} onChange={setFilters} categories={categories} regions={regions} />

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-base font-semibold text-text-1">Nenhuma oportunidade com esses filtros</p>
          <p className="mt-2 text-sm text-text-2">Ajuste os filtros ou limpe a URL para ver todas as ofertas mockadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((opp, index) => (
            <ProductCard
              key={opp.id}
              opportunity={opp}
              index={index}
              onOpenDetail={() => setSelected(opp)}
            />
          ))}
        </div>
      )}

      <ProductDetailModal
        opportunity={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
