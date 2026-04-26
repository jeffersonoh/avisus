"use client";

import { AppRouteErrorPanel } from "@/components/route-boundaries/AppRouteErrorPanel";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppRouteErrorPanel contextLabel="o painel" error={error} reset={reset} />;
}
