"use server";

import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";

const finishOnboardingSchema = z.object({
  redirectTo: z.string().optional(),
  uf: z.string().trim().length(2, "Selecione a UF."),
  city: z.string().trim().min(2, "Selecione a cidade."),
  alertChannels: z.array(z.enum(["web", "telegram"]))
    .min(1, "Selecione ao menos um canal de alerta."),
  telegramUsername: z.string().optional(),
  lgpdConsent: z
    .boolean()
    .refine((value) => value, "Você precisa aceitar o consentimento LGPD para concluir."),
});

export type FinishOnboardingInput = z.infer<typeof finishOnboardingSchema>;

export type FinishOnboardingResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

function sanitizeRedirectTo(input: string | undefined): string {
  if (!input) {
    return "/dashboard";
  }

  if (!input.startsWith("/") || input.startsWith("//")) {
    return "/dashboard";
  }

  if (input.startsWith("/onboarding")) {
    return "/dashboard";
  }

  return input;
}

export async function finishOnboarding(input: FinishOnboardingInput): Promise<FinishOnboardingResult> {
  const parsed = finishOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos para concluir onboarding.",
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão inválida. Faça login novamente." };
  }

  const { count, error: countError } = await supabase
    .from("interests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("active", true);

  if (countError) {
    return { ok: false, error: "Não foi possível validar seus interesses no momento." };
  }

  if (!count || count < 1) {
    return { ok: false, error: "Cadastre ao menos um interesse antes de concluir." };
  }

  const normalizedTelegram = parsed.data.telegramUsername?.trim();
  if (
    normalizedTelegram &&
    !/^@?[a-zA-Z0-9_]{5,32}$/.test(normalizedTelegram)
  ) {
    return { ok: false, error: "Telegram deve estar no formato @username." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("telegram_chat_id")
    .eq("id", user.id)
    .maybeSingle();
  const alertChannels = parsed.data.alertChannels.filter(
    (channel) => channel !== "telegram" || Boolean(profile?.telegram_chat_id),
  );

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      uf: parsed.data.uf.trim().toUpperCase(),
      city: parsed.data.city.trim(),
      alert_channels: alertChannels.length > 0 ? alertChannels : ["web"],
      telegram_username: normalizedTelegram?.length
        ? normalizedTelegram.startsWith("@")
          ? normalizedTelegram
          : `@${normalizedTelegram}`
        : null,
      onboarded: true,
    })
    .eq("id", user.id);

  if (updateError) {
    return { ok: false, error: "Não foi possível concluir onboarding. Tente novamente." };
  }

  return { ok: true, redirectTo: sanitizeRedirectTo(parsed.data.redirectTo) };
}
