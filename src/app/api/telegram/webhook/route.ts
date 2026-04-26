import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { profileCacheTag } from "@/lib/profile-cache";
import { sendTelegramMessage } from "@/lib/scanner/telegram";
import { createServiceRoleClient } from "@/lib/supabase/service";

type TelegramWebhookUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
      type?: string;
    };
    from?: {
      username?: string;
      first_name?: string;
    };
  };
};

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}

function extractStartCode(text: string | undefined): string | null {
  if (!text) {
    return null;
  }

  const match = /^\/start(?:\s+([a-zA-Z0-9_-]{8,64}))?/.exec(text.trim());
  return match?.[1] ?? null;
}

function normalizeTelegramUsername(username: string | undefined): string | null {
  const value = username?.trim();
  if (!value) {
    return null;
  }

  return value.startsWith("@") ? value : `@${value}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await request.json()) as TelegramWebhookUpdate;
  const chatId = update.message?.chat?.id;
  const chatIdText = chatId === undefined ? null : String(chatId);
  const startCode = extractStartCode(update.message?.text);

  if (!chatIdText || !startCode) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, alert_channels")
    .eq("telegram_link_code", startCode)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });
  }

  if (!profile) {
    try {
      await sendTelegramMessage({
        chatId: chatIdText,
        text: "Não encontramos este código de conexão. Gere um novo link no perfil do Avisus e tente novamente.",
      });
    } catch {
      // A conexão já falhou; não reentregar o webhook por falha na mensagem auxiliar.
    }
    return NextResponse.json({ ok: true });
  }

  const channels = new Set(profile.alert_channels ?? []);
  channels.add("telegram");

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      alert_channels: [...channels],
      telegram_chat_id: chatIdText,
      telegram_link_code: null,
      telegram_linked_at: new Date().toISOString(),
      telegram_username: normalizeTelegramUsername(update.message?.from?.username),
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
  }

  revalidateTag(profileCacheTag(profile.id));

  try {
    await sendTelegramMessage({
      chatId: chatIdText,
      text: "Telegram conectado ao Avisus. Você receberá alertas de oportunidades por aqui.",
    });
  } catch {
    // O vínculo já foi salvo; falha na confirmação não deve invalidar a conexão.
  }

  return NextResponse.json({ ok: true });
}
