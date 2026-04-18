"use client";

import { Chip } from "@/components/Chip";
import { cn } from "@/lib/cn";

import type { DashboardFilters } from "./search-params";
import type { MarketplaceName } from "./types";

const MARKETPLACES: Array<MarketplaceName | "all"> = [
  "all",
  "Mercado Livre",
  "Magazine Luiza",
];

const DISCOUNT_OPTIONS: Array<{ id: DashboardFilters["discount"]; label: string }> = [
  { id: "all", label: "Qualquer" },
  { id: "d15", label: "≥ 15%" },
  { id: "d30", label: "≥ 30%" },
  { id: "d45", label: "≥ 45%" },
];

const MARGIN_OPTIONS: Array<{ id: DashboardFilters["margin"]; label: string }> = [
  { id: "all", label: "Qualquer" },
  { id: "m20", label: "≥ 20%" },
  { id: "m30", label: "≥ 30%" },
  { id: "m40", label: "≥ 40%" },
];

const SORT_OPTIONS: Array<{ id: DashboardFilters["sort"]; label: string }> = [
  { id: "margin", label: "Melhor margem" },
  { id: "discount", label: "Maior desconto" },
  { id: "date", label: "Mais recente" },
];

export type FilterPanelProps = {
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  categories: string[];
  regions: string[];
  className?: string;
};

export function FilterPanel({ filters, onChange, categories, regions, className }: FilterPanelProps) {
  return (
    <div className={cn("space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-3">Ordenação</p>
          <label htmlFor="dashboard-sort" className="sr-only">
            Ordenar oportunidades
          </label>
        </div>
        <select
          id="dashboard-sort"
          className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-medium text-text-1 sm:max-w-xs"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as DashboardFilters["sort"] })}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-3">Marketplace</p>
        <div className="flex flex-wrap gap-2">
          {MARKETPLACES.map((id) => (
            <Chip
              key={id}
              type="button"
              label={id === "all" ? "Todos" : id}
              active={filters.marketplace === id}
              onClick={() => onChange({ marketplace: id })}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-text-2">
          Categoria
          <select
            className="mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-1"
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            <option value="all">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-text-2">
          Região (UF)
          <select
            className="mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-1"
            value={filters.region}
            onChange={(e) => onChange({ region: e.target.value })}
          >
            <option value="all">Todas</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-3">Faixa de desconto</p>
        <div className="flex flex-wrap gap-2">
          {DISCOUNT_OPTIONS.map((o) => (
            <Chip
              key={o.id}
              type="button"
              label={o.label}
              active={filters.discount === o.id}
              onClick={() => onChange({ discount: o.id })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-3">Margem líquida</p>
        <div className="flex flex-wrap gap-2">
          {MARGIN_OPTIONS.map((o) => (
            <Chip
              key={o.id}
              type="button"
              label={o.label}
              active={filters.margin === o.id}
              onClick={() => onChange({ margin: o.id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
