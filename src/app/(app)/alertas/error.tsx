"use client";

import { AppRouteErrorPanel } from "@/components/route-boundaries/AppRouteErrorPanel";

export default function AlertasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppRouteErrorPanel contextLabel="Alertas" error={error} reset={reset} />;
}
