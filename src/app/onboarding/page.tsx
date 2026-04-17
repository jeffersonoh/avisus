import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { normalizePlan } from "@/lib/plan-limits";
import { createServerClient } from "@/lib/supabase/server";

type OnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function sanitizeRedirectTo(input: string | undefined): string {
  if (!input) {
    return "/dashboard";
  }

  if (!input.startsWith("/") || input.startsWith("//") || input.startsWith("/onboarding")) {
    return "/dashboard";
  }

  return input;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rawSearchParams = await searchParams;
  const redirectToParam = rawSearchParams.redirectTo;
  const redirectTo =
    typeof redirectToParam === "string" ? sanitizeRedirectTo(redirectToParam) : "/dashboard";

  const [{ data: profile }, { data: interestsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, onboarded, uf, city, alert_channels, telegram_username")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("interests")
      .select("id, term, active, created_at, last_scanned_at")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
  ]);

  if (profile?.onboarded) {
    redirect(redirectTo);
  }

  const initialInterests = (interestsData ?? []).map((item) => ({
    id: item.id,
    term: item.term,
    active: item.active,
    created_at: item.created_at,
    last_scanned_at: item.last_scanned_at,
  }));

  return (
    <OnboardingWizard
      plan={normalizePlan(profile?.plan)}
      redirectTo={redirectTo}
      initialInterests={initialInterests}
      initialUf={profile?.uf}
      initialCity={profile?.city}
      initialAlertChannels={profile?.alert_channels}
      initialTelegramUsername={profile?.telegram_username}
    />
  );
}
