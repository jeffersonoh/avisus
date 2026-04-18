import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetAlertQueueForTests } from "@/lib/scanner/alert-sender";
import type { Database, Tables, TablesInsert } from "@/types/database";

import { runLiveMonitor } from "./live-monitor";

type FavoriteSellerRow = Tables<"favorite_sellers">;
type ProfileRow = Tables<"profiles">;
type LiveAlertRow = Tables<"live_alerts">;

function createFavoriteSeller(
  overrides: Partial<FavoriteSellerRow> & Pick<FavoriteSellerRow, "id" | "user_id" | "platform" | "seller_username" | "seller_url">,
): FavoriteSellerRow {
  return {
    id: overrides.id,
    user_id: overrides.user_id,
    platform: overrides.platform,
    seller_username: overrides.seller_username,
    seller_url: overrides.seller_url,
    seller_name: overrides.seller_name ?? null,
    is_live: overrides.is_live ?? false,
    last_live_at: overrides.last_live_at ?? null,
    last_checked_at: overrides.last_checked_at ?? null,
    created_at: overrides.created_at ?? "2026-04-17T00:00:00.000Z",
  };
}

function createProfile(
  overrides: Partial<ProfileRow> & Pick<ProfileRow, "id">,
): ProfileRow {
  return {
    id: overrides.id,
    name: overrides.name ?? "User Test",
    phone: overrides.phone ?? null,
    uf: overrides.uf ?? null,
    city: overrides.city ?? null,
    max_freight: overrides.max_freight ?? null,
    min_discount_pct: overrides.min_discount_pct ?? 15,
    plan: overrides.plan ?? "free",
    alert_channels: overrides.alert_channels ?? ["web"],
    telegram_username: overrides.telegram_username ?? null,
    silence_start: overrides.silence_start ?? null,
    silence_end: overrides.silence_end ?? null,
    resale_channels: overrides.resale_channels ?? {},
    resale_fee_pct: overrides.resale_fee_pct ?? {},
    resale_margin_mode: overrides.resale_margin_mode ?? "average",
    onboarded: overrides.onboarded ?? true,
    created_at: overrides.created_at ?? "2026-04-17T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-04-17T00:00:00.000Z",
  };
}

function toSortableTimestamp(value: string | null): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return Number.NEGATIVE_INFINITY;
  }

  return timestamp;
}

function createLiveMonitorSupabaseMock(options: {
  sellers: FavoriteSellerRow[];
  profiles: ProfileRow[];
  alertsSentTodayByUser?: Record<string, number>;
}) {
  const sellers = options.sellers.map((seller) => ({ ...seller }));
  const profiles = options.profiles.map((profile) => ({ ...profile }));
  const liveAlerts: LiveAlertRow[] = [];
  const alertsSentToday = new Map(Object.entries(options.alertsSentTodayByUser ?? {}));
  let liveAlertSeq = 0;

  const from = vi.fn((table: string) => {
    if (table === "favorite_sellers") {
      return {
        select: () => {
          const query = {
            order: () => query,
            limit: async (limit: number) => {
              const data = [...sellers]
                .sort((left, right) =>
                  toSortableTimestamp(left.last_checked_at) - toSortableTimestamp(right.last_checked_at),
                )
                .slice(0, limit)
                .map((seller) => ({ ...seller }));

              return { data, error: null };
            },
          };

          return query;
        },
        update: (payload: Partial<FavoriteSellerRow>) => ({
          eq: async (...args: [string, string]) => {
            const id = args[1];
            const seller = sellers.find((row) => row.id === id);
            if (!seller) {
              return { error: { message: "seller not found" } };
            }

            Object.assign(seller, payload);
            return { error: null };
          },
        }),
      };
    }

    if (table === "profiles") {
      return {
        select: () => ({
          in: async (...args: [string, string[]]) => ({
            data: profiles
              .filter((profile) => args[1].includes(profile.id))
              .map((profile) => ({ ...profile })),
            error: null,
          }),
        }),
      };
    }

    if (table === "live_alerts") {
      return {
        insert: (payload: TablesInsert<"live_alerts"> | TablesInsert<"live_alerts">[]) => ({
          select: () => ({
            single: async () => {
              const rowPayload = Array.isArray(payload) ? payload[0] : payload;
              if (!rowPayload) {
                return { data: null, error: { message: "empty payload" } };
              }

              liveAlertSeq += 1;
              const liveAlertId = `live-alert-${liveAlertSeq}`;
              const row: LiveAlertRow = {
                id: liveAlertId,
                user_id: rowPayload.user_id,
                seller_id: rowPayload.seller_id,
                platform: rowPayload.platform,
                live_title: rowPayload.live_title ?? null,
                live_url: rowPayload.live_url,
                channel: rowPayload.channel ?? "telegram",
                status: rowPayload.status ?? "sent",
                clicked_at: rowPayload.clicked_at ?? null,
                sent_at: rowPayload.sent_at ?? "2026-04-18T00:00:00.000Z",
                created_at: rowPayload.created_at ?? "2026-04-18T00:00:00.000Z",
              };

              liveAlerts.push(row);
              return {
                data: { id: liveAlertId },
                error: null,
              };
            },
          }),
        }),
        update: (payload: Partial<LiveAlertRow>) => ({
          eq: async (...args: [string, string]) => {
            const id = args[1];
            const liveAlert = liveAlerts.find((row) => row.id === id);
            if (!liveAlert) {
              return { error: { message: "live alert not found" } };
            }

            Object.assign(liveAlert, payload);
            return { error: null };
          },
        }),
        select: () => ({
          in: async (...args: [string, string[]]) => ({
            data: liveAlerts
              .filter((row) => args[1].includes(row.id))
              .map((row) => ({ id: row.id, status: row.status })),
            error: null,
          }),
        }),
      };
    }

    if (table === "alerts") {
      return {
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      };
    }

    throw new Error(`Unexpected table in supabase mock: ${table}`);
  });

  const rpc = vi.fn(async (fnName: string, args: { p_user_id: string }) => {
    if (fnName !== "alerts_sent_today") {
      return {
        data: null,
        error: { message: `unexpected rpc ${fnName}` },
      };
    }

    return {
      data: alertsSentToday.get(args.p_user_id) ?? 0,
      error: null,
    };
  });

  return {
    supabase: { from, rpc } as unknown as SupabaseClient<Database>,
    sellers,
    profiles,
    liveAlerts,
    from,
    rpc,
  };
}

