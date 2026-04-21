import { redirect } from "next/navigation";

import { AlertList } from "@/features/notifications/AlertList";
import { ChannelConfig } from "@/features/notifications/ChannelConfig";
import { MarkAlertsOnMount } from "@/features/notifications/MarkAlertsOnMount";
import { UpgradeCTA } from "@/features/notifications/UpgradeCTA";
import type {
  LiveAlertItem,
  OpportunityAlertItem,
} from "@/features/notifications/hooks";
import type { Database } from "@/types/database";
import { createServerClient } from "@/lib/supabase/server";
import { normalizePlan } from "@/lib/plan-limits";

type OpportunityRow = Pick<
  Database["public"]["Tables"]["opportunities"]["Row"],
  "id" | "name" | "marketplace" | "buy_url"
>;

export default async function AlertasPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: alertsData }, { data: liveAlertsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("alert_channels, silence_start, silence_end, plan")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("alerts")
      .select("id, channel, status, created_at, sent_at, opportunity_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("live_alerts")
      .select("id, channel, status, created_at, sent_at, platform, live_title, live_url, seller_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const opportunityIds = Array.from(
    new Set((alertsData ?? []).map((alert) => alert.opportunity_id)),
  );

  const normalizedPlan = normalizePlan(profile?.plan);
  let alertsSentToday = 0;
  if (normalizedPlan === "free") {
    const { data, error } = await supabase.rpc("alerts_sent_today", { p_user_id: user.id });
    if (!error && typeof data === "number") {
      alertsSentToday = data;
    }
  }

  const opportunitiesData =
    opportunityIds.length > 0
      ? await supabase
          .from("opportunities")
          .select("id, name, marketplace, buy_url")
          .in("id", opportunityIds)
      : { data: [] as OpportunityRow[] };

  const sellersIds = Array.from(new Set((liveAlertsData ?? []).map((alert) => alert.seller_id)));

  const sellersData =
    sellersIds.length > 0
      ? await supabase.from("favorite_sellers").select("id, seller_name").in("id", sellersIds)
      : { data: [] as Array<{ id: string; seller_name: string | null }> };

  const opportunitiesById = new Map<string, OpportunityRow>();
  for (const opportunity of opportunitiesData.data ?? []) {
    opportunitiesById.set(opportunity.id, opportunity);
  }

  const sellersById = new Map<string, string | null>();
  for (const seller of sellersData.data ?? []) {
    sellersById.set(seller.id, seller.seller_name);
  }

  const opportunityAlerts: OpportunityAlertItem[] = (alertsData ?? []).map((alert) => {
    const opportunity = opportunitiesById.get(alert.opportunity_id);
    return {
      id: alert.id,
      channel: alert.channel,
      status: alert.status,
      createdAt: alert.created_at,
      sentAt: alert.sent_at,
      opportunityName: opportunity?.name ?? null,
      opportunityMarketplace: opportunity?.marketplace ?? null,
      buyUrl: opportunity?.buy_url ?? null,
    };
  });

  const liveAlerts: LiveAlertItem[] = (liveAlertsData ?? []).map((alert) => ({
    id: alert.id,
    channel: alert.channel,
    status: alert.status,
    createdAt: alert.created_at,
    sentAt: alert.sent_at,
    platform: alert.platform,
    liveTitle: alert.live_title,
    liveUrl: alert.live_url,
    sellerName: sellersById.get(alert.seller_id) ?? null,
  }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <MarkAlertsOnMount />
      <UpgradeCTA plan={normalizedPlan} alertsSentToday={alertsSentToday} />
      <AlertList opportunityAlerts={opportunityAlerts} liveAlerts={liveAlerts} />
      <ChannelConfig
        plan={normalizedPlan}
        initialChannels={profile?.alert_channels ?? ["web", "telegram"]}
        initialSilenceStart={profile?.silence_start ?? null}
        initialSilenceEnd={profile?.silence_end ?? null}
      />
    </div>
  );
}
