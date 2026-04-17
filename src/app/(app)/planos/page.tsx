import { redirect } from "next/navigation";

import { PlanComparison } from "@/features/plans/PlanComparison";
import { normalizePlan } from "@/lib/plan-limits";
import { createServerClient } from "@/lib/supabase/server";

type PlanosPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, rawSearchParams] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    searchParams,
  ]);

  const checkoutParam = rawSearchParams.checkout;
  const checkoutStatus =
    checkoutParam === "success" || checkoutParam === "cancelled" ? checkoutParam : null;

  return <PlanComparison currentPlan={normalizePlan(profile?.plan)} checkoutStatus={checkoutStatus} />;
}
