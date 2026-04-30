import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { fetchDashboardFilterOptions, fetchDashboardOpportunities } from "@/features/dashboard/db-query";
import { parseDashboardSearchParams } from "@/features/dashboard/search-params";
import { AUTH_USER_ID_HEADER } from "@/lib/supabase/middleware";
import { createServerClient } from "@/lib/supabase/server";

import { DashboardClient } from "./components";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function DashboardFallback() {
  return (
    <div className="animate-pulse space-y-6 rounded-2xl border border-border bg-card p-6">
      <div className="h-6 w-40 rounded bg-text-3/20" />
      <div className="h-10 w-2/3 max-w-md rounded bg-text-3/20" />
      <div className="h-32 rounded-xl bg-text-3/10" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-80 rounded-2xl bg-text-3/10" />
        <div className="h-80 rounded-2xl bg-text-3/10" />
        <div className="h-80 rounded-2xl bg-text-3/10" />
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const raw = await searchParams;
  const filters = parseDashboardSearchParams(raw);

  const userId = (await headers()).get(AUTH_USER_ID_HEADER);
  if (!userId) {
    redirect("/login");
  }

  const supabase = await createServerClient();
  const [{ opportunities, nextCursor }, filterOptions] = await Promise.all([
    fetchDashboardOpportunities(
      supabase,
      userId,
      filters,
      filters.cursor,
    ),
    fetchDashboardFilterOptions(supabase),
  ]);

  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardClient
        opportunities={opportunities}
        initialFilters={filters}
        nextCursor={nextCursor}
        filterOptions={filterOptions}
      />
    </Suspense>
  );
}
