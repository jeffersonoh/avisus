"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { filterAndSortOpportunities } from "./opportunity-filters";
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

  useEffect(() => {
    setFiltersState(parseDashboardSearchParamsFromEntries(searchParams.entries()));
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<DashboardFilters>) => {
      const current = parseDashboardSearchParamsFromEntries(searchParams.entries());
      const merged: DashboardFilters = { ...current, ...patch };
      const qs = serializeDashboardFilters(merged);
      router.replace(qs.length > 0 ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { filters, setFilters };
}

export function useOpportunities(
  opportunities: Opportunity[],
  filters: DashboardFilters,
): Opportunity[] {
  return useMemo(() => filterAndSortOpportunities(opportunities, filters), [opportunities, filters]);
}
