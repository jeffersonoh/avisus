import type { SupabaseClient } from "@supabase/supabase-js";

import { isTelegramAlertsEnabled } from "@/lib/cron/auth";
import { normalizePlan, type Plan } from "@/lib/plan-limits";
import type { Database, TablesUpdate } from "@/types/database";

import {
  sendTelegramMessage,
  type SendTelegramMessageInput,
  type SendTelegramMessageResult,
} from "./telegram";

const MAX_SEND_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;
const FREE_ALERT_DAILY_LIMIT = 5;

export type OpportunityAlertTemplateInput = {
  productName: string;
  acquisitionCost: number;
  bestMarginPct: number;
  bestMarginChannel: string;
  quality: string | null;
  hot?: boolean;
  opportunityUrl: string;
  expiresAtLabel?: string | null;
};

const QUALITY_LABEL_PT: Record<string, string> = {
  exceptional: "Excepcional",
  great: "Ótima",
  good: "Boa",
};

export type LiveAlertTemplateInput = {
  sellerName: string;
  platform: string;
  liveTitle: string;
  liveUrl: string;
  trackingUrl?: string;
};

export type SilenceWindow = {
  silenceStart: string | null;
  silenceEnd: string | null;
  timezone?: string;
};

const DEFAULT_SILENCE_TIMEZONE = "America/Sao_Paulo";

type OpportunityQueueJob = {
  kind: "opportunity";
  supabase: SupabaseClient<Database>;
  userId: string;
  plan: Plan;
  alertId: string;
  chatId: string;
  templateData: OpportunityAlertTemplateInput;
  silenceWindow: SilenceWindow;
  hasBeenSilenced: boolean;
  attempts: number;
};

type LiveQueueJob = {
  kind: "live";
  supabase: SupabaseClient<Database>;
  userId: string;
  plan: Plan;
  liveAlertId: string;
  chatId: string;
  templateData: LiveAlertTemplateInput;
  silenceWindow: SilenceWindow;
  attempts: number;
};

type AlertQueueJob = OpportunityQueueJob | LiveQueueJob;

export type EnqueueOpportunityAlertInput = {
  supabase: SupabaseClient<Database>;
  userId: string;
  plan: Plan | string;
  alertId: string;
  chatId: string;
  templateData: OpportunityAlertTemplateInput;
  silenceWindow?: SilenceWindow;
};

export type EnqueueLiveAlertInput = {
  supabase: SupabaseClient<Database>;
  userId: string;
  plan: Plan | string;
  liveAlertId: string;
  chatId: string;
  templateData: LiveAlertTemplateInput;
  silenceWindow?: SilenceWindow;
};

type AlertSenderFnDeps = {
  sendMessage: (input: SendTelegramMessageInput) => Promise<SendTelegramMessageResult>;
  sleep: (ms: number) => Promise<void>;
  now: () => Date;
};

type AlertSenderDependencies = Partial<AlertSenderFnDeps> & {
  telegramEnabled?: boolean;
};

