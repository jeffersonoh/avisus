import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PlanComparison } from "@/features/plans/PlanComparison";
import { normalizePlan } from "@/lib/plan-limits";
import { AUTH_USER_ID_HEADER } from "@/lib/supabase/middleware";
import { createServerClient } from "@/lib/supabase/server";

type PlanosPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const userId = (await headers()).get(AUTH_USER_ID_HEADER);
  if (!userId) {
    redirect("/login");
  }

  const supabase = await createServerClient();

  const [{ data: profile }, rawSearchParams] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
    searchParams,
  ]);

  const checkoutParam = rawSearchParams.checkout;
  const checkoutStatus =
    checkoutParam === "success" || checkoutParam === "cancelled" ? checkoutParam : null;

  return <PlanComparison currentPlan={normalizePlan(profile?.plan)} checkoutStatus={checkoutStatus} />;
}
