"use client";

import { OpportunityList } from "@/features/dashboard/OpportunityList";
import type { DashboardFilterOptions } from "@/features/dashboard/db-query";
import type { DashboardFilters } from "@/features/dashboard/search-params";
import type { Opportunity } from "@/features/dashboard/types";

export type DashboardClientProps = {
  opportunities: Opportunity[];
  initialFilters: DashboardFilters;
  nextCursor: string | null;
  filterOptions: DashboardFilterOptions;
};

export function DashboardClient({ opportunities, initialFilters, nextCursor, filterOptions }: DashboardClientProps) {
  return (
    <OpportunityList
      opportunities={opportunities}
      initialFilters={initialFilters}
      nextCursor={nextCursor}
      categoryOptions={filterOptions.categories}
      regionOptions={filterOptions.regions}
    />
  );
}
