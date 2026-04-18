"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { Chip } from "@/components/Chip";

import { FilterPanel } from "./FilterPanel";
import { useFilters, useOpportunities } from "./hooks";
import { ProductCard } from "./ProductCard";
import { ProductDetailModal } from "./ProductDetailModal";
import type { DashboardFilters } from "./search-params";
import type { Opportunity } from "./types";

export type OpportunityListProps = {
  opportunities: Opportunity[];
  initialFilters: DashboardFilters;
  nextCursor?: string | null;
};

const PLAN_COLOR: Record<string, string> = {
  free: "#7B42C9",
  starter: "#D4A017",
  pro: "#2E8B57",
};

const PLAN_LABEL: Record<string, string> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
};

const PLAN_SCAN: Record<string, string> = {
  free: "Scan 2h",
  starter: "Scan 30min",
  pro: "Scan 5min",
};

export function OpportunityList({ opportunities, initialFilters, nextCursor }: OpportunityListProps) {
  const { filters, setFilters } = useFilters(initialFilters);
  const visible = useOpportunities(opportunities, filters);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const plan = "free";
  const planColor = PLAN_COLOR[plan];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const o of opportunities) set.add(o.category);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [opportunities]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const o of opportunities) set.add(o.region);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [opportunities]);

  const displayed = useMemo(() => {
    if (!searchQuery.trim()) return visible;
    const q = searchQuery.trim().toLowerCase();
    return visible.filter((o) => o.name.toLowerCase().includes(q));
  }, [visible, searchQuery]);

  const avgMargin = useMemo(() => {
    if (!displayed.length) return 0;
    return Math.round(displayed.reduce((s, o) => s + o.margin, 0) / displayed.length);
  }, [displayed]);

  const freeShippingCount = useMemo(
    () => displayed.filter((o) => o.freightFree).length,
    [displayed],
  );

  const hotCount = useMemo(() => displayed.filter((o) => o.hot).length, [displayed]);

  const activeFiltersCount = [
    filters.marketplace !== "all",
    filters.category !== "all",
    filters.discount !== "all",
    filters.margin !== "all",
    filters.region !== "all",
    filters.sort !== "margin",
    filters.myInterests,
  ].filter(Boolean).length;

  const MARKETPLACE_FILTERS = [
    { id: "all" as const, label: "Todos" },
    { id: "Mercado Livre" as const, label: "Mercado Livre" },
    { id: "Magazine Luiza" as const, label: "Magalu" },
  ];

  const SORT_CHIPS = [
    { id: "margin" as const, label: "Maior margem" },
    { id: "discount" as const, label: "Maior desconto" },
    { id: "date" as const, label: "Mais recente" },
  ];

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-3">
          <AppIcon name="target" size={16} />
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar no catálogo… ex: PlayStation, Nike, JBL"
          className="w-full rounded-[14px] border border-border bg-card py-3.5 pl-10 pr-10 text-sm text-text-1 shadow-sm outline-none ring-accent-light/40 transition focus:ring-2"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-3 flex items-center text-text-3"
          >
            <AppIcon name="x" size={16} />
          </button>
        )}
        <p className="mt-1.5 text-[11px] leading-snug text-text-3">
          Listagens com envio no Brasil. Links abrem a busca no marketplace.
        </p>
      </div>

      {/* Plan status strip */}
      <Link
        href="/planos"
        className="flex items-center justify-between rounded-[14px] px-4 py-2.5 transition hover:brightness-95"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${planColor} 10%, var(--card)), color-mix(in srgb, ${planColor} 4%, var(--card)))`,
          border: `1px solid color-mix(in srgb, ${planColor} 25%, var(--border))`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg"
            style={{ background: `color-mix(in srgb, ${planColor} 16%, transparent)` }}
          >
            <AppIcon name="crown" size={15} stroke={planColor} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-extrabold tracking-[0.04em]" style={{ color: planColor }}>
                {PLAN_LABEL[plan]}
              </span>
              <span className="text-[11px] font-medium text-text-3">
                • 5 termos • {PLAN_SCAN[plan]}
              </span>
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-bold"
          style={{
            background: `color-mix(in srgb, ${planColor} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${planColor} 25%, transparent)`,
            color: planColor,
          }}
        >
          <AppIcon name="zap" size={11} stroke={planColor} />
          Upgrade
        </div>
      </Link>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Ativas", value: displayed.length, accent: "var(--accent)", icon: "grid" as const },
          { label: "Margem", value: `${avgMargin}%`, accent: "var(--success)", icon: "trend" as const },
          { label: "Frete grátis", value: freeShippingCount, accent: "var(--info)", icon: "truck" as const },
          { label: "Em alta", value: hotCount, accent: "var(--warning)", icon: "flame" as const },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2.5 rounded-[14px] border border-border bg-card px-3.5 py-3 shadow-sm"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
              style={{
                background: `color-mix(in srgb, ${stat.accent} 14%, transparent)`,
                border: `1px solid color-mix(in srgb, ${stat.accent} 28%, transparent)`,
              }}
            >
              <AppIcon name={stat.icon} size={16} stroke={stat.accent} />
            </div>
            <div className="min-w-0">
              <div
                className="text-xl font-extrabold leading-none text-text-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {stat.value}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inline filter bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5">
            {MARKETPLACE_FILTERS.map((f) => (
              <Chip
                key={f.id}
                type="button"
                label={f.label}
                active={filters.marketplace === f.id}
                onClick={() => setFilters({ marketplace: f.id })}
              />
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-[8px] border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-text-2">
              {displayed.length}
            </span>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    marketplace: "all",
                    category: "all",
                    discount: "all",
                    margin: "all",
                    region: "all",
                    sort: "margin",
                    myInterests: false,
                  })
                }
                className="rounded-[8px] border border-border bg-card px-2 py-1 text-[11px] font-semibold text-accent-dark"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-[12px] font-bold text-accent-dark transition"
              style={{
                border: `1px solid color-mix(in srgb, var(--accent) 22%, var(--border))`,
                background: filtersExpanded
                  ? `color-mix(in srgb, var(--accent) 12%, var(--card))`
                  : `color-mix(in srgb, var(--accent) 6%, var(--card))`,
              }}
            >
              <AppIcon name="sliders" size={13} />
              Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
              <AppIcon name={filtersExpanded ? "chevronUp" : "chevronDown"} size={12} />
            </button>
          </div>
        </div>

        {/* Sort + interests chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <Chip
            type="button"
            label="Meus interesses"
            active={filters.myInterests}
            onClick={() => setFilters({ myInterests: !filters.myInterests, cursor: undefined })}
          />
          <span className="self-center text-text-3/40">|</span>
          {SORT_CHIPS.map((s) => (
            <Chip
              key={s.id}
              type="button"
              label={s.label}
              active={filters.sort === s.id}
              onClick={() => setFilters({ sort: s.id })}
            />
          ))}
        </div>
      </div>

      {/* Expandable filter panel */}
      {filtersExpanded && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          categories={categories}
          regions={regions}
        />
      )}

      {/* Product grid */}
      {displayed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-base font-semibold text-text-1">
            Nenhuma oportunidade com esses filtros
          </p>
          <p className="mt-2 text-sm text-text-2">
            Ajuste os filtros ou limpe a URL para ver todas as ofertas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
          {displayed.map((opp, index) => (
            <ProductCard
              key={opp.id}
              opportunity={opp}
              index={index}
              onOpenDetail={() => setSelected(opp)}
            />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Link
            href={`/dashboard?${new URLSearchParams({
              ...(filters.marketplace !== "all" ? { marketplace: filters.marketplace } : {}),
              ...(filters.category !== "all" ? { category: filters.category } : {}),
              ...(filters.discount !== "all" ? { discount: filters.discount } : {}),
              ...(filters.margin !== "all" ? { margin: filters.margin } : {}),
              ...(filters.region !== "all" ? { region: filters.region } : {}),
              ...(filters.sort !== "margin" ? { sort: filters.sort } : {}),
              cursor: nextCursor,
            }).toString()}`}
            className="inline-flex items-center gap-2 rounded-[14px] border border-border bg-card px-5 py-2.5 text-sm font-semibold text-text-1 shadow-sm transition hover:brightness-95"
          >
            <AppIcon name="chevronDown" size={15} />
            Carregar mais
          </Link>
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
