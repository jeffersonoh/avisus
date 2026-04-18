import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  createLiveAlertTemplate,
  createOpportunityAlertTemplate,
  enqueueOpportunityAlert,
  processAlertQueue,
  resetAlertQueueForTests,
} from "./alert-sender";

type UpdateCall = {
  table: string;
  payload: Record<string, unknown>;
  id: string;
};

function createSupabaseMock() {
  const updateCalls: UpdateCall[] = [];

  const from = vi.fn((table: string) => ({
    update: (payload: Record<string, unknown>) => ({
      eq: async (_column: string, id: string) => {
        updateCalls.push({ table, payload, id });
        return { error: null };
      },
    }),
  }));

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    updateCalls,
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
});
