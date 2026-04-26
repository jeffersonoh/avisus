type AppRouteCardSkeletonVariant = "dashboard" | "default";

export interface AppRouteCardSkeletonProps {
  variant?: AppRouteCardSkeletonVariant;
}

export function AppRouteCardSkeleton({ variant = "default" }: AppRouteCardSkeletonProps) {
  const titleBarClass =
    variant === "dashboard" ? "h-9 w-3/5 max-w-md sm:h-10" : "h-8 w-2/5 max-w-xs";

  return (
    <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="h-4 w-28 rounded-md bg-text-3/25" />
      <div className={`mt-4 rounded-md bg-text-3/25 ${titleBarClass}`} />
      <div className="mt-4 h-4 w-full max-w-xl rounded-md bg-text-3/20" />
      <div className="mt-2 h-4 w-full max-w-lg rounded-md bg-text-3/20" />
      <div className="mt-2 h-4 w-4/5 max-w-md rounded-md bg-text-3/15" />
    </section>
  );
}
