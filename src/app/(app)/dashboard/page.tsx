import { Suspense } from "react";

import { MOCK_OPPORTUNITIES } from "@/features/dashboard/mock-data";
import { parseDashboardSearchParams } from "@/features/dashboard/search-params";

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
  const initialFilters = parseDashboardSearchParams(raw);

  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardClient opportunities={MOCK_OPPORTUNITIES} initialFilters={initialFilters} />
    </Suspense>
  );
}