describe("live-monitor", () => {
  beforeEach(() => {
    resetAlertQueueForTests();
  });

  afterEach(() => {
    resetAlertQueueForTests();
    vi.restoreAllMocks();
  });

  it("checks three sellers and sends one alert for a new live transition", async () => {
    const now = new Date("2026-04-18T12:00:00.000Z");
    const mock = createLiveMonitorSupabaseMock({
      sellers: [
        createFavoriteSeller({
          id: "seller-1",
          user_id: "user-1",
          platform: "shopee",
          seller_username: "loja_a",
          seller_url: "https://shopee.com.br/loja_a",
          is_live: false,
          last_checked_at: null,
        }),
        createFavoriteSeller({
          id: "seller-2",
          user_id: "user-2",
          platform: "tiktok",
          seller_username: "canal_b",
          seller_url: "https://www.tiktok.com/@canal_b",
          is_live: false,
          last_checked_at: null,
        }),
        createFavoriteSeller({
          id: "seller-3",
          user_id: "user-3",
          platform: "shopee",
          seller_username: "loja_c",
          seller_url: "https://shopee.com.br/loja_c",
          is_live: true,
          last_live_at: "2026-04-18T11:00:00.000Z",
          last_checked_at: "2026-04-18T11:30:00.000Z",
        }),
      ],
      profiles: [
        createProfile({
          id: "user-1",
          plan: "starter",
          alert_channels: ["web"],
        }),
        createProfile({
          id: "user-2",
          plan: "starter",
          alert_channels: ["telegram"],
          telegram_username: "@canal_b",
        }),
        createProfile({
          id: "user-3",
          plan: "starter",
          alert_channels: ["web"],
        }),
      ],
    });

    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      messageId: 101,
    });

    const result = await runLiveMonitor({
      supabase: mock.supabase,
      now,
      checkShopeeLiveFn: async (seller) => ({
        isLive: seller.sellerUsername === "loja_c",
        title: seller.sellerUsername === "loja_c" ? "Live ja em andamento" : undefined,
        url: seller.sellerUrl,
      }),
      checkTikTokLiveFn: async (seller) => ({
        isLive: seller.sellerUsername === "canal_b",
        title: "Live do canal B",
        url: seller.sellerUrl,
      }),
      alertQueueDependencies: {
        sendMessage,
        sleep: async () => undefined,
        now: () => now,
      },
    });

    expect(result).toEqual({
      checked: 3,
      new_lives: 1,
      alerts_sent: 1,
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);

    const transitionedSeller = mock.sellers.find((seller) => seller.id === "seller-2");
    expect(transitionedSeller?.is_live).toBe(true);
    expect(transitionedSeller?.last_live_at).toBe(now.toISOString());
    expect(transitionedSeller?.last_checked_at).toBe(now.toISOString());

    expect(mock.liveAlerts).toHaveLength(1);
    expect(mock.liveAlerts[0]?.channel).toBe("telegram");
    expect(mock.liveAlerts[0]?.status).toBe("sent");
  });

  it("does not create duplicate live alerts when seller remains live", async () => {
    const mock = createLiveMonitorSupabaseMock({
      sellers: [
        createFavoriteSeller({
          id: "seller-1",
          user_id: "user-1",
          platform: "tiktok",
          seller_username: "canal_repetido",
          seller_url: "https://www.tiktok.com/@canal_repetido",
          is_live: false,
          last_checked_at: null,
        }),
      ],
      profiles: [
        createProfile({
          id: "user-1",
          plan: "starter",
          alert_channels: ["telegram"],
          telegram_username: "@canal_repetido",
        }),
      ],
    });

    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      messageId: 202,
    });

    const firstNow = new Date("2026-04-18T10:00:00.000Z");
    const firstResult = await runLiveMonitor({
      supabase: mock.supabase,
      now: firstNow,
      checkShopeeLiveFn: async (seller) => ({
        isLive: false,
        title: undefined,
        url: seller.sellerUrl,
      }),
      checkTikTokLiveFn: async (seller) => ({
        isLive: true,
        title: "Live ativa",
        url: seller.sellerUrl,
      }),
      alertQueueDependencies: {
        sendMessage,
        sleep: async () => undefined,
        now: () => firstNow,
      },
    });

    const secondNow = new Date("2026-04-18T10:02:00.000Z");
    const secondResult = await runLiveMonitor({
      supabase: mock.supabase,
      now: secondNow,
      checkShopeeLiveFn: async (seller) => ({
        isLive: false,
        title: undefined,
        url: seller.sellerUrl,
      }),
      checkTikTokLiveFn: async (seller) => ({
        isLive: true,
        title: "Live ativa",
        url: seller.sellerUrl,
      }),
      alertQueueDependencies: {
        sendMessage,
        sleep: async () => undefined,
        now: () => secondNow,
      },
    });

    expect(firstResult).toEqual({
      checked: 1,
      new_lives: 1,
      alerts_sent: 1,
    });
    expect(secondResult).toEqual({
      checked: 1,
      new_lives: 0,
      alerts_sent: 0,
    });

    expect(mock.liveAlerts).toHaveLength(1);
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it("marks telegram live alert as skipped_silence during silence window", async () => {
    const now = new Date("2026-04-18T02:30:00.000Z");
    const mock = createLiveMonitorSupabaseMock({
      sellers: [
        createFavoriteSeller({
          id: "seller-1",
          user_id: "user-1",
          platform: "shopee",
          seller_username: "loja_silencio",
          seller_url: "https://shopee.com.br/loja_silencio",
          is_live: false,
          last_checked_at: null,
        }),
      ],
      profiles: [
        createProfile({
          id: "user-1",
          plan: "starter",
          alert_channels: ["telegram"],
          telegram_username: "@loja_silencio",
          silence_start: "22:00",
          silence_end: "07:00",
        }),
      ],
    });

    const sendMessage = vi.fn();

    const result = await runLiveMonitor({
      supabase: mock.supabase,
      now,
      checkShopeeLiveFn: async (seller) => ({
        isLive: true,
        title: "Live silenciosa",
        url: seller.sellerUrl,
      }),
      checkTikTokLiveFn: async (seller) => ({
        isLive: false,
        title: undefined,
        url: seller.sellerUrl,
      }),
      alertQueueDependencies: {
        sendMessage,
        sleep: async () => undefined,
        now: () => now,
      },
    });

    expect(result).toEqual({
      checked: 1,
      new_lives: 1,
      alerts_sent: 0,
    });
    expect(sendMessage).not.toHaveBeenCalled();

    expect(mock.liveAlerts).toHaveLength(1);
    expect(mock.liveAlerts[0]?.status).toBe("skipped_silence");

    const seller = mock.sellers.find((row) => row.id === "seller-1");
    expect(seller?.is_live).toBe(true);
    expect(seller?.last_live_at).toBe(now.toISOString());
  });
});