const alertQueue: AlertQueueJob[] = [];
let isProcessingQueue = false;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrencyBr(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function parseClockToMinutes(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const [hoursPart = "0", minutesPart = "0"] = value.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  return hours * 60 + minutes;
}

function getMinutesForTimezone(now: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(now);

  const hours = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minutes = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return hours * 60 + minutes;
}

export function isSilenced(window: SilenceWindow, now: Date = new Date()): boolean {
  const silenceStartMinutes = parseClockToMinutes(window.silenceStart);
  const silenceEndMinutes = parseClockToMinutes(window.silenceEnd);

  if (silenceStartMinutes === null || silenceEndMinutes === null) {
    return false;
  }

  if (silenceStartMinutes === silenceEndMinutes) {
    return false;
  }

  const timezone = window.timezone ?? DEFAULT_SILENCE_TIMEZONE;
  const nowMinutes = getMinutesForTimezone(now, timezone);

  if (silenceStartMinutes < silenceEndMinutes) {
    return nowMinutes >= silenceStartMinutes && nowMinutes < silenceEndMinutes;
  }

  return nowMinutes >= silenceStartMinutes || nowMinutes < silenceEndMinutes;
}

export async function getAlertsSentToday(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("alerts_sent_today", { p_user_id: userId });
  if (error) {
    throw new Error(`Failed to read alerts_sent_today for user ${userId}: ${error.message}`);
  }

  if (typeof data !== "number" || !Number.isFinite(data)) {
    return 0;
  }

  return data;
}

export function createOpportunityAlertTemplate(input: OpportunityAlertTemplateInput): string {
  const hotLine = input.hot ? "🔥 <b>EM ALTA</b>" : null;

  const expiresLine =
    input.expiresAtLabel && input.expiresAtLabel.trim().length > 0
      ? `⏱ Expira: ${escapeHtml(input.expiresAtLabel)}`
      : null;

  const rawQuality = input.quality ?? "";
  const qualityLabel = QUALITY_LABEL_PT[rawQuality] ?? (rawQuality ? escapeHtml(rawQuality) : null);
  const qualityLine = qualityLabel ? `⭐ Qualidade: ${qualityLabel}` : null;

  const lines = [
    `<b>${escapeHtml(input.productName)}</b>`,
    hotLine,
    `💰 Custo: ${formatCurrencyBr(input.acquisitionCost)}`,
    `📈 Margem: ${formatPercent(input.bestMarginPct)} via ${escapeHtml(input.bestMarginChannel)}`,
    qualityLine,
    expiresLine,
    "",
    `<a href="${escapeHtml(input.opportunityUrl)}">Ver oferta →</a>`,
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

export function createLiveAlertTemplate(input: LiveAlertTemplateInput): string {
  const href = input.trackingUrl ?? input.liveUrl;
  return [
    `<b>LIVE</b> - ${escapeHtml(input.sellerName)}`,
    `${escapeHtml(input.platform)}: ${escapeHtml(input.liveTitle)}`,
    "",
    `<a href="${escapeHtml(href)}">Join live -&gt;</a>`,
  ].join("\n");
}

export function enqueueOpportunityAlert(input: EnqueueOpportunityAlertInput): void {
  alertQueue.push({
    kind: "opportunity",
    supabase: input.supabase,
    userId: input.userId,
    plan: normalizePlan(input.plan),
    alertId: input.alertId,
    chatId: input.chatId,
    templateData: input.templateData,
    silenceWindow: input.silenceWindow ?? {
      silenceStart: null,
      silenceEnd: null,
      timezone: DEFAULT_SILENCE_TIMEZONE,
    },
    hasBeenSilenced: false,
    attempts: 0,
  });
}

export function enqueueLiveAlert(input: EnqueueLiveAlertInput): void {
  alertQueue.push({
    kind: "live",
    supabase: input.supabase,
    userId: input.userId,
    plan: normalizePlan(input.plan),
    liveAlertId: input.liveAlertId,
    chatId: input.chatId,
    templateData: input.templateData,
    silenceWindow: input.silenceWindow ?? {
      silenceStart: null,
      silenceEnd: null,
      timezone: DEFAULT_SILENCE_TIMEZONE,
    },
    attempts: 0,
  });
}

export function resetAlertQueueForTests(): void {
  alertQueue.length = 0;
  isProcessingQueue = false;
}

function resolveRetryDelayMs(result: SendTelegramMessageResult, attempt: number): number {
  if (!result.ok && result.retryAfterSeconds !== null) {
    return result.retryAfterSeconds * 1000;
  }

  return BASE_RETRY_DELAY_MS * attempt;
}

async function updateOpportunityAlert(
  supabase: SupabaseClient<Database>,
  alertId: string,
  payload: TablesUpdate<"alerts">,
): Promise<void> {
  const { error } = await supabase.from("alerts").update(payload).eq("id", alertId);
  if (error) {
    throw new Error(`Failed to update alert ${alertId}: ${error.message}`);
  }
}

async function updateLiveAlert(
  supabase: SupabaseClient<Database>,
  liveAlertId: string,
  payload: TablesUpdate<"live_alerts">,
): Promise<void> {
  const { error } = await supabase.from("live_alerts").update(payload).eq("id", liveAlertId);
  if (error) {
    throw new Error(`Failed to update live alert ${liveAlertId}: ${error.message}`);
  }
}

async function hasReachedFreeAlertLimit(job: { plan: Plan; supabase: SupabaseClient<Database>; userId: string }) {
  if (job.plan !== "free") {
    return false;
  }

  const sentToday = await getAlertsSentToday(job.supabase, job.userId);
  return sentToday >= FREE_ALERT_DAILY_LIMIT;
}

async function processOpportunityQueueJob(
  job: OpportunityQueueJob,
  dependencies: AlertSenderFnDeps,
  telegramEnabled: boolean,
): Promise<OpportunityQueueJob | null> {
  if (!telegramEnabled) {
    console.log(`[TELEGRAM_DISABLED] skipping opportunity alert ${job.alertId} for user ${job.userId}`);
    await updateOpportunityAlert(job.supabase, job.alertId, {
      status: "sent",
      attempts: 1,
      sent_at: dependencies.now().toISOString(),
      error_message: null,
    });
    return null;
  }

  if (await hasReachedFreeAlertLimit(job)) {
    await updateOpportunityAlert(job.supabase, job.alertId, {
      status: "silenced",
      error_message: "Daily alert limit reached for FREE plan.",
    });
    return null;
  }

  if (isSilenced(job.silenceWindow, dependencies.now())) {
    if (!job.hasBeenSilenced) {
      await updateOpportunityAlert(job.supabase, job.alertId, {
        status: "silenced",
      });
    }

    return {
      ...job,
      hasBeenSilenced: true,
    };
  }

  const attempt = job.attempts + 1;
  const message = createOpportunityAlertTemplate(job.templateData);
  const sendResult = await dependencies.sendMessage({
    chatId: job.chatId,
    text: message,
  });

  if (sendResult.ok) {
    await updateOpportunityAlert(job.supabase, job.alertId, {
      status: "sent",
      attempts: attempt,
      sent_at: dependencies.now().toISOString(),
      error_message: null,
    });
    return null;
  }

  if (attempt >= MAX_SEND_ATTEMPTS) {
    await updateOpportunityAlert(job.supabase, job.alertId, {
      status: "failed",
      attempts: attempt,
      sent_at: null,
      error_message: sendResult.errorMessage,
    });
    return null;
  }

  await updateOpportunityAlert(job.supabase, job.alertId, {
    attempts: attempt,
    error_message: sendResult.errorMessage,
  });

  await dependencies.sleep(resolveRetryDelayMs(sendResult, attempt));
  alertQueue.push({ ...job, attempts: attempt });
  return null;
}

async function processLiveQueueJob(
  job: LiveQueueJob,
  dependencies: AlertSenderFnDeps,
  telegramEnabled: boolean,
): Promise<void> {
  if (!telegramEnabled) {
    console.log(`[TELEGRAM_DISABLED] skipping live alert ${job.liveAlertId} for user ${job.userId}`);
    await updateLiveAlert(job.supabase, job.liveAlertId, {
      status: "sent",
      sent_at: dependencies.now().toISOString(),
    });
    return;
  }

  if (await hasReachedFreeAlertLimit(job)) {
    await updateLiveAlert(job.supabase, job.liveAlertId, {
      status: "skipped_limit",
    });
    return;
  }

  if (isSilenced(job.silenceWindow, dependencies.now())) {
    await updateLiveAlert(job.supabase, job.liveAlertId, {
      status: "skipped_silence",
    });
    return;
  }

  const attempt = job.attempts + 1;
  const message = createLiveAlertTemplate(job.templateData);
  const sendResult = await dependencies.sendMessage({
    chatId: job.chatId,
    text: message,
  });

  if (sendResult.ok) {
    await updateLiveAlert(job.supabase, job.liveAlertId, {
      status: "sent",
      sent_at: dependencies.now().toISOString(),
    });
    return;
  }

  if (attempt >= MAX_SEND_ATTEMPTS) {
    await updateLiveAlert(job.supabase, job.liveAlertId, {
      status: "failed",
    });
    return;
  }

  await dependencies.sleep(resolveRetryDelayMs(sendResult, attempt));
  alertQueue.push({ ...job, attempts: attempt });
}

export async function processAlertQueue(
  dependencies: AlertSenderDependencies = {},
): Promise<void> {
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  const resolvedDependencies: AlertSenderFnDeps = {
    sendMessage: dependencies.sendMessage ?? sendTelegramMessage,
    sleep: dependencies.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
    now: dependencies.now ?? (() => new Date()),
  };

  const telegramEnabled = dependencies.telegramEnabled ?? isTelegramAlertsEnabled();

  try {
    const deferredJobs: AlertQueueJob[] = [];

    while (alertQueue.length > 0) {
      const currentJob = alertQueue.shift();
      if (!currentJob) {
        continue;
      }

      if (currentJob.kind === "opportunity") {
        const deferredJob = await processOpportunityQueueJob(currentJob, resolvedDependencies, telegramEnabled);
        if (deferredJob) {
          deferredJobs.push(deferredJob);
        }
      } else {
        await processLiveQueueJob(currentJob, resolvedDependencies, telegramEnabled);
      }
    }

    if (deferredJobs.length > 0) {
      alertQueue.push(...deferredJobs);
    }
  } finally {
    isProcessingQueue = false;
  }
}
