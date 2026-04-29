"use client";

import { AppRouteErrorPanel } from "@/components/route-boundaries/AppRouteErrorPanel";

export default function FavoritosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppRouteErrorPanel contextLabel="Lives" error={error} reset={reset} />;
}
