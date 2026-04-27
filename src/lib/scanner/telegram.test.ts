import { afterEach, describe, expect, it, vi } from "vitest";

import {
  resetTelegramValidationCacheForTests,
  sendTelegramMessage,
  sendTelegramPhoto,
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

  it("returns a failed result when TELEGRAM_BOT_TOKEN is missing", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const fetcher = vi.fn();

    const result = await sendTelegramMessage(
      {
        chatId: "1001",
        text: "Teste",
      },
      {
        fetcher: fetcher as unknown as typeof fetch,
      },
    );

    expect(result.ok).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns a failed result when TELEGRAM_BOT_TOKEN is still a placeholder", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "replace_with_telegram_bot_token";
    const fetcher = vi.fn();

    const result = await sendTelegramMessage(
      {
        chatId: "1001",
        text: "Teste",
      },
      {
        fetcher: fetcher as unknown as typeof fetch,
      },
    );

    expect(result.ok).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends inline keyboard markup with text messages", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456:TEST_TOKEN";
    const requestBodies: BodyInit[] = [];
    const fetcher = vi.fn(async (...args: Parameters<typeof fetch>) => {
      const init = args[1];
      if (init?.body != null) {
        requestBodies.push(init.body);
      }

      return new Response(JSON.stringify({ ok: true, result: { message_id: 123 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const result = await sendTelegramMessage(
      {
        chatId: "1001",
        text: "Teste",
        inlineKeyboard: [[{ text: "Ver oferta", url: "https://example.com/oferta" }]],
      },
      { fetcher: fetcher as unknown as typeof fetch },
    );

    expect(result.ok).toBe(true);
    const request = JSON.parse(String(requestBodies[0])) as Record<string, unknown>;
    expect(request).toMatchObject({
      chat_id: "1001",
      text: "Teste",
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: "Ver oferta", url: "https://example.com/oferta" }]],
      },
    });
  });

  it("sends product photos with caption and inline keyboard", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456:TEST_TOKEN";
    const requestUrls: Array<Parameters<typeof fetch>[0]> = [];
    const requestBodies: BodyInit[] = [];
    const fetcher = vi.fn(async (...args: Parameters<typeof fetch>) => {
      requestUrls.push(args[0]);
      const init = args[1];
      if (init?.body != null) {
        requestBodies.push(init.body);
      }

      return new Response(JSON.stringify({ ok: true, result: { message_id: 456 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const result = await sendTelegramPhoto(
      {
        chatId: "1001",
        photoUrl: "https://example.com/produto.jpg",
        caption: "<b>Oferta</b>",
        inlineKeyboard: [[{ text: "Ver melhor oferta", url: "https://example.com/oferta" }]],
      },
      { fetcher: fetcher as unknown as typeof fetch },
    );

    expect(result.ok).toBe(true);
    expect(String(requestUrls[0])).toContain("/sendPhoto");
    const request = JSON.parse(String(requestBodies[0])) as Record<string, unknown>;
    expect(request).toMatchObject({
      chat_id: "1001",
      photo: "https://example.com/produto.jpg",
      caption: "<b>Oferta</b>",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Ver melhor oferta", url: "https://example.com/oferta" }]],
      },
    });
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
