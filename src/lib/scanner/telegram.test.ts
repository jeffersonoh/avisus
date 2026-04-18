import { afterEach, describe, expect, it, vi } from "vitest";

import {
  resetTelegramValidationCacheForTests,
  sendTelegramMessage,
  validateTelegramUsername,
} from "./telegram";

const ORIGINAL_TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

describe("telegram wrapper", () => {
  afterEach(() => {
    if (ORIGINAL_TELEGRAM_TOKEN === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = ORIGINAL_TELEGRAM_TOKEN;
    }

    vi.restoreAllMocks();
    resetTelegramValidationCacheForTests();
  });

  it("does not leak TELEGRAM_BOT_TOKEN in logs or error message", async () => {
    const token = "123456:TOP_SECRET_TOKEN";
    process.env.TELEGRAM_BOT_TOKEN = token;

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await sendTelegramMessage(
      {
        chatId: "@revendedor",
        text: "Teste",
      },
      {
        fetcher: vi.fn(async () => {
          throw new Error(`network failed with token ${token}`);
        }) as unknown as typeof fetch,
      },
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errorMessage).not.toContain(token);
    }

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("marks username as invalid when getChat returns chat not found", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456:TEST_TOKEN";

    const result = await validateTelegramUsername("@usuario_inexistente", {
      fetcher: vi.fn(async () =>
        new Response(JSON.stringify({ ok: false, description: "Bad Request: chat not found" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        })) as unknown as typeof fetch,
    });

    expect(result.isValid).toBe(false);
  });

  it("does not invalidate username when Telegram API rate limits", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456:TEST_TOKEN";

    const result = await validateTelegramUsername("@usuario_rate_limited", {
      fetcher: vi.fn(async () =>
        new Response(JSON.stringify({ ok: false, description: "Too Many Requests" }), {
          status: 429,
          headers: { "content-type": "application/json" },
        })) as unknown as typeof fetch,
    });

    expect(result.isValid).toBe(true);
  });

  it("caches username validation for 10 minutes", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456:TEST_TOKEN";
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, result: { id: 1 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch;

    const now = new Date("2026-04-17T12:00:00.000Z");

    const first = await validateTelegramUsername("@usuario_cache", {
      fetcher,
      now: () => now,
    });
    const second = await validateTelegramUsername("@usuario_cache", {
      fetcher,
      now: () => new Date("2026-04-17T12:09:59.000Z"),
    });

    expect(first.isValid).toBe(true);
    expect(second.isValid).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
