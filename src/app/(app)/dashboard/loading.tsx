import { AppRouteCardSkeleton } from "@/components/route-boundaries/AppRouteCardSkeleton";
import { DeferredRouteLoading } from "@/components/route-boundaries/DeferredRouteLoading";

export default function DashboardLoading() {
  return (
    <DeferredRouteLoading>
      <AppRouteCardSkeleton variant="dashboard" />
    </DeferredRouteLoading>
  );
}
