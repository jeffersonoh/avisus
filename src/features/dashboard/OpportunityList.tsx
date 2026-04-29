"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { Chip } from "@/components/Chip";
import { usePlan } from "@/lib/plan-context";

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
  const [accumulated, setAccumulated] = useState<Opportunity[]>(opportunities);
  const [cursor, setCursor] = useState<string | null>(nextCursor ?? null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const visible = useOpportunities(accumulated, filters);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

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

  const plan = usePlan();
  const planColor = PLAN_COLOR[plan];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const o of accumulated) set.add(o.category);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [accumulated]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const o of accumulated) set.add(o.region);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [accumulated]);

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
          {plan === "pro" ? "Planos" : "Upgrade"}
        </div>
      </Link>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
        ].map((stat) => {
          const helpId = `dashboard-stat-help-${stat.label
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}`;

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
                    className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-card p-3 text-left text-[11px] font-medium normal-case leading-snug tracking-normal text-text-2 opacity-0 shadow-lg transition group-hover/help:visible group-hover/help:opacity-100 group-focus-within/help:visible group-focus-within/help:opacity-100"
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
