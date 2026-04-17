"use client";

import { OpportunityList } from "@/features/dashboard/OpportunityList";
import type { DashboardFilters } from "@/features/dashboard/search-params";
import type { Opportunity } from "@/features/dashboard/types";

export type DashboardClientProps = {
  opportunities: Opportunity[];
  initialFilters: DashboardFilters;
};

export function DashboardClient({ opportunities, initialFilters }: DashboardClientProps) {
  return <OpportunityList opportunities={opportunities} initialFilters={initialFilters} />;
}
