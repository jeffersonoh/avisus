"use client";

import { AppRouteErrorPanel } from "@/components/route-boundaries/AppRouteErrorPanel";

export default function PlanosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppRouteErrorPanel contextLabel="Planos" error={error} reset={reset} />;
}
