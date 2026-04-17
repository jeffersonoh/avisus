"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { updateAlertChannels, updateProfile } from "@/features/profile/actions";
import { fetchIbgeCitiesByUf, isValidUf } from "@/lib/ibge";

export type ProfileAlertChannel = "web" | "telegram";

const PROFILE_AUTOSAVE_DEBOUNCE_MS = 550;
const SAVE_FEEDBACK_MS = 2000;
const IBGE_STALE_TIME_MS = 24 * 60 * 60 * 1000;

const telegramSchema = z
  .string()
  .trim()
  .regex(/^@?[a-zA-Z0-9_]{5,32}$/, "Telegram deve estar no formato @username.");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{10,15}$/, "Telefone deve conter apenas números e DDI (ex.: +5548999999999).");

const profileSaveSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres.").max(120),
  phone: z.string().optional(),
  uf: z.string().optional(),
  city: z.string().optional(),
  telegramUsername: z.string().optional(),
  alertChannels: z.array(z.enum(["web", "telegram"]))
    .min(1, "Selecione ao menos um canal de alerta."),
});

export type EditableProfile = {
  name: string;
  email: string;
  phone: string;
  uf: string;
  city: string;
  telegramUsername: string;
  alertChannels: ProfileAlertChannel[];
  lgpdConsent: boolean;
};

type ProfileSavePayload = {
  name: string;
  phone: string | null;
  uf: string | null;
  city: string | null;
  telegramUsername: string | null;
  alertChannels: ProfileAlertChannel[];
  lgpdConsent: boolean;
};

export type UseProfileInput = {
  initialProfile: EditableProfile;
};

function normalizeChannels(channels: string[]): ProfileAlertChannel[] {
  const unique = new Set<ProfileAlertChannel>();
  for (const channel of channels) {
    if (channel === "web" || channel === "telegram") {
      unique.add(channel);
    }
  }
  return [...unique];
}

function toSavePayload(profile: EditableProfile): ProfileSavePayload {
  return {
    name: profile.name.trim(),
    phone: profile.phone.trim().length > 0 ? profile.phone.trim() : null,
    uf: profile.uf.trim().length > 0 ? profile.uf.trim().toUpperCase() : null,
    city: profile.city.trim().length > 0 ? profile.city.trim() : null,
    telegramUsername:
      profile.telegramUsername.trim().length > 0 ? profile.telegramUsername.trim() : null,
    alertChannels: normalizeChannels(profile.alertChannels),
    lgpdConsent: profile.lgpdConsent,
  };
}

function validateProfileForSave(profile: EditableProfile): string | null {
  const parseResult = profileSaveSchema.safeParse({
    name: profile.name,
    phone: profile.phone,
    uf: profile.uf,
    city: profile.city,
    telegramUsername: profile.telegramUsername,
    alertChannels: profile.alertChannels,
  });

  if (!parseResult.success) {
    return parseResult.error.issues[0]?.message ?? "Perfil inválido.";
  }

  const normalizedPhone = profile.phone.trim();
  if (normalizedPhone.length > 0 && !phoneSchema.safeParse(normalizedPhone).success) {
    return "Telefone deve conter apenas números e DDI (ex.: +5548999999999).";
  }

  const normalizedTelegram = profile.telegramUsername.trim();
  if (normalizedTelegram.length > 0 && !telegramSchema.safeParse(normalizedTelegram).success) {
    return "Telegram deve estar no formato @username.";
  }

  if (profile.uf.trim().length > 0 && !isValidUf(profile.uf.trim().toUpperCase())) {
    return "UF inválida.";
  }

  if (profile.uf.trim().length > 0 && profile.city.trim().length < 2) {
    return "Selecione a cidade para a UF informada.";
  }

  if (!profile.lgpdConsent) {
    return "Você precisa aceitar o consentimento LGPD para salvar.";
  }

  return null;
}

