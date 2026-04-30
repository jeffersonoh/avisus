"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { Chip } from "@/components/Chip";

import { loadMoreOpportunities } from "./actions";
import { FilterPanel } from "./FilterPanel";
import { useFilters, useOpportunities } from "./hooks";
import { ProductCard } from "./ProductCard";
import { ProductDetailModal } from "./ProductDetailModal";
import { serializeDashboardFilters, type DashboardFilters } from "./search-params";
import type { Opportunity } from "./types";

export type OpportunityListProps = {
  opportunities: Opportunity[];
  initialFilters: DashboardFilters;
  nextCursor?: string | null;
  categoryOptions?: string[];
  regionOptions?: string[];
};

function FilterPendingSpinner() {
  return (
    <span
      aria-hidden
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid color-mix(in srgb, currentColor 30%, transparent)",
        borderTopColor: "currentColor",
        animation: "navPendingSpin 0.7s linear infinite",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export function OpportunityList({
  opportunities,
  initialFilters,
  nextCursor,
  categoryOptions = [],
  regionOptions = [],
}: OpportunityListProps) {
  const { filters, setFilters, isPending: filtersPending } = useFilters(initialFilters);
  const [accumulated, setAccumulated] = useState<Opportunity[]>(opportunities);
  const [cursor, setCursor] = useState<string | null>(nextCursor ?? null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const visible = useOpportunities(accumulated, filters);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [pendingFilterLabel, setPendingFilterLabel] = useState<string | null>(null);

  useEffect(() => {
    setAccumulated(opportunities);
    setCursor(nextCursor ?? null);
    setLoadError(null);
  }, [opportunities, nextCursor]);

  const filtersKey = useMemo(
    () => serializeDashboardFilters(filters),
    [filters],
  );

  const rawFiltersForAction = useMemo(
    () => ({
      marketplace: filters.marketplace,
      category: filters.category,
      discount: filters.discount,
      margin: filters.margin,
      region: filters.region,
      sort: filters.sort,
      myInterests: filters.myInterests ? "true" : undefined,
    }),
    [filters],
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const cursorRef = useRef(cursor);
  const filtersKeyRef = useRef(filtersKey);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    filtersKeyRef.current = filtersKey;
  }, [filtersKey]);

  useEffect(() => {
    if (!filtersPending) {
      setPendingFilterLabel(null);
    }
  }, [filtersPending]);

  const applyFilters = useCallback(
    (patch: Partial<DashboardFilters>, label: string) => {
      setPendingFilterLabel(label);
      setFilters(patch);
    },
    [setFilters],
  );

  const handleLoadMore = useCallback(async () => {
    if (loadingRef.current || !cursorRef.current) return;
    loadingRef.current = true;
    setIsLoadingMore(true);
    setLoadError(null);

    const snapshotFiltersKey = filtersKeyRef.current;
    const result = await loadMoreOpportunities(rawFiltersForAction, cursorRef.current);

    if (filtersKeyRef.current !== snapshotFiltersKey) {
      loadingRef.current = false;
      setIsLoadingMore(false);
      return;
    }

    if (!result.ok) {
      setLoadError("Não foi possível carregar mais oportunidades.");
      loadingRef.current = false;
      setIsLoadingMore(false);
      return;
    }

    setAccumulated((prev) => {
      const seen = new Set(prev.map((o) => o.id));
      const merged = [...prev];
      for (const opp of result.opportunities) {
        if (!seen.has(opp.id)) {
          merged.push(opp);
          seen.add(opp.id);
        }
      }
      return merged;
    });
    setCursor(result.nextCursor);
    loadingRef.current = false;
    setIsLoadingMore(false);
  }, [rawFiltersForAction]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    if (!cursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void handleLoadMore();
          }
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [cursor, handleLoadMore]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const category of categoryOptions) {
      if (category.trim()) set.add(category.trim());
    }
    for (const o of accumulated) {
      if (o.category.trim()) set.add(o.category.trim());
    }
    if (filters.category !== "all") {
      set.add(filters.category);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [accumulated, categoryOptions, filters.category]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const region of regionOptions) {
      if (region.trim()) set.add(region.trim().toUpperCase());
    }
    for (const o of accumulated) {
      if (o.region.trim()) set.add(o.region.trim().toUpperCase());
    }
    if (filters.region !== "all") {
      set.add(filters.region.toUpperCase());
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [accumulated, filters.region, regionOptions]);

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
    <div className="max-w-full min-w-0 overflow-x-clip space-y-4">
      {/* Search bar */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-3">
          <AppIcon name="search" size={16} />
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar em oportunidades..."
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
      </div>

      {/* Stats grid */}
      <div className="grid max-w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            label: "Ativas",
            value: displayed.length,
            accent: "var(--accent)",
            icon: "grid" as const,
            help: "Total de oportunidades visíveis após aplicar filtros e busca.",
          },
          {
            label: "Margem média",
            value: `${avgMargin}%`,
            accent: "var(--success)",
            icon: "trend" as const,
            help: "Média arredondada da melhor margem estimada das oportunidades visíveis.",
          },
          {
            label: "Frete grátis",
            value: freeShippingCount,
            accent: "var(--info)",
            icon: "truck" as const,
            help: "Quantidade de oportunidades visíveis marcadas com frete grátis.",
          },
          {
            label: "Em alta",
            value: hotCount,
            accent: "var(--warning)",
            icon: "flame" as const,
            help: "Quantidade de oportunidades visíveis marcadas como destaque HOT.",
          },
        ].map((stat, index) => {
          const helpId = `dashboard-stat-help-${stat.label
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}`;
          const tooltipPositionClass = stat.label === "Em alta"
            ? "right-0 sm:left-auto sm:right-0"
            : index % 2 === 1
              ? "right-0 sm:left-0 sm:right-auto"
              : "left-0";

          return (
            <div
              key={stat.label}
              className="relative flex items-center gap-2.5 rounded-[14px] border border-border bg-card px-3.5 py-3 shadow-sm"
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
                <div className="group/help relative mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3">
                  <span>{stat.label}</span>
                  <button
                    type="button"
                    aria-label={`Ajuda sobre ${stat.label}`}
                    aria-describedby={helpId}
                    title={stat.help}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-bg text-text-3 transition hover:text-text-1 focus:outline-none focus:ring-2 focus:ring-accent-light/40"
                  >
                    <AppIcon name="info" size={10} />
                  </button>
                  <span
                    id={helpId}
                    role="tooltip"
                    className={`${tooltipPositionClass} pointer-events-none invisible absolute top-full z-20 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 text-left text-[11px] font-medium normal-case leading-snug tracking-normal text-text-2 opacity-0 shadow-lg transition group-hover/help:visible group-hover/help:opacity-100 group-focus-within/help:visible group-focus-within/help:opacity-100`}
                  >
                    {stat.help}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline filter bar */}
      <section
        className="max-w-full min-w-0 rounded-[20px] border border-border bg-card p-2.5 shadow-sm sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
        aria-busy={filtersPending}
        aria-label="Filtros de oportunidades"
      >
        <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2 sm:mb-2">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-text-3">
              Filtros rápidos
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-text-3 sm:hidden">
              Ajuste marketplace, interesse e ordenação.
            </div>
          </div>

          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <span className="rounded-[9px] border border-border bg-bg px-2.5 py-1 text-[11px] font-bold text-text-2">
              {displayed.length} ofertas
            </span>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                disabled={filtersPending}
                onClick={() =>
                  applyFilters(
                    {
                      marketplace: "all",
                      category: "all",
                      discount: "all",
                      margin: "all",
                      region: "all",
                      sort: "margin",
                      myInterests: false,
                    },
                    "Limpar",
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-bg px-2.5 py-1 text-[11px] font-bold text-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {filtersPending && pendingFilterLabel === "Limpar" ? (
                  <>
                    <FilterPendingSpinner />
                    Processando…
                  </>
                ) : (
                  "Limpar"
                )}
              </button>
            )}
            <button
              type="button"
              disabled={filtersPending}
              onClick={() => setFiltersExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-[11px] px-3 py-1.5 text-[12px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                border: `1px solid color-mix(in srgb, var(--accent-light) 42%, var(--border))`,
                background: filtersExpanded
                  ? `color-mix(in srgb, var(--accent-light) 18%, var(--card))`
                  : `color-mix(in srgb, var(--accent-light) 10%, var(--card))`,
                color: "var(--accent-light)",
              }}
            >
              {filtersPending && pendingFilterLabel === "Filtros" ? (
                <>
                  <FilterPendingSpinner />
                  Processando…
                </>
              ) : (
                <>
                  <AppIcon name="sliders" size={13} />
                  Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
                  <AppIcon name={filtersExpanded ? "chevronUp" : "chevronDown"} size={12} />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid max-w-full min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="rounded-[16px] border border-border bg-bg p-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text-3 sm:hidden">
              Marketplace
            </div>
            <div className="flex max-w-full min-w-0 flex-wrap gap-1.5">
              {MARKETPLACE_FILTERS.map((f) => (
                <Chip
                  key={f.id}
                  type="button"
                  size="sm"
                  className="justify-center"
                  label={filtersPending && pendingFilterLabel === f.label ? "Processando…" : f.label}
                  icon={filtersPending && pendingFilterLabel === f.label ? <FilterPendingSpinner /> : undefined}
                  active={filters.marketplace === f.id}
                  disabled={filtersPending}
                  onClick={() => applyFilters({ marketplace: f.id }, f.label)}
                />
              ))}
            </div>
          </div>

          <div className="grid max-w-full min-w-0 gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
            <div className="rounded-[16px] border border-border bg-bg p-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text-3 sm:hidden">
                Preferências
              </div>
              <div className="flex max-w-full min-w-0 flex-wrap gap-1.5">
                <Chip
                  type="button"
                  size="sm"
                  className="justify-center"
                  label={filtersPending && pendingFilterLabel === "Meus interesses" ? "Processando…" : "Meus interesses"}
                  icon={filtersPending && pendingFilterLabel === "Meus interesses" ? <FilterPendingSpinner /> : undefined}
                  active={filters.myInterests}
                  disabled={filtersPending}
                  onClick={() => applyFilters({ myInterests: !filters.myInterests, cursor: undefined }, "Meus interesses")}
                />
              </div>
            </div>

            <div className="rounded-[16px] border border-border bg-bg p-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text-3 sm:hidden">
                Ordenar
              </div>
              <div className="flex max-w-full min-w-0 flex-wrap gap-1.5">
                {SORT_CHIPS.map((s) => (
                  <Chip
                    key={s.id}
                    type="button"
                    size="sm"
                    className="justify-center"
                    label={filtersPending && pendingFilterLabel === s.label ? "Processando…" : s.label}
                    icon={filtersPending && pendingFilterLabel === s.label ? <FilterPendingSpinner /> : undefined}
                    active={filters.sort === s.id}
                    disabled={filtersPending}
                    onClick={() => applyFilters({ sort: s.id }, s.label)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable filter panel */}
      {filtersExpanded && (
        <FilterPanel
          filters={filters}
          onChange={(patch) => applyFilters(patch, "Filtros")}
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
        <div className="grid max-w-full min-w-0 grid-cols-1 gap-[18px] overflow-x-clip sm:grid-cols-2 xl:grid-cols-3">
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

      {cursor && (
        <div
          ref={sentinelRef}
          aria-hidden
          className="flex items-center justify-center pt-2"
          style={{ minHeight: 80 }}
        >
          {isLoadingMore ? (
            <div
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-2 text-sm font-medium text-text-3"
            >
              <span
                aria-hidden
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "2px solid color-mix(in srgb, var(--accent-light) 30%, transparent)",
                  borderTopColor: "var(--accent-light)",
                  animation: "navPendingSpin 0.7s linear infinite",
                  display: "inline-block",
                }}
              />
              Carregando mais oportunidades…
            </div>
          ) : loadError ? (
            <button
              type="button"
              onClick={() => {
                void handleLoadMore();
              }}
              className="inline-flex items-center gap-2 rounded-[14px] border border-border bg-card px-5 py-2.5 text-sm font-semibold text-danger shadow-sm transition hover:brightness-95"
            >
              <AppIcon name="chevronDown" size={15} stroke="var(--danger)" />
              {loadError} Tentar novamente
            </button>
          ) : (
            <span aria-hidden className="block h-1 w-1" />
          )}
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
