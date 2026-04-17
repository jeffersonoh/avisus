import { DeferredRouteLoading } from "@/components/route-boundaries/DeferredRouteLoading";
import { OnboardingRouteSkeleton } from "@/components/route-boundaries/OnboardingRouteSkeleton";

export default function OnboardingLoading() {
  return (
    <DeferredRouteLoading>
      <OnboardingRouteSkeleton />
    </DeferredRouteLoading>
  );
}
