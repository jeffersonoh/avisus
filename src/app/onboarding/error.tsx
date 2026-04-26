"use client";

import { AppRouteErrorPanel } from "@/components/route-boundaries/AppRouteErrorPanel";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-bg px-6 py-16 text-text-1">
      <div className="mx-auto w-full max-w-md">
        <AppRouteErrorPanel contextLabel="o onboarding" error={error} reset={reset} />
      </div>
    </main>
  );
}
