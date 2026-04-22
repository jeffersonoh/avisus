import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { InterestList } from "@/features/interests/InterestList";
import type { InterestItem } from "@/features/interests/hooks";
import { normalizePlan } from "@/lib/plan-limits";
import { AUTH_USER_ID_HEADER } from "@/lib/supabase/middleware";
import { createServerClient } from "@/lib/supabase/server";

export default async function InteressesPage() {
  const userId = (await headers()).get(AUTH_USER_ID_HEADER);
  if (!userId) {
    redirect("/login");
  }

  const supabase = await createServerClient();

  const [{ data: profile }, { data: interestsData }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
    supabase
      .from("interests")
      .select("id, term, active, created_at, last_scanned_at")
      .eq("user_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false }),
  ]);

  const initialInterests: InterestItem[] = (interestsData ?? []).map((item) => ({
    id: item.id,
    term: item.term,
    active: item.active,
    created_at: item.created_at,
    last_scanned_at: item.last_scanned_at,
  }));

  return (
    <InterestList plan={normalizePlan(profile?.plan)} initialInterests={initialInterests} />
  );
}
