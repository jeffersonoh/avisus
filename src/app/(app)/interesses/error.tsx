"use client";

import { AppRouteErrorPanel } from "@/components/route-boundaries/AppRouteErrorPanel";

export default function InteressesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppRouteErrorPanel contextLabel="Interesses" error={error} reset={reset} />;
}
