import { afterEach, describe, expect, it, vi } from "vitest";

import { sendTelegramMessage } from "./telegram";

const ORIGINAL_TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

describe("telegram wrapper", () => {
  afterEach(() => {
    if (ORIGINAL_TELEGRAM_TOKEN === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = ORIGINAL_TELEGRAM_TOKEN;
    }

    vi.restoreAllMocks();
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
});
