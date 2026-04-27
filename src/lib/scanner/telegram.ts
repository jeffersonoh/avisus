type TelegramSendApiResponse = {
  ok: boolean;
  result?: {
    message_id?: number;
  };
  description?: string;
  parameters?: {
    retry_after?: number;
  };
};

type TelegramGetChatApiResponse = {
  ok: boolean;
  description?: string;
};

export type SendTelegramMessageInput = {
  chatId: string;
  text: string;
  inlineKeyboard?: TelegramInlineKeyboardButton[][];
};

export type SendTelegramPhotoInput = {
  chatId: string;
  photoUrl: string;
  caption: string;
  inlineKeyboard?: TelegramInlineKeyboardButton[][];
};

export type TelegramInlineKeyboardButton = {
  text: string;
  url: string;
};

export type SendTelegramResult =
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

export type SendTelegramMessageResult = SendTelegramResult;
export type SendTelegramPhotoResult = SendTelegramResult;

export type ValidateTelegramUsernameResult = {
  isValid: boolean;
  checkedAt: string;
};

type TelegramFetch = typeof fetch;

const TELEGRAM_API_BASE_URL = "https://api.telegram.org";
const USERNAME_VALIDATION_CACHE_TTL_MS = 10 * 60 * 1000;
const TOKEN_PLACEHOLDER_MARKERS = ["replace_with", "your_telegram_bot_token"];

const usernameValidationCache = new Map<
  string,
  {
    result: ValidateTelegramUsernameResult;
    expiresAt: number;
  }
>();

function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing env var: TELEGRAM_BOT_TOKEN");
  }

  const normalizedToken = token.toLowerCase();
  if (TOKEN_PLACEHOLDER_MARKERS.some((marker) => normalizedToken.includes(marker))) {
    throw new Error("Invalid env var: TELEGRAM_BOT_TOKEN is still a placeholder");
  }

  return token;
}

function resolveRetryAfterSeconds(payload: TelegramSendApiResponse | null): number | null {
  const value = payload?.parameters?.retry_after;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.trunc(value);
}

function resolveErrorMessage(payload: TelegramSendApiResponse | null, status: number): string {
  if (payload?.description && payload.description.trim().length > 0) {
    return payload.description;
  }

  return `Telegram request failed with status ${status}.`;
}

function buildReplyMarkup(
  inlineKeyboard: TelegramInlineKeyboardButton[][] | undefined,
): { inline_keyboard: TelegramInlineKeyboardButton[][] } | null {
  if (!inlineKeyboard || inlineKeyboard.length === 0) {
    return null;
  }

  const rows = inlineKeyboard
    .map((row) => row.filter((button) => button.text.trim().length > 0 && button.url.trim().length > 0))
    .filter((row) => row.length > 0);

  if (rows.length === 0) {
    return null;
  }

  return { inline_keyboard: rows };
}

function normalizeTelegramUsername(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function resolveValidationErrorKind(status: number, payload: TelegramGetChatApiResponse | null):
  | "invalid"
  | "transient" {
  const description = payload?.description?.toLowerCase() ?? "";

  if (status === 429) {
    return "transient";
  }

  if (status === 400 && description.includes("chat not found")) {
    return "invalid";
  }

  if (status >= 500) {
    return "transient";
  }

  return "invalid";
}

export async function sendTelegramMessage(
  input: SendTelegramMessageInput,
  options: { fetcher?: TelegramFetch } = {},
): Promise<SendTelegramMessageResult> {
  const fetcher = options.fetcher ?? fetch;

  try {
    const botToken = getTelegramBotToken();
    const url = `${TELEGRAM_API_BASE_URL}/bot${botToken}/sendMessage`;

    const replyMarkup = buildReplyMarkup(input.inlineKeyboard);
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
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });

    let payload: TelegramSendApiResponse | null = null;
    try {
      payload = (await response.json()) as TelegramSendApiResponse;
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

export async function sendTelegramPhoto(
  input: SendTelegramPhotoInput,
  options: { fetcher?: TelegramFetch } = {},
): Promise<SendTelegramPhotoResult> {
  const fetcher = options.fetcher ?? fetch;

  try {
    const botToken = getTelegramBotToken();
    const url = `${TELEGRAM_API_BASE_URL}/bot${botToken}/sendPhoto`;
    const replyMarkup = buildReplyMarkup(input.inlineKeyboard);

    const response = await fetcher(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: input.chatId,
        photo: input.photoUrl,
        caption: input.caption,
        parse_mode: "HTML",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });

    let payload: TelegramSendApiResponse | null = null;
    try {
      payload = (await response.json()) as TelegramSendApiResponse;
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

export async function validateTelegramUsername(
  username: string,
  options: { fetcher?: TelegramFetch; now?: () => Date } = {},
): Promise<ValidateTelegramUsernameResult> {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? (() => new Date());
  const checkedAt = now();

  const normalizedUsername = normalizeTelegramUsername(username);
  if (!normalizedUsername) {
    return {
      isValid: false,
      checkedAt: checkedAt.toISOString(),
    };
  }

  const cached = usernameValidationCache.get(normalizedUsername);
  if (cached && cached.expiresAt > checkedAt.getTime()) {
    return cached.result;
  }

  const botToken = getTelegramBotToken();
  const url = `${TELEGRAM_API_BASE_URL}/bot${botToken}/getChat`;

  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: normalizedUsername,
      }),
    });

    let payload: TelegramGetChatApiResponse | null = null;
    try {
      payload = (await response.json()) as TelegramGetChatApiResponse;
    } catch {
      payload = null;
    }

    let isValid = response.ok && payload?.ok === true;
    if (!isValid) {
      const errorKind = resolveValidationErrorKind(response.status, payload);
      isValid = errorKind === "transient";
    }

    const result = {
      isValid,
      checkedAt: checkedAt.toISOString(),
    };

    usernameValidationCache.set(normalizedUsername, {
      result,
      expiresAt: checkedAt.getTime() + USERNAME_VALIDATION_CACHE_TTL_MS,
    });

    return result;
  } catch {
    const result = {
      isValid: true,
      checkedAt: checkedAt.toISOString(),
    };

    usernameValidationCache.set(normalizedUsername, {
      result,
      expiresAt: checkedAt.getTime() + USERNAME_VALIDATION_CACHE_TTL_MS,
    });

    return result;
  }
}

export function resetTelegramValidationCacheForTests(): void {
  usernameValidationCache.clear();
}
