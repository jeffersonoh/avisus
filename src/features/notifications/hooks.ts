"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import {
  updateAlertChannels,
  updateSilenceWindow,
} from "@/features/profile/actions";

export type NotificationChannel = "telegram" | "web";
export type AlertType = "opportunity" | "live";

const allowedChannels: ReadonlyArray<NotificationChannel> = ["telegram", "web"];

export const SilenceTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Informe um horário válido no formato HH:mm.");

export interface OpportunityAlertItem {
  id: string;
  channel: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  opportunityName: string | null;
  opportunityMarketplace: string | null;
  buyUrl: string | null;
}

export interface LiveAlertItem {
  id: string;
  channel: string;
  status: string;
  createdAt: string;
  sentAt: string;
  platform: string;
  liveTitle: string | null;
  liveUrl: string;
  sellerName: string | null;
}

export interface UnifiedAlertItem {
  id: string;
  type: AlertType;
  title: string;
  subtitle: string;
  status: string;
  channel: string;
  createdAt: string;
  sentAt: string | null;
  actionUrl: string | null;
}

type UseAlertsInput = {
  opportunityAlerts: OpportunityAlertItem[];
  liveAlerts: LiveAlertItem[];
};

function toChannel(value: string): NotificationChannel | null {
  if (value === "telegram" || value === "web") {
    return value;
  }
  return null;
}

export function normalizeChannels(channels: string[]): NotificationChannel[] {
  const set = new Set<NotificationChannel>();
  for (const channel of channels) {
    const normalized = toChannel(channel);
    if (normalized) {
      set.add(normalized);
    }
  }
  return [...set];
}

function channelLabel(channel: string): string {
  if (channel === "telegram") return "Telegram";
  if (channel === "web") return "Web";
  return channel;
}

function platformLabel(platform: string): string {
  if (platform === "shopee") return "Shopee";
  if (platform === "tiktok") return "TikTok";
  return platform;
}

export function useAlerts({ opportunityAlerts, liveAlerts }: UseAlertsInput): UnifiedAlertItem[] {
  return useMemo(() => {
    const opportunities: UnifiedAlertItem[] = opportunityAlerts.map((alert) => ({
      id: alert.id,
      type: "opportunity",
      title: alert.opportunityName ?? "Oferta monitorada",
      subtitle: [alert.opportunityMarketplace, `Canal: ${channelLabel(alert.channel)}`]
        .filter(Boolean)
        .join(" · "),
      status: alert.status,
      channel: alert.channel,
      createdAt: alert.createdAt,
      sentAt: alert.sentAt,
      actionUrl: alert.buyUrl,
    }));

    const lives: UnifiedAlertItem[] = liveAlerts.map((alert) => ({
      id: alert.id,
      type: "live",
      title: alert.liveTitle?.trim() || `Live em ${platformLabel(alert.platform)}`,
      subtitle: [alert.sellerName, `Canal: ${channelLabel(alert.channel)}`].filter(Boolean).join(" · "),
      status: alert.status,
      channel: alert.channel,
      createdAt: alert.createdAt,
      sentAt: alert.sentAt,
      actionUrl: alert.liveUrl,
    }));

    const merged = [...opportunities, ...lives];
    merged.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return merged;
  }, [liveAlerts, opportunityAlerts]);
}

function normalizeTimeInput(value: string): string {
  return value.trim();
}

function isValidTime(value: string): boolean {
  return SilenceTimeSchema.safeParse(value).success;
}

export interface NotificationSettingsInput {
  initialChannels: string[];
  initialSilenceStart: string | null;
  initialSilenceEnd: string | null;
}

export interface NotificationSettingsState {
  channels: NotificationChannel[];
  silenceStart: string;
  silenceEnd: string;
  saving: boolean;
  error: string | null;
  saveFeedback: string | null;
  setSilenceStart: (value: string) => void;
  setSilenceEnd: (value: string) => void;
  toggleChannel: (channel: NotificationChannel, enabled: boolean) => void;
  saveSettings: () => Promise<boolean>;
}

export function useNotificationSettings({
  initialChannels,
  initialSilenceStart,
  initialSilenceEnd,
}: NotificationSettingsInput): NotificationSettingsState {
  const [channels, setChannels] = useState<NotificationChannel[]>(() =>
    normalizeChannels(initialChannels),
  );
  const [silenceStart, setSilenceStart] = useState(initialSilenceStart ?? "");
  const [silenceEnd, setSilenceEnd] = useState(initialSilenceEnd ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const toggleChannel = useCallback((channel: NotificationChannel, enabled: boolean) => {
    setChannels((prev) => {
      if (enabled) {
        if (prev.includes(channel)) {
          return prev;
        }
        return [...prev, channel];
      }
      return prev.filter((item) => item !== channel);
    });
    setError(null);
  }, []);

  const saveSettings = useCallback(async (): Promise<boolean> => {
    if (saving) {
      return false;
    }

    const normalizedStart = normalizeTimeInput(silenceStart);
    const normalizedEnd = normalizeTimeInput(silenceEnd);

    if (
      (normalizedStart.length > 0 && normalizedEnd.length === 0) ||
      (normalizedStart.length === 0 && normalizedEnd.length > 0)
    ) {
      setError("Preencha início e fim do silêncio ou deixe ambos vazios.");
      return false;
    }

    if (normalizedStart.length > 0 && !isValidTime(normalizedStart)) {
      setError("Horário de início inválido. Use HH:mm.");
      return false;
    }

    if (normalizedEnd.length > 0 && !isValidTime(normalizedEnd)) {
      setError("Horário de fim inválido. Use HH:mm.");
      return false;
    }

    const uniqueChannels = normalizeChannels(channels).filter((channel) =>
      allowedChannels.includes(channel),
    );

    setSaving(true);
    setError(null);

    const channelsResult = await updateAlertChannels({
      alertChannels: uniqueChannels,
    });

    if (!channelsResult.ok) {
      setSaving(false);
      setError(channelsResult.error.message);
      return false;
    }

    const silenceResult = await updateSilenceWindow({
      silenceStart: normalizedStart.length > 0 ? normalizedStart : null,
      silenceEnd: normalizedEnd.length > 0 ? normalizedEnd : null,
    });

    setSaving(false);

    if (!silenceResult.ok) {
      setError(silenceResult.error.message);
      return false;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setSaveFeedback("Salvo!");
    timeoutRef.current = window.setTimeout(() => {
      setSaveFeedback(null);
    }, 2000);

    return true;
  }, [channels, saving, silenceEnd, silenceStart]);

  return {
    channels,
    silenceStart,
    silenceEnd,
    saving,
    error,
    saveFeedback,
    setSilenceStart,
    setSilenceEnd,
    toggleChannel,
    saveSettings,
  };
}