export function useProfile({ initialProfile }: UseProfileInput) {
  const [profile, setProfile] = useState<EditableProfile>(initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const hasHydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (payload: ProfileSavePayload) => {
      const profileResult = await updateProfile({
        name: payload.name,
        phone: payload.phone,
        uf: payload.uf,
        city: payload.city,
        telegramUsername: payload.telegramUsername,
        lgpdConsent: payload.lgpdConsent,
      });

      if (!profileResult.ok) {
        throw new Error(profileResult.error.message);
      }

      const channelsResult = await updateAlertChannels({
        alertChannels: payload.alertChannels,
      });

      if (!channelsResult.ok) {
        throw new Error(channelsResult.error.message);
      }
    },
    onSuccess: () => {
      setError(null);
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      setSaveFeedback("Salvo");
      feedbackTimerRef.current = window.setTimeout(() => {
        setSaveFeedback(null);
      }, SAVE_FEEDBACK_MS);
    },
    onError: (mutationError) => {
      if (mutationError instanceof Error && mutationError.message.trim().length > 0) {
        setError(mutationError.message);
        return;
      }

      setError("Não foi possível salvar o perfil agora. Tente novamente.");
    },
  });

  const scheduleSave = useCallback(
    (nextProfile: EditableProfile) => {
      const validationError = validateProfileForSave(nextProfile);
      if (validationError) {
        setError(validationError);
        return;
      }

      const payload = toSavePayload(nextProfile);
      setError(null);

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        saveMutation.mutate(payload);
      }, PROFILE_AUTOSAVE_DEBOUNCE_MS);
    },
    [saveMutation],
  );

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    scheduleSave(profile);
  }, [profile, scheduleSave]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    },
    [],
  );

  const updateProfileField = useCallback(
    <K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) => {
      setProfile((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleAlertChannel = useCallback((channel: ProfileAlertChannel, enabled: boolean) => {
    setProfile((prev) => {
      const set = new Set<ProfileAlertChannel>(normalizeChannels(prev.alertChannels));
      if (enabled) {
        set.add(channel);
      } else {
        set.delete(channel);
      }
      return {
        ...prev,
        alertChannels: [...set],
      };
    });
  }, []);

  return {
    profile,
    updateProfileField,
    toggleAlertChannel,
    isSaving: saveMutation.isPending,
    error,
    saveFeedback,
  };
}

export function useIBGE(uf: string) {
  const normalizedUf = uf.trim().toUpperCase();

  const citiesQuery = useQuery({
    queryKey: ["ibge", "cities", normalizedUf],
    queryFn: () => fetchIbgeCitiesByUf(normalizedUf),
    staleTime: IBGE_STALE_TIME_MS,
    enabled: normalizedUf.length === 2 && isValidUf(normalizedUf),
  });

  return {
    cities: citiesQuery.data ?? [],
    isLoadingCities: citiesQuery.isLoading,
    cityError: citiesQuery.error,
  };
}

type CompletenessInput = {
  name: string;
  email: string;
  uf: string;
  city: string;
  alertChannels: ProfileAlertChannel[];
};

export function useCompleteness(input: CompletenessInput) {
  return useMemo(() => {
    const checks = [
      { label: "Nome", done: input.name.trim().length > 0 },
      { label: "E-mail", done: input.email.trim().length > 0 },
      { label: "UF", done: input.uf.trim().length > 0 },
      { label: "Cidade", done: input.city.trim().length > 0 },
      { label: "Canal de alerta", done: normalizeChannels(input.alertChannels).length > 0 },
    ];

    const completed = checks.filter((check) => check.done).length;
    const total = checks.length;
    const percent = Math.round((completed / total) * 100);
    const missing = checks.filter((check) => !check.done).map((check) => check.label);

    return {
      completed,
      total,
      percent,
      missing,
    };
  }, [input.alertChannels, input.city, input.email, input.name, input.uf]);
}
