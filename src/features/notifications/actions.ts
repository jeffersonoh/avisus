"use server";

import { createServerClient } from "@/lib/supabase/server";

const UNREAD_STATUSES = ["pending", "sent"] as const;

export async function getUnreadAlertsCount(): Promise<number> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const [{ count: opportunityCount }, { count: liveCount }] = await Promise.all([
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", [...UNREAD_STATUSES]),
    supabase
      .from("live_alerts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "sent"),
  ]);

  return (opportunityCount ?? 0) + (liveCount ?? 0);
}

export async function markAlertsAsRead(): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await Promise.all([
    supabase
      .from("alerts")
      .update({ status: "read" })
      .eq("user_id", user.id)
      .in("status", [...UNREAD_STATUSES]),
    supabase
      .from("live_alerts")
      .update({ status: "read" })
      .eq("user_id", user.id)
      .eq("status", "sent"),
  ]);
}
