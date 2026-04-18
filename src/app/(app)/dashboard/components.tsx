"use client";

import { OpportunityList } from "@/features/dashboard/OpportunityList";
import type { DashboardFilters } from "@/features/dashboard/search-params";
import type { Opportunity } from "@/features/dashboard/types";

export type DashboardClientProps = {
  opportunities: Opportunity[];
  initialFilters: DashboardFilters;
  nextCursor: string | null;
};

export function DashboardClient({ opportunities, initialFilters, nextCursor }: DashboardClientProps) {
  return (
    <OpportunityList
      opportunities={opportunities}
      initialFilters={initialFilters}
      nextCursor={nextCursor}
    />
  );
}
