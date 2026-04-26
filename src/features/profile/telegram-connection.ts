"use server";

import { randomUUID } from "node:crypto";

import { appActionError, type AppActionError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

export type TelegramConnectionLinkResult =
  | {
      ok: true;
      linked: true;
      botUsername: string;
      deepLink: null;
    }
  | {
      ok: true;
      linked: false;
      botUsername: string;
      deepLink: string;
    }
  | { ok: false; error: AppActionError };

function mapUnknownError(): AppActionError {
  return appActionError("UNKNOWN", "Nao foi possivel gerar o link do Telegram agora. Tente novamente.");
}

function getTelegramBotUsername(): string | null {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  return username && /^[a-zA-Z0-9_]{5,32}$/.test(username) ? username : null;
}

function createTelegramLinkCode(): string {
  return randomUUID().replaceAll("-", "");
}

export async function createTelegramConnectionLink(): Promise<TelegramConnectionLinkResult> {
  const botUsername = getTelegramBotUsername();
  if (!botUsername) {
    return {
      ok: false,
      error: appActionError(
        "UNKNOWN",
        "Configure TELEGRAM_BOT_USERNAME para habilitar a conexão com Telegram.",
      ),
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: appActionError("UNAUTHORIZED", "Sessao invalida. Faca login novamente."),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("telegram_chat_id, telegram_link_code")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: mapUnknownError() };
  }

  if (profile?.telegram_chat_id) {
    return {
      ok: true,
      linked: true,
      botUsername,
      deepLink: null,
    };
  }

  const linkCode = profile?.telegram_link_code ?? createTelegramLinkCode();
  if (!profile?.telegram_link_code) {
    const { error } = await supabase
      .from("profiles")
      .update({ telegram_link_code: linkCode })
      .eq("id", user.id);

    if (error) {
      return { ok: false, error: mapUnknownError() };
    }
  }

  return {
    ok: true,
    linked: false,
    botUsername,
    deepLink: `https://t.me/${botUsername}?start=${linkCode}`,
  };
}
