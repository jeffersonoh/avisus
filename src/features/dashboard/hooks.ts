"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  parseDashboardSearchParamsFromEntries,
  serializeDashboardFilters,
  type DashboardFilters,
} from "./search-params";
import type { Opportunity } from "./types";

export function useFilters(initialFilters: DashboardFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFiltersState] = useState<DashboardFilters>(initialFilters);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFiltersState(parseDashboardSearchParamsFromEntries(searchParams.entries()));
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<DashboardFilters>) => {
      const current = parseDashboardSearchParamsFromEntries(searchParams.entries());
      const merged: DashboardFilters = { ...current, ...patch };
      const qs = serializeDashboardFilters(merged);
      startTransition(() => {
        router.replace(qs.length > 0 ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  return { filters, setFilters, isPending };
}

// Dados já filtrados pelo servidor; apenas aplica ordenação client-side dentro da página.
export function useOpportunities(
  opportunities: Opportunity[],
  filters: DashboardFilters,
): Opportunity[] {
  return useMemo(() => {
    const list = [...opportunities];
    if (filters.sort === "margin") {
      list.sort((a, b) => b.margin - a.margin);
    } else if (filters.sort === "discount") {
      list.sort(
        (a, b) =>
          Math.round((1 - b.price / b.originalPrice) * 100) -
          Math.round((1 - a.price / a.originalPrice) * 100),
      );
    } else {
      list.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    }
    return list;
  }, [opportunities, filters.sort]);
}
