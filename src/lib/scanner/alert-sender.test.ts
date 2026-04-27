import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  createLiveAlertTemplate,
  createOpportunityAlertTemplate,
  enqueueLiveAlert,
  enqueueOpportunityAlert,
  getAlertsSentToday,
  isSilenced,
  processAlertQueue,
  resolveAlertSilence,
  resetAlertQueueForTests,
} from "./alert-sender";

type UpdateCall = {
  table: string;
  payload: Record<string, unknown>;
  id: string;
};

function createSupabaseMock(alertsSentToday = 5) {
  const updateCalls: UpdateCall[] = [];
  const rpc = vi.fn().mockResolvedValue({ data: alertsSentToday, error: null });

  const from = vi.fn((table: string) => ({
    update: (payload: Record<string, unknown>) => ({
      eq: async (_column: string, id: string) => {
        updateCalls.push({ table, payload, id });
        return { error: null };
      },
    }),
  }));

  return {
    supabase: { from, rpc } as unknown as SupabaseClient<Database>,
    updateCalls,
    rpc,
  };
}

describe("alert-sender", () => {
  afterEach(() => {
    resetAlertQueueForTests();
  });

  it("marks opportunity alert as sent when Telegram returns 200", async () => {
    const { supabase, updateCalls } = createSupabaseMock();
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      messageId: 1001,
    });

    enqueueOpportunityAlert({
      supabase,
      userId: "user-1",
      plan: "starter",
      alertId: "alert-1",
      chatId: "@revendedor",
      templateData: {
        productName: "Furadeira",
        acquisitionCost: 100,
        bestMarginPct: 27.5,
        bestMarginChannel: "Mercado Livre",
        quality: "great",
        opportunityUrl: "https://example.com/oferta",
        expiresAtLabel: "em 2h",
      },
    });

    await processAlertQueue({
      sendMessage,
      sleep: async () => undefined,
      now: () => new Date("2026-04-17T21:00:00.000Z"),
    });

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(updateCalls).toEqual([
      {
        table: "alerts",
        id: "alert-1",
        payload: {
          status: "sent",
          attempts: 1,
          sent_at: "2026-04-17T21:00:00.000Z",
          error_message: null,
        },
      },
    ]);
  });

  it("marks alert as failed after three retries on Telegram 429", async () => {
    const { supabase, updateCalls } = createSupabaseMock();
    const sendMessage = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      errorMessage: "Too Many Requests",
      retryAfterSeconds: 1,
    });
    const sleep = vi.fn().mockResolvedValue(undefined);

    enqueueOpportunityAlert({
      supabase,
      userId: "user-1",
      plan: "starter",
      alertId: "alert-429",
      chatId: "@revendedor",
      templateData: {
        productName: "Parafusadeira",
        acquisitionCost: 150,
        bestMarginPct: 20,
        bestMarginChannel: "Magazine Luiza",
        quality: "good",
        opportunityUrl: "https://example.com/oferta-429",
        expiresAtLabel: null,
      },
    });

    await processAlertQueue({
      sendMessage,
      sleep,
      now: () => new Date("2026-04-17T21:10:00.000Z"),
    });

    expect(sendMessage).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, 1000);
    expect(sleep).toHaveBeenNthCalledWith(2, 1000);

    expect(updateCalls).toHaveLength(3);
    expect(updateCalls[0]).toEqual({
      table: "alerts",
      id: "alert-429",
      payload: {
        attempts: 1,
        error_message: "Too Many Requests",
      },
    });
    expect(updateCalls[1]).toEqual({
      table: "alerts",
      id: "alert-429",
      payload: {
        attempts: 2,
        error_message: "Too Many Requests",
      },
    });
    expect(updateCalls[2]).toEqual({
      table: "alerts",
      id: "alert-429",
      payload: {
        status: "failed",
        attempts: 3,
        sent_at: null,
        error_message: "Too Many Requests",
      },
    });
  });

  it("renders live template with clickable link", () => {
    const template = createLiveAlertTemplate({
      sellerName: "Loja XPTO",
      platform: "Shopee",
      liveTitle: "Live de descontos",
      liveUrl: "https://example.com/live",
    });

    expect(template).toContain('<a href="https://example.com/live">Join live -&gt;</a>');
  });

  it("escapes HTML in opportunity template to prevent injection", () => {
    const template = createOpportunityAlertTemplate({
      productName: '<script>alert("xss")</script>',
      acquisitionCost: 80,
      bestMarginPct: 40,
      bestMarginChannel: "Mercado Livre",
      quality: "exceptional",
      opportunityUrl: "https://example.com?x=<bad>",
      expiresAtLabel: "hoje <b>23:59</b>",
    });

    expect(template).not.toContain("<script>");
    expect(template).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
    expect(template).toContain("https://example.com?x=&lt;bad&gt;");
    expect(template).toContain("hoje &lt;b&gt;23:59&lt;/b&gt;");
  });

  it("includes 🔥 EM ALTA line when hot=true", () => {
    const template = createOpportunityAlertTemplate({
      productName: "Produto X",
      acquisitionCost: 100,
      bestMarginPct: 35,
      bestMarginChannel: "Mercado Livre",
      quality: "exceptional",
      hot: true,
      opportunityUrl: "https://example.com/oferta",
    });

    expect(template).toContain("🔥");
    expect(template).toContain("EM ALTA");
  });

  it("omits EM ALTA line when hot is absent or false", () => {
    const template = createOpportunityAlertTemplate({
      productName: "Produto Y",
      acquisitionCost: 80,
      bestMarginPct: 22,
      bestMarginChannel: "Magazine Luiza",
      quality: "good",
      hot: false,
      opportunityUrl: "https://example.com/oferta2",
    });

    expect(template).not.toContain("EM ALTA");
    expect(template).not.toContain("🔥");
  });

  it("localizes quality labels in Portuguese", () => {
    const cases: Array<[string, string]> = [
      ["exceptional", "Excepcional"],
      ["great", "Ótima"],
      ["good", "Boa"],
    ];

    for (const [quality, label] of cases) {
      const template = createOpportunityAlertTemplate({
        productName: "Produto",
        acquisitionCost: 50,
        bestMarginPct: 20,
        bestMarginChannel: "Shopee",
        quality,
        opportunityUrl: "https://example.com",
      });
      expect(template).toContain(`Qualidade: ${label}`);
    }
  });

  it("omits quality line when quality is null", () => {
    const template = createOpportunityAlertTemplate({
      productName: "Produto",
      acquisitionCost: 50,
      bestMarginPct: 20,
      bestMarginChannel: "Shopee",
      quality: null,
      opportunityUrl: "https://example.com",
    });
    expect(template).not.toContain("Qualidade:");
  });

  it("keeps opportunity as silenced during quiet hours and sends it after silence window", async () => {
    const { supabase, updateCalls } = createSupabaseMock();
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      messageId: 1002,
    });

    enqueueOpportunityAlert({
      supabase,
      userId: "user-2",
      plan: "starter",
      alertId: "alert-silence",
      chatId: "@revendedor",
      silenceWindow: {
        silenceStart: "22:00",
        silenceEnd: "07:00",
      },
      templateData: {
        productName: "Serra Circular",
        acquisitionCost: 200,
        bestMarginPct: 18,
        bestMarginChannel: "Mercado Livre",
        quality: "good",
        opportunityUrl: "https://example.com/oferta-silence",
        expiresAtLabel: null,
      },
    });

    await processAlertQueue({
      sendMessage,
      sleep: async () => undefined,
      now: () => new Date("2026-04-18T02:00:00.000Z"),
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(updateCalls[0]).toEqual({
      table: "alerts",
      id: "alert-silence",
      payload: {
        status: "silenced",
      },
    });

    await processAlertQueue({
      sendMessage,
      sleep: async () => undefined,
      now: () => new Date("2026-04-18T10:00:00.000Z"),
    });

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(updateCalls[1]).toEqual({
      table: "alerts",
      id: "alert-silence",
      payload: {
        status: "sent",
        attempts: 1,
        sent_at: "2026-04-18T10:00:00.000Z",
        error_message: null,
      },
    });
  });

  it("marks live alert as skipped_silence and does not enqueue send", async () => {
    const { supabase, updateCalls } = createSupabaseMock();
    const sendMessage = vi.fn();

    enqueueLiveAlert({
      supabase,
      userId: "user-3",
      plan: "starter",
      liveAlertId: "live-1",
      chatId: "@revendedor",
      silenceWindow: {
        silenceStart: "22:00",
        silenceEnd: "07:00",
      },
      templateData: {
        sellerName: "Loja Live",
        platform: "Shopee",
        liveTitle: "Oferta relampago",
        liveUrl: "https://example.com/live-silence",
      },
    });

    await processAlertQueue({
      sendMessage,
      sleep: async () => undefined,
      now: () => new Date("2026-04-18T02:30:00.000Z"),
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(updateCalls).toEqual([
      {
        table: "live_alerts",
        id: "live-1",
        payload: {
          status: "skipped_silence",
        },
      },
    ]);
  });

  it("handles silence window crossing midnight in Sao Paulo timezone", () => {
    expect(
      isSilenced(
        {
          silenceStart: "22:00",
          silenceEnd: "07:00",
        },
        new Date("2026-04-18T02:30:00.000Z"),
      ),
    ).toBe(true);

    expect(
      isSilenced(
        {
          silenceStart: "22:00",
          silenceEnd: "07:00",
        },
        new Date("2026-04-18T11:30:00.000Z"),
      ),
    ).toBe(false);

    expect(
      isSilenced(
        {
          silenceStart: "22:00:00",
          silenceEnd: "07:00:00",
        },
        new Date("2026-04-18T02:30:00.000Z"),
      ),
    ).toBe(true);
  });

  it("resolves silence status for every alert channel through the shared policy", () => {
    const silenceWindow = {
      silenceStart: "22:00:00",
      silenceEnd: "07:00:00",
    };
    const now = new Date("2026-04-18T02:30:00.000Z");

    expect(resolveAlertSilence({ kind: "opportunity", channel: "web", silenceWindow, now })).toEqual({
      silenced: true,
      status: "silenced",
    });
    expect(resolveAlertSilence({ kind: "opportunity", channel: "telegram", silenceWindow, now })).toEqual({
      silenced: true,
      status: "silenced",
    });
    expect(resolveAlertSilence({ kind: "live", channel: "web", silenceWindow, now })).toEqual({
      silenced: true,
      status: "skipped_silence",
    });
    expect(resolveAlertSilence({ kind: "live", channel: "telegram", silenceWindow, now })).toEqual({
      silenced: true,
      status: "skipped_silence",
    });
  });

  it("reads alerts_sent_today from server RPC", async () => {
    const { supabase, rpc } = createSupabaseMock();

    const totalSent = await getAlertsSentToday(supabase, "user-4");

    expect(totalSent).toBe(5);
    expect(rpc).toHaveBeenCalledWith("alerts_sent_today", { p_user_id: "user-4" });
  });

  it("blocks opportunity push for FREE user when daily limit is reached", async () => {
    const { supabase, updateCalls } = createSupabaseMock(5);
    const sendMessage = vi.fn();

    enqueueOpportunityAlert({
      supabase,
      userId: "user-free",
      plan: "free",
      alertId: "alert-limit",
      chatId: "@revendedor",
      templateData: {
        productName: "Alicate",
        acquisitionCost: 45,
        bestMarginPct: 22,
        bestMarginChannel: "Mercado Livre",
        quality: "great",
        opportunityUrl: "https://example.com/oferta-limit",
        expiresAtLabel: null,
      },
    });

    await processAlertQueue({
      sendMessage,
      sleep: async () => undefined,
      now: () => new Date("2026-04-18T14:00:00.000Z"),
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(updateCalls).toEqual([
      {
        table: "alerts",
        id: "alert-limit",
        payload: {
          status: "silenced",
          error_message: "Daily alert limit reached for FREE plan.",
        },
      },
    ]);
  });

  it("skips Telegram call and marks opportunity as sent when telegramEnabled=false", async () => {
    const { supabase, updateCalls } = createSupabaseMock(0);
    const sendMessage = vi.fn();

    enqueueOpportunityAlert({
      supabase,
      userId: "user-staging",
      plan: "pro",
      alertId: "alert-disabled",
      chatId: "@revendedor",
      templateData: {
        productName: "Produto Staging",
        acquisitionCost: 100,
        bestMarginPct: 30,
        bestMarginChannel: "Mercado Livre",
        quality: "great",
        opportunityUrl: "https://example.com/staging",
      },
    });

    await processAlertQueue({
      sendMessage,
      sleep: async () => undefined,
      now: () => new Date("2026-04-18T14:00:00.000Z"),
      telegramEnabled: false,
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(updateCalls).toEqual([
      {
        table: "alerts",
        id: "alert-disabled",
        payload: {
          status: "sent",
          attempts: 1,
          sent_at: "2026-04-18T14:00:00.000Z",
          error_message: null,
        },
      },
    ]);
  });

  it("skips Telegram call and marks live alert as sent when telegramEnabled=false", async () => {
    const { supabase, updateCalls } = createSupabaseMock(0);
    const sendMessage = vi.fn();

    enqueueLiveAlert({
      supabase,
      userId: "user-staging",
      plan: "pro",
      liveAlertId: "live-disabled",
      chatId: "@revendedor",
      templateData: {
        sellerName: "Loja Staging",
        platform: "Shopee",
        liveTitle: "Live teste",
        liveUrl: "https://example.com/live-staging",
      },
    });

    await processAlertQueue({
      sendMessage,
      sleep: async () => undefined,
      now: () => new Date("2026-04-18T14:05:00.000Z"),
      telegramEnabled: false,
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(updateCalls).toEqual([
      {
        table: "live_alerts",
        id: "live-disabled",
        payload: {
          status: "sent",
          sent_at: "2026-04-18T14:05:00.000Z",
        },
      },
    ]);
  });

  it("marks live alert as skipped_limit for FREE user with 5 alerts", async () => {
    const { supabase, updateCalls } = createSupabaseMock(5);
    const sendMessage = vi.fn();

    enqueueLiveAlert({
      supabase,
      userId: "user-free",
      plan: "free",
      liveAlertId: "live-limit",
      chatId: "@revendedor",
      templateData: {
        sellerName: "Loja Top",
        platform: "TikTok",
        liveTitle: "Tudo em promocao",
        liveUrl: "https://example.com/live-limit",
      },
    });

    await processAlertQueue({
      sendMessage,
      sleep: async () => undefined,
      now: () => new Date("2026-04-18T14:05:00.000Z"),
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(updateCalls).toEqual([
      {
        table: "live_alerts",
        id: "live-limit",
        payload: {
          status: "skipped_limit",
        },
      },
    ]);
  });
});
