import { redirect } from "next/navigation";

import { AlertList } from "@/features/notifications/AlertList";
import { ChannelConfig } from "@/features/notifications/ChannelConfig";
import type {
  LiveAlertItem,
  OpportunityAlertItem,
} from "@/features/notifications/hooks";
import type { Database } from "@/types/database";
import { createServerClient } from "@/lib/supabase/server";

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
      .select("alert_channels, silence_start, silence_end")
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
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">Alertas</p>
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Notificações e silêncio</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-2">
          Configure canais de entrega, ajuste seu horário de silêncio e acompanhe o histórico recente
          de alertas de ofertas e lives.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <ChannelConfig
          userId={user.id}
          initialChannels={profile?.alert_channels ?? ["web", "telegram"]}
          initialSilenceStart={profile?.silence_start ?? null}
          initialSilenceEnd={profile?.silence_end ?? null}
        />
        <AlertList opportunityAlerts={opportunityAlerts} liveAlerts={liveAlerts} />
      </div>
    </section>
  );
}
