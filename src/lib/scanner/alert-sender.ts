import type { SupabaseClient } from "@supabase/supabase-js";

import { isTelegramAlertsEnabled } from "@/lib/cron/auth";
import { normalizePlan, type Plan } from "@/lib/plan-limits";
import type { Database, TablesUpdate } from "@/types/database";

import {
  sendTelegramMessage,
  sendTelegramPhoto,
  type SendTelegramMessageInput,
  type SendTelegramMessageResult,
  type SendTelegramPhotoInput,
  type SendTelegramPhotoResult,
} from "./telegram";

const MAX_SEND_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;
const FREE_ALERT_DAILY_LIMIT = 5;
const MAX_GROUPED_OPPORTUNITIES = 5;

export type OpportunityAlertTemplateInput = {
  productName: string;
  searchTerm?: string | null;
  acquisitionCost: number;
  bestMarginPct: number;
  bestMarginChannel: string;
  quality: string | null;
  hot?: boolean;
  opportunityUrl: string;
  imageUrl?: string | null;
  expiresAtLabel?: string | null;
};

export type OpportunityAlertGroupTemplateInput = {
  searchTerm?: string | null;
  opportunities: OpportunityAlertTemplateInput[];
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

export type AlertSilenceInput = {
  kind: "opportunity" | "live";
  channel: "telegram" | "web";
  silenceWindow: SilenceWindow;
  now: Date;
};

export type AlertSilenceDecision =
  | { silenced: false; status: null }
  | { silenced: true; status: "silenced" | "skipped_silence" };

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
  sendPhoto: (input: SendTelegramPhotoInput) => Promise<SendTelegramPhotoResult>;
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
  const sign = value < 0 ? "-" : "";
  const [reais = "0", centavos = "00"] = Math.abs(value).toFixed(2).split(".");
  const reaisWithThousands = reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}R$ ${reaisWithThousands},${centavos}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function resolveQualityLabel(quality: string | null): string | null {
  const rawQuality = quality ?? "";
  return QUALITY_LABEL_PT[rawQuality] ?? (rawQuality ? escapeHtml(rawQuality) : null);
}

function resolveQualityRank(quality: string | null): number {
  if (quality === "exceptional") return 3;
  if (quality === "great") return 2;
  if (quality === "good") return 1;
  return 0;
}

function sortOpportunityJobsByPriority<T extends { templateData: OpportunityAlertTemplateInput }>(jobs: T[]): T[] {
  return [...jobs].sort((left, right) => {
    const marginDiff = right.templateData.bestMarginPct - left.templateData.bestMarginPct;
    if (marginDiff !== 0) return marginDiff;

    const qualityDiff = resolveQualityRank(right.templateData.quality) - resolveQualityRank(left.templateData.quality);
    if (qualityDiff !== 0) return qualityDiff;

    return left.templateData.acquisitionCost - right.templateData.acquisitionCost;
  });
}

function normalizeOpportunityGroupTerm(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function hasSameSilenceWindow(left: SilenceWindow, right: SilenceWindow): boolean {
  return (
    left.silenceStart === right.silenceStart &&
    left.silenceEnd === right.silenceEnd &&
    (left.timezone ?? DEFAULT_SILENCE_TIMEZONE) === (right.timezone ?? DEFAULT_SILENCE_TIMEZONE)
  );
}

function canGroupOpportunityJobs(left: OpportunityQueueJob, right: OpportunityQueueJob): boolean {
  return (
    left.supabase === right.supabase &&
    left.userId === right.userId &&
    left.plan === right.plan &&
    left.chatId === right.chatId &&
    left.attempts === right.attempts &&
    left.hasBeenSilenced === right.hasBeenSilenced &&
    normalizeOpportunityGroupTerm(left.templateData.searchTerm) === normalizeOpportunityGroupTerm(right.templateData.searchTerm) &&
    hasSameSilenceWindow(left.silenceWindow, right.silenceWindow)
  );
}

function collectOpportunityGroup(seedJob: OpportunityQueueJob): OpportunityQueueJob[] {
  const group = [seedJob];

  for (let index = 0; index < alertQueue.length; ) {
    const candidate = alertQueue[index];
    if (candidate?.kind === "opportunity" && canGroupOpportunityJobs(seedJob, candidate)) {
      group.push(candidate);
      alertQueue.splice(index, 1);
      continue;
    }

    index += 1;
  }

  return sortOpportunityJobsByPriority(group);
}

function parseClockToMinutes(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1] ?? "0");
  const minutes = Number(match[2] ?? "0");
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

export function resolveAlertSilence(input: AlertSilenceInput): AlertSilenceDecision {
  if (!isSilenced(input.silenceWindow, input.now)) {
    return { silenced: false, status: null };
  }

  return {
    silenced: true,
    status: input.kind === "live" ? "skipped_silence" : "silenced",
  };
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
  return createOpportunityAlertGroupTemplate({
    searchTerm: input.searchTerm,
    opportunities: [input],
  });
}

