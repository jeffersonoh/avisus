import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizePlan } from "@/lib/plan-limits";
import {
  enqueueLiveAlert,
  processAlertQueue,
} from "@/lib/scanner/alert-sender";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/types/database";

import { checkShopeeLive } from "./shopee-live";
import { checkTikTokLive } from "./tiktok-live";

const DEFAULT_SELLER_BATCH_SIZE = 50;

type FavoriteSellerSnapshot = Pick<
  Tables<"favorite_sellers">,
  | "id"
  | "user_id"
  | "platform"
  | "seller_name"
  | "seller_url"
  | "seller_username"
  | "is_live"
  | "last_checked_at"
  | "last_live_at"
>;

type ProfileSnapshot = Pick<
  Tables<"profiles">,
  "id" | "plan" | "alert_channels" | "telegram_username" | "silence_start" | "silence_end"
>;

type LiveCheckOutput = {
  isLive: boolean;
  liveTitle: string | null;
  liveUrl: string;
};

type LiveMonitorLogger = Pick<Console, "error" | "warn" | "info">;
type AlertQueueDependencies = Parameters<typeof processAlertQueue>[0];

type RunLiveMonitorOptions = {
  supabase?: SupabaseClient<Database>;
  now?: Date;
  sellerBatchSize?: number;
  logger?: LiveMonitorLogger;
  checkShopeeLiveFn?: typeof checkShopeeLive;
  checkTikTokLiveFn?: typeof checkTikTokLive;
  enqueueLiveAlertFn?: typeof enqueueLiveAlert;
  processAlertQueueFn?: (
    dependencies?: AlertQueueDependencies,
  ) => Promise<void>;
  alertQueueDependencies?: AlertQueueDependencies;
};

export type LiveMonitorResult = {
  checked: number;
  new_lives: number;
  alerts_sent: number;
};

function resolvePlatformLabel(platform: FavoriteSellerSnapshot["platform"]): string {
  if (platform === "shopee") {
    return "Shopee";
  }

  if (platform === "tiktok") {
    return "TikTok";
  }

  return platform;
}

function normalizeAlertChannels(channels: string[]): Set<"telegram" | "web"> {
  const normalized = new Set<"telegram" | "web">();
  for (const channel of channels) {
    if (channel === "telegram" || channel === "web") {
      normalized.add(channel);
    }
  }

  return normalized;
}

async function fetchSellersForPolling(
  supabase: SupabaseClient<Database>,
  sellerBatchSize: number,
): Promise<FavoriteSellerSnapshot[]> {
  const { data, error } = await supabase
    .from("favorite_sellers")
    .select("id, user_id, platform, seller_name, seller_url, seller_username, is_live, last_checked_at, last_live_at")
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(sellerBatchSize);

  if (error) {
    throw new Error(`Failed to load favorite_sellers for live monitor: ${error.message}`);
  }

  return data ?? [];
}

async function fetchProfilesByUserIds(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<Map<string, ProfileSnapshot>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, plan, alert_channels, telegram_username, silence_start, silence_end")
    .in("id", userIds);

  if (error) {
    throw new Error(`Failed to load profiles for live monitor: ${error.message}`);
  }

  const profileMap = new Map<string, ProfileSnapshot>();
  for (const profile of data ?? []) {
    profileMap.set(profile.id, profile);
  }

  return profileMap;
}

async function checkSellerLiveStatus(
  seller: FavoriteSellerSnapshot,
  dependencies: {
    checkShopeeLiveFn: typeof checkShopeeLive;
    checkTikTokLiveFn: typeof checkTikTokLive;
  },
): Promise<LiveCheckOutput> {
  const input = {
    sellerUsername: seller.seller_username,
    sellerUrl: seller.seller_url,
  };

  if (seller.platform === "shopee") {
    const result = await dependencies.checkShopeeLiveFn(input);
    return {
      isLive: result.isLive,
      liveTitle: result.title ?? null,
      liveUrl: result.url,
    };
  }

  if (seller.platform === "tiktok") {
    const result = await dependencies.checkTikTokLiveFn(input);
    return {
      isLive: result.isLive,
      liveTitle: result.title ?? null,
      liveUrl: result.url,
    };
  }

  throw new Error(`Unsupported seller platform for live monitor: ${seller.platform}`);
}

async function updateFavoriteSellerState(
  supabase: SupabaseClient<Database>,
  sellerId: string,
  payload: TablesUpdate<"favorite_sellers">,
): Promise<void> {
  const { error } = await supabase.from("favorite_sellers").update(payload).eq("id", sellerId);
  if (error) {
    throw new Error(`Failed to update favorite_sellers ${sellerId}: ${error.message}`);
  }
}

