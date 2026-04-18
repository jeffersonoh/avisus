"use server";

import { z } from "zod";

import { appActionError, type AppActionError } from "@/lib/errors";
import { validateTelegramUsername } from "@/lib/scanner/telegram";
import { createServerClient } from "@/lib/supabase/server";

const telegramSchema = z
  .string()
  .trim()
  .regex(/^@?[a-zA-Z0-9_]{5,32}$/, "Telegram deve estar no formato @username.");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{10,15}$/, "Telefone deve conter apenas numeros e DDI (ex.: +5548999999999).");

const silenceTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Informe um horario valido no formato HH:mm.");

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres.").max(120).optional(),
    phone: z
      .union([phoneSchema, z.null()])
      .optional(),
    uf: z
      .union([
        z
          .string()
          .trim()
          .toUpperCase()
          .length(2, "UF deve ter 2 caracteres."),
        z.null(),
      ])
      .optional(),
    city: z
      .union([z.string().trim().min(2, "Cidade deve ter pelo menos 2 caracteres."), z.null()])
      .optional(),
    telegramUsername: z.union([telegramSchema, z.null()]).optional(),
    lgpdConsent: z
      .boolean()
      .optional()
      .refine((value) => value !== false, "Voce precisa aceitar o consentimento LGPD para salvar."),
  })
  .superRefine((value, context) => {
    const hasUf = value.uf !== undefined;
    if (hasUf && value.uf && value.city !== null && value.city !== undefined) {
      return;
    }

    if (hasUf && value.uf && (value.city === null || value.city === undefined)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione a cidade para a UF informada.",
        path: ["city"],
      });
    }
  });

const updateAlertChannelsSchema = z.object({
  alertChannels: z
    .array(z.enum(["web", "telegram"]))
    .min(1, "Selecione ao menos um canal de alerta."),
});

const updateSilenceWindowSchema = z
  .object({
    silenceStart: z.union([silenceTimeSchema, z.null()]),
    silenceEnd: z.union([silenceTimeSchema, z.null()]),
  })
  .superRefine((value, context) => {
    const hasStart = value.silenceStart !== null;
    const hasEnd = value.silenceEnd !== null;

    if (hasStart !== hasEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preencha inicio e fim do silencio ou deixe ambos vazios.",
        path: ["silenceEnd"],
      });
    }
  });

export type ProfileActionResult =
  | { ok: true; savedFields: string[] }
  | { ok: false; error: AppActionError };

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type UpdateAlertChannelsInput = z.input<typeof updateAlertChannelsSchema>;
export type UpdateSilenceWindowInput = z.input<typeof updateSilenceWindowSchema>;

function mapUnknownError(): AppActionError {
  return appActionError("UNKNOWN", "Nao foi possivel salvar agora. Tente novamente.");
}

async function getAuthenticatedClient() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      error: appActionError("UNAUTHORIZED", "Sessao invalida. Faca login novamente."),
    };
  }

  return { supabase, user, error: null };
}

export async function updateProfile(input: UpdateProfileInput): Promise<ProfileActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: appActionError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dados invalidos para salvar perfil.",
      ),
    };
  }

  const payload: {
    name?: string;
    phone?: string | null;
    uf?: string | null;
    city?: string | null;
    telegram_username?: string | null;
  } = {};

  if (parsed.data.name !== undefined) {
    payload.name = parsed.data.name.trim();
  }

  if (parsed.data.phone !== undefined) {
    payload.phone = parsed.data.phone ? parsed.data.phone.trim() : null;
  }

  if (parsed.data.uf !== undefined) {
    payload.uf = parsed.data.uf ? parsed.data.uf.trim().toUpperCase() : null;
  }

  if (parsed.data.city !== undefined) {
    payload.city = parsed.data.city ? parsed.data.city.trim() : null;
  }

  if (parsed.data.telegramUsername !== undefined) {
    const value = parsed.data.telegramUsername;
    const normalizedTelegramUsername = value ? (value.startsWith("@") ? value : `@${value}`) : null;

    if (normalizedTelegramUsername) {
      const validationResult = await validateTelegramUsername(normalizedTelegramUsername);
      if (!validationResult.isValid) {
        return {
          ok: false,
          error: appActionError(
            "VALIDATION_ERROR",
            "Username do Telegram nao encontrado. Revise o @usuario e tente novamente.",
          ),
        };
      }
    }

    payload.telegram_username = normalizedTelegramUsername;
  }

  const savedFields = Object.keys(payload);
  if (savedFields.length === 0 && parsed.data.lgpdConsent !== undefined) {
    return { ok: true, savedFields: ["lgpdConsent"] };
  }

  if (savedFields.length === 0) {
    return { ok: true, savedFields: [] };
  }

  const { supabase, user, error: authError } = await getAuthenticatedClient();
  if (authError || !user) {
    return { ok: false, error: authError ?? mapUnknownError() };
  }

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

  if (error) {
    return { ok: false, error: mapUnknownError() };
  }

  return { ok: true, savedFields };
}

export async function updateAlertChannels(
  input: UpdateAlertChannelsInput,
): Promise<ProfileActionResult> {
  const parsed = updateAlertChannelsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: appActionError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Canais de alerta invalidos.",
      ),
    };
  }

  const uniqueChannels = Array.from(new Set(parsed.data.alertChannels));
  const { supabase, user, error: authError } = await getAuthenticatedClient();
  if (authError || !user) {
    return { ok: false, error: authError ?? mapUnknownError() };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ alert_channels: uniqueChannels })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: mapUnknownError() };
  }

  return { ok: true, savedFields: ["alert_channels"] };
}

export async function updateSilenceWindow(
  input: UpdateSilenceWindowInput,
): Promise<ProfileActionResult> {
  const parsed = updateSilenceWindowSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: appActionError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Horario de silencio invalido.",
      ),
    };
  }

  const { supabase, user, error: authError } = await getAuthenticatedClient();
  if (authError || !user) {
    return { ok: false, error: authError ?? mapUnknownError() };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      silence_start: parsed.data.silenceStart,
      silence_end: parsed.data.silenceEnd,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: mapUnknownError() };
  }

  return { ok: true, savedFields: ["silence_start", "silence_end"] };
}

const resaleSettingsSchema = z.object({
  mode: z.enum(["average", "custom"]),
  fees: z.object({
    "Mercado Livre": z.number().min(0).max(50),
    "Magazine Luiza": z.number().min(0).max(50),
  }),
});

export type ResaleSettingsInput = z.input<typeof resaleSettingsSchema>;

export type ResaleSettingsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateResaleSettings(
  input: ResaleSettingsInput,
): Promise<ResaleSettingsResult> {
  const parsed = resaleSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados de margem inválidos.",
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão inválida. Faça login novamente." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      resale_margin_mode: parsed.data.mode,
      resale_fee_pct: parsed.data.fees,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "Não foi possível salvar suas taxas agora." };
  }

  return { ok: true };
}