export function createOpportunityAlertGroupTemplate(input: OpportunityAlertGroupTemplateInput): string {
  const opportunities = sortOpportunityJobsByPriority(
    input.opportunities.map((templateData, index) => ({ templateData, originalIndex: index })),
  ).map((item) => item.templateData);
  const [bestOpportunity, ...otherOpportunities] = opportunities;

  if (!bestOpportunity) {
    return "<b>🚨 Nova oportunidade encontrada</b>";
  }

  const searchTerm = input.searchTerm?.trim() ?? bestOpportunity.searchTerm?.trim();
  const heading = searchTerm
    ? opportunities.length > 1
      ? `<b>🚨 ${opportunities.length} oportunidades em "${escapeHtml(truncateText(searchTerm, 48))}"</b>`
      : `<b>🚨 Nova oportunidade em "${escapeHtml(truncateText(searchTerm, 48))}"</b>`
    : "<b>🚨 Nova oportunidade encontrada</b>";

  const hotLine = bestOpportunity.hot ? "🔥 <b>EM ALTA</b>" : null;

  const expiresLine =
    bestOpportunity.expiresAtLabel && bestOpportunity.expiresAtLabel.trim().length > 0
      ? `⏱ Expira: ${escapeHtml(bestOpportunity.expiresAtLabel)}`
      : null;

  const qualityLabel = resolveQualityLabel(bestOpportunity.quality);
  const qualityLine = qualityLabel ? `⭐ <b>Qualidade:</b> ${qualityLabel}` : null;
  const otherOpportunityLines = otherOpportunities.slice(0, MAX_GROUPED_OPPORTUNITIES - 1).flatMap((opportunity, index) => {
    const otherQualityLabel = resolveQualityLabel(opportunity.quality);

    const lines = [
      `${index + 2}. ${escapeHtml(truncateText(opportunity.productName, 78))}`,
      `💰 ${formatCurrencyBr(opportunity.acquisitionCost)}`,
      `📈 ${formatPercent(opportunity.bestMarginPct)}`,
    ];

    if (otherQualityLabel) {
      lines.push(`⭐ ${otherQualityLabel}`);
    }

    return lines;
  });

  const lines = [
    heading,
    "",
    "<b>🥇 Melhor oportunidade</b>",
    escapeHtml(truncateText(bestOpportunity.productName, 112)),
    hotLine,
    "",
    `📈 <b>Margem:</b> ${formatPercent(bestOpportunity.bestMarginPct)}`,
    `💰 <b>Custo:</b> ${formatCurrencyBr(bestOpportunity.acquisitionCost)}`,
    qualityLine,
    `🏪 <b>Canal:</b> ${escapeHtml(bestOpportunity.bestMarginChannel)}`,
    expiresLine,
    otherOpportunityLines.length > 0 ? "" : null,
    otherOpportunityLines.length > 0 ? "<b>Outras melhores</b>" : null,
    ...otherOpportunityLines,
    "",
    opportunities.length > 1 ? "👇 Use os botões abaixo para abrir as ofertas." : "👇 Abra a oferta no botão abaixo.",
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

function createOpportunityAlertKeyboard(opportunities: OpportunityAlertTemplateInput[]) {
  const rows = opportunities.slice(0, MAX_GROUPED_OPPORTUNITIES).map((opportunity, index) => [
    {
      text: index === 0 ? "Ver melhor oferta" : `Ver oferta ${index + 1}`,
      url: opportunity.opportunityUrl,
    },
  ]);

  return rows;
}

function shouldFallbackToMessage(result: SendTelegramPhotoResult): boolean {
  if (result.ok || result.status !== 400) {
    return false;
  }

  const message = result.errorMessage.toLowerCase();
  return message.includes("photo") || message.includes("http url") || message.includes("url content");
}

async function sendOpportunityTelegramAlert(
  jobs: OpportunityQueueJob[],
  dependencies: AlertSenderFnDeps,
): Promise<SendTelegramMessageResult> {
  const firstJob = jobs[0];
  if (!firstJob) {
    return {
      ok: false,
      status: 0,
      errorMessage: "No opportunity alert jobs to send.",
      retryAfterSeconds: null,
    };
  }

  const opportunities = jobs.map((job) => job.templateData);
  const message = createOpportunityAlertGroupTemplate({
    searchTerm: opportunities[0]?.searchTerm,
    opportunities,
  });
  const inlineKeyboard = createOpportunityAlertKeyboard(opportunities);
  const bestOpportunity = opportunities[0];
  const imageUrl = bestOpportunity?.imageUrl?.trim();

  if (imageUrl) {
    const photoResult = await dependencies.sendPhoto({
      chatId: firstJob.chatId,
      photoUrl: imageUrl,
      caption: message,
      inlineKeyboard,
    });

    if (photoResult.ok || !shouldFallbackToMessage(photoResult)) {
      return photoResult;
    }
  }

  return dependencies.sendMessage({
    chatId: firstJob.chatId,
    text: message,
    inlineKeyboard,
  });
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

async function updateOpportunityAlerts(
  jobs: OpportunityQueueJob[],
  payload: TablesUpdate<"alerts">,
): Promise<void> {
  for (const job of jobs) {
    await updateOpportunityAlert(job.supabase, job.alertId, payload);
  }
}

async function markOmittedOpportunityAlerts(jobs: OpportunityQueueJob[]): Promise<void> {
  if (jobs.length === 0) {
    return;
  }

  await updateOpportunityAlerts(jobs, {
    status: "silenced",
    error_message: "Omitted from grouped Telegram alert because higher-ranked opportunities were sent.",
  });
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
  jobs: OpportunityQueueJob[],
  dependencies: AlertSenderFnDeps,
  telegramEnabled: boolean,
): Promise<OpportunityQueueJob[] | null> {
  const firstJob = jobs[0];
  if (!firstJob) {
    return null;
  }

  if (!telegramEnabled) {
    console.log(`[TELEGRAM_DISABLED] skipping ${jobs.length} opportunity alert(s) for user ${firstJob.userId}`);
    await updateOpportunityAlerts(jobs, {
      status: "sent",
      attempts: 1,
      sent_at: dependencies.now().toISOString(),
      error_message: null,
    });
    return null;
  }

  let jobsToSend = jobs.slice(0, MAX_GROUPED_OPPORTUNITIES);
  let omittedJobs = jobs.slice(MAX_GROUPED_OPPORTUNITIES);

  if (firstJob.plan === "free") {
    const sentToday = await getAlertsSentToday(firstJob.supabase, firstJob.userId);
    const remainingAlerts = FREE_ALERT_DAILY_LIMIT - sentToday;

    if (remainingAlerts <= 0) {
      await updateOpportunityAlerts(jobs, {
        status: "silenced",
        error_message: "Daily alert limit reached for FREE plan.",
      });
      return null;
    }

    const freeSendLimit = Math.min(MAX_GROUPED_OPPORTUNITIES, remainingAlerts);
    jobsToSend = jobs.slice(0, freeSendLimit);
    const blockedJobs = jobs.slice(remainingAlerts);
    omittedJobs = jobs.slice(freeSendLimit, remainingAlerts);

    await markOmittedOpportunityAlerts(omittedJobs);

    if (blockedJobs.length > 0) {
      await updateOpportunityAlerts(blockedJobs, {
        status: "silenced",
        error_message: "Daily alert limit reached for FREE plan.",
      });
    }
  } else {
    await markOmittedOpportunityAlerts(omittedJobs);
  }

  const firstJobToSend = jobsToSend[0];
  if (!firstJobToSend) {
    return null;
  }

  const silenceDecision = resolveAlertSilence({
    kind: "opportunity",
    channel: "telegram",
    silenceWindow: firstJobToSend.silenceWindow,
    now: dependencies.now(),
  });
  if (silenceDecision.silenced) {
    const jobsNotMarkedSilenced = jobsToSend.filter((job) => !job.hasBeenSilenced);
    if (jobsNotMarkedSilenced.length > 0) {
      await updateOpportunityAlerts(jobsNotMarkedSilenced, { status: silenceDecision.status });
    }

    return jobsToSend.map((job) => ({
      ...job,
      hasBeenSilenced: true,
    }));
  }

  const attempt = Math.max(...jobsToSend.map((job) => job.attempts)) + 1;
  const sendResult = await sendOpportunityTelegramAlert(jobsToSend, dependencies);

  if (sendResult.ok) {
    await updateOpportunityAlerts(jobsToSend, {
      status: "sent",
      attempts: attempt,
      sent_at: dependencies.now().toISOString(),
      error_message: null,
    });
    return null;
  }

  if (attempt >= MAX_SEND_ATTEMPTS) {
    await updateOpportunityAlerts(jobsToSend, {
      status: "failed",
      attempts: attempt,
      sent_at: null,
      error_message: sendResult.errorMessage,
    });
    return null;
  }

  await updateOpportunityAlerts(jobsToSend, {
    attempts: attempt,
    error_message: sendResult.errorMessage,
  });

  await dependencies.sleep(resolveRetryDelayMs(sendResult, attempt));
  alertQueue.push(...jobsToSend.map((job) => ({ ...job, attempts: attempt })));
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

  const silenceDecision = resolveAlertSilence({
    kind: "live",
    channel: "telegram",
    silenceWindow: job.silenceWindow,
    now: dependencies.now(),
  });
  if (silenceDecision.silenced) {
    await updateLiveAlert(job.supabase, job.liveAlertId, {
      status: silenceDecision.status,
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
    sendPhoto: dependencies.sendPhoto ?? sendTelegramPhoto,
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
        const opportunityGroup = collectOpportunityGroup(currentJob);
        const deferredGroup = await processOpportunityQueueJob(opportunityGroup, resolvedDependencies, telegramEnabled);
        if (deferredGroup) {
          deferredJobs.push(...deferredGroup);
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