async function insertLiveAlert(
  supabase: SupabaseClient<Database>,
  payload: TablesInsert<"live_alerts">,
): Promise<string> {
  const { data, error } = await supabase
    .from("live_alerts")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert live_alert: ${error?.message ?? "unknown error"}`);
  }

  return data.id;
}

async function countSentLiveAlertsByIds(
  supabase: SupabaseClient<Database>,
  liveAlertIds: string[],
  logger: LiveMonitorLogger,
): Promise<number> {
  if (liveAlertIds.length === 0) {
    return 0;
  }

  const { data, error } = await supabase
    .from("live_alerts")
    .select("id, status")
    .in("id", liveAlertIds);

  if (error) {
    logger.warn("[live-monitor] failed to read final live_alerts statuses for counters.");
    return 0;
  }

  return (data ?? []).filter((row) => row.status === "sent").length;
}

export async function runLiveMonitor(
  options: RunLiveMonitorOptions = {},
): Promise<LiveMonitorResult> {
  const supabase = options.supabase ?? createServiceRoleClient();
  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const sellerBatchSize = options.sellerBatchSize ?? DEFAULT_SELLER_BATCH_SIZE;
  const logger = options.logger ?? console;

  const checkShopeeLiveFn = options.checkShopeeLiveFn ?? checkShopeeLive;
  const checkTikTokLiveFn = options.checkTikTokLiveFn ?? checkTikTokLive;
  const enqueueLiveAlertFn = options.enqueueLiveAlertFn ?? enqueueLiveAlert;
  const processAlertQueueFn = options.processAlertQueueFn ?? processAlertQueue;

  const sellers = await fetchSellersForPolling(supabase, sellerBatchSize);
  const userIds = Array.from(new Set(sellers.map((seller) => seller.user_id)));
  const profilesById = await fetchProfilesByUserIds(supabase, userIds);

  const checks = await Promise.allSettled(
    sellers.map((seller) =>
      checkSellerLiveStatus(seller, {
        checkShopeeLiveFn,
        checkTikTokLiveFn,
      }),
    ),
  );

  let newLives = 0;
  let queuedTelegramAlerts = 0;
  const webLiveAlertIds: string[] = [];
  const telegramLiveAlertIds: string[] = [];

  for (let index = 0; index < sellers.length; index += 1) {
    const seller = sellers[index];
    const check = checks[index];

    if (!seller) {
      continue;
    }

    if (!check || check.status === "rejected") {
      if (check?.status === "rejected") {
        logger.error(
          `[live-monitor] check failed for seller ${seller.id} (${seller.platform}/${seller.seller_username}).`,
        );
      }

      try {
        await updateFavoriteSellerState(supabase, seller.id, {
          last_checked_at: nowIso,
        });
      } catch {
        logger.error(`[live-monitor] failed to persist last_checked_at for seller ${seller.id}.`);
      }

      continue;
    }

    const liveCheck = check.value;
    const isTransitionToLive = !seller.is_live && liveCheck.isLive;

    const updatePayload: TablesUpdate<"favorite_sellers"> = {
      last_checked_at: nowIso,
      is_live: liveCheck.isLive,
    };

    if (isTransitionToLive) {
      updatePayload.last_live_at = nowIso;
    }

    try {
      await updateFavoriteSellerState(supabase, seller.id, updatePayload);
    } catch {
      logger.error(`[live-monitor] failed to persist live state for seller ${seller.id}.`);
      continue;
    }

    if (!isTransitionToLive) {
      continue;
    }

    newLives += 1;

    const profile = profilesById.get(seller.user_id);
    if (!profile) {
      logger.warn(`[live-monitor] profile not found for seller ${seller.id}.`);
      continue;
    }

    const channels = normalizeAlertChannels(profile.alert_channels ?? []);
    const sellerName = seller.seller_name?.trim() || `@${seller.seller_username}`;
    const liveTitle = liveCheck.liveTitle?.trim() || `Live de @${seller.seller_username}`;

    if (channels.has("web")) {
      try {
        const liveAlertId = await insertLiveAlert(supabase, {
          user_id: seller.user_id,
          seller_id: seller.id,
          platform: seller.platform,
          channel: "web",
          status: "sent",
          live_title: liveTitle,
          live_url: liveCheck.liveUrl,
          sent_at: nowIso,
        });
        webLiveAlertIds.push(liveAlertId);
      } catch {
        logger.error(`[live-monitor] failed inserting web live_alert for seller ${seller.id}.`);
      }
    }

    if (!channels.has("telegram")) {
      continue;
    }

    if (!profile.telegram_username) {
      logger.warn(
        `[live-monitor] telegram channel enabled without telegram_username for user ${seller.user_id}.`,
      );

      try {
        await insertLiveAlert(supabase, {
          user_id: seller.user_id,
          seller_id: seller.id,
          platform: seller.platform,
          channel: "telegram",
          status: "failed",
          live_title: liveTitle,
          live_url: liveCheck.liveUrl,
          sent_at: nowIso,
        });
      } catch {
        logger.error(`[live-monitor] failed inserting failed telegram live_alert for seller ${seller.id}.`);
      }

      continue;
    }

    try {
      const liveAlertId = await insertLiveAlert(supabase, {
        user_id: seller.user_id,
        seller_id: seller.id,
        platform: seller.platform,
        channel: "telegram",
        status: "sent",
        live_title: liveTitle,
        live_url: liveCheck.liveUrl,
        sent_at: nowIso,
      });

      telegramLiveAlertIds.push(liveAlertId);
      queuedTelegramAlerts += 1;

      enqueueLiveAlertFn({
        supabase,
        userId: seller.user_id,
        plan: normalizePlan(profile.plan),
        liveAlertId,
        chatId: profile.telegram_username,
        silenceWindow: {
          silenceStart: profile.silence_start,
          silenceEnd: profile.silence_end,
        },
        templateData: {
          sellerName,
          platform: resolvePlatformLabel(seller.platform),
          liveTitle,
          liveUrl: liveCheck.liveUrl,
        },
      });
    } catch {
      logger.error(`[live-monitor] failed enqueueing telegram live alert for seller ${seller.id}.`);
    }
  }

  if (queuedTelegramAlerts > 0) {
    await processAlertQueueFn(options.alertQueueDependencies);
  }

  const sentWebAlerts = webLiveAlertIds.length;
  const sentTelegramAlerts = await countSentLiveAlertsByIds(supabase, telegramLiveAlertIds, logger);

  return {
    checked: sellers.length,
    new_lives: newLives,
    alerts_sent: sentWebAlerts + sentTelegramAlerts,
  };
}
