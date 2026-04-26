import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Destino após sessão válida: onboarding incompleto ou dashboard.
 */
export async function getPostAuthRedirectPath(
  supabase: SupabaseClient<Database>,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return "/dashboard";
  }

  return profile.onboarded ? "/dashboard" : "/onboarding";
}
