import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type CleanupResult = {
  expired: number;
  deletedPriceHistory: number;
  deletedOpportunities: number;
};

type CleanupDependencies = {
  now?: () => Date;
};

function daysAgo(reference: Date, days: number): string {
  return new Date(reference.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function runCleanupJob(
  supabase: SupabaseClient<Database>,
  dependencies: CleanupDependencies = {},
): Promise<CleanupResult> {
  const now = (dependencies.now ?? (() => new Date()))();
  const nowIso = now.toISOString();
  const ninetyDaysAgoIso = daysAgo(now, 90);
  const thirtyDaysAgoIso = daysAgo(now, 30);

  const expireResult = await supabase
    .from("opportunities")
    .update({ status: "expired" })
    .not("status", "eq", "expired")
    .lt("expires_at", nowIso)
    .select("id");

  if (expireResult.error) {
    throw new Error(`Cleanup failed while expiring opportunities: ${expireResult.error.message}`);
  }

  const deleteHistoryResult = await supabase
    .from("price_history")
    .delete()
    .lt("recorded_at", ninetyDaysAgoIso)
    .select("id");

  if (deleteHistoryResult.error) {
    throw new Error(`Cleanup failed while deleting price_history: ${deleteHistoryResult.error.message}`);
  }

  const deleteOpportunitiesResult = await supabase
    .from("opportunities")
    .delete()
    .eq("status", "expired")
    .lt("detected_at", thirtyDaysAgoIso)
    .select("id");

  if (deleteOpportunitiesResult.error) {
    throw new Error(
      `Cleanup failed while deleting old opportunities: ${deleteOpportunitiesResult.error.message}`,
    );
  }

  return {
    expired: expireResult.data?.length ?? 0,
    deletedPriceHistory: deleteHistoryResult.data?.length ?? 0,
    deletedOpportunities: deleteOpportunitiesResult.data?.length ?? 0,
  };
}
