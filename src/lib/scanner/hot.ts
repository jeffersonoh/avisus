import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type HotRefreshResult = {
  refreshed: number;
};

export async function runHotRefresh(
  supabase: SupabaseClient<Database>,
): Promise<HotRefreshResult> {
  const { error: refreshError } = await supabase.rpc("refresh_hot_flags");
  if (refreshError) {
    throw new Error(`Failed to refresh hot flags: ${refreshError.message}`);
  }

  const { count, error: countError } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("hot", true);

  if (countError) {
    throw new Error(`Failed to count hot opportunities: ${countError.message}`);
  }

  return {
    refreshed: count ?? 0,
  };
}
