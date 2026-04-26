import { AppRouteCardSkeleton } from "@/components/route-boundaries/AppRouteCardSkeleton";
import { DeferredRouteLoading } from "@/components/route-boundaries/DeferredRouteLoading";

export default function AlertasLoading() {
  return (
    <DeferredRouteLoading>
      <AppRouteCardSkeleton />
    </DeferredRouteLoading>
  );
}
