type TelegramSendMessageApiResponse = {
  ok: boolean;
  result?: {
    message_id?: number;
  };
  description?: string;
  parameters?: {
    retry_after?: number;
  };
};

export type SendTelegramMessageInput = {
  chatId: string;
  text: string;
};

export type SendTelegramMessageResult =
  | {
      ok: true;
      messageId: number | null;
    }
  | {
      ok: false;
      status: number;
      errorMessage: string;
      retryAfterSeconds: number | null;
    };

type TelegramFetch = typeof fetch;

const TELEGRAM_API_BASE_URL = "https://api.telegram.org";

function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing env var: TELEGRAM_BOT_TOKEN");
  }

  return token;
}

function resolveRetryAfterSeconds(payload: TelegramSendMessageApiResponse | null): number | null {
  const value = payload?.parameters?.retry_after;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.trunc(value);
}

function resolveErrorMessage(payload: TelegramSendMessageApiResponse | null, status: number): string {
  if (payload?.description && payload.description.trim().length > 0) {
    return payload.description;
  }

  return `Telegram request failed with status ${status}.`;
}

export async function sendTelegramMessage(
  input: SendTelegramMessageInput,
  options: { fetcher?: TelegramFetch } = {},
): Promise<SendTelegramMessageResult> {
  const fetcher = options.fetcher ?? fetch;
  const botToken = getTelegramBotToken();
  const url = `${TELEGRAM_API_BASE_URL}/bot${botToken}/sendMessage`;

  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: input.chatId,
        text: input.text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    let payload: TelegramSendMessageApiResponse | null = null;
    try {
      payload = (await response.json()) as TelegramSendMessageApiResponse;
    } catch {
      payload = null;
    }

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        status: response.status,
        errorMessage: resolveErrorMessage(payload, response.status),
        retryAfterSeconds: resolveRetryAfterSeconds(payload),
      };
    }

    return {
      ok: true,
      messageId: payload.result?.message_id ?? null,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      errorMessage: "Telegram request failed before reaching API.",
      retryAfterSeconds: null,
    };
  }
}
