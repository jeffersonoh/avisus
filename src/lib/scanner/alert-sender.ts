import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, TablesUpdate } from "@/types/database";

import {
  sendTelegramMessage,
  type SendTelegramMessageInput,
  type SendTelegramMessageResult,
} from "./telegram";

const MAX_SEND_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;

export type OpportunityAlertTemplateInput = {
  productName: string;
  acquisitionCost: number;
  bestMarginPct: number;
  bestMarginChannel: string;
  quality: string | null;
  opportunityUrl: string;
  expiresAtLabel?: string | null;
};

export type LiveAlertTemplateInput = {
  sellerName: string;
  platform: string;
  liveTitle: string;
  liveUrl: string;
};

type OpportunityQueueJob = {
  kind: "opportunity";
  supabase: SupabaseClient<Database>;
  alertId: string;
  chatId: string;
  templateData: OpportunityAlertTemplateInput;
  attempts: number;
};

type LiveQueueJob = {
  kind: "live";
  supabase: SupabaseClient<Database>;
  liveAlertId: string;
  chatId: string;
  templateData: LiveAlertTemplateInput;
  attempts: number;
};

type AlertQueueJob = OpportunityQueueJob | LiveQueueJob;

export type EnqueueOpportunityAlertInput = Omit<OpportunityQueueJob, "kind" | "attempts">;
export type EnqueueLiveAlertInput = Omit<LiveQueueJob, "kind" | "attempts">;

type AlertSenderDependencies = {
  sendMessage?: (
    input: SendTelegramMessageInput,
  ) => Promise<SendTelegramMessageResult>;
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
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

export function createOpportunityAlertTemplate(input: OpportunityAlertTemplateInput): string {
  const expiresLine =
    input.expiresAtLabel && input.expiresAtLabel.trim().length > 0
      ? `\nExpires: ${escapeHtml(input.expiresAtLabel)}`
      : "";

  const qualityLabel = input.quality ? escapeHtml(input.quality) : "N/A";

  return [
    `<b>${escapeHtml(input.productName)}</b>`,
    `Cost: ${formatCurrencyBr(input.acquisitionCost)}`,
    `Margin: ${formatPercent(input.bestMarginPct)} via ${escapeHtml(input.bestMarginChannel)}`,
    `Quality: ${qualityLabel}${expiresLine}`,
    "",
    `<a href="${escapeHtml(input.opportunityUrl)}">View offer -&gt;</a>`,
  ].join("\n");
}

export function createLiveAlertTemplate(input: LiveAlertTemplateInput): string {
  return [
    `<b>LIVE</b> - ${escapeHtml(input.sellerName)}`,
    `${escapeHtml(input.platform)}: ${escapeHtml(input.liveTitle)}`,
    "",
    `<a href="${escapeHtml(input.liveUrl)}">Join live -&gt;</a>`,
  ].join("\n");
}

export function enqueueOpportunityAlert(input: EnqueueOpportunityAlertInput): void {
  alertQueue.push({
    kind: "opportunity",
    supabase: input.supabase,
    alertId: input.alertId,
    chatId: input.chatId,
    templateData: input.templateData,
    attempts: 0,
  });
}

export function enqueueLiveAlert(input: EnqueueLiveAlertInput): void {
  alertQueue.push({
    kind: "live",
    supabase: input.supabase,
    liveAlertId: input.liveAlertId,
    chatId: input.chatId,
    templateData: input.templateData,
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

async function processOpportunityQueueJob(
  job: OpportunityQueueJob,
  dependencies: Required<AlertSenderDependencies>,
): Promise<void> {
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
    return;
  }

  if (attempt >= MAX_SEND_ATTEMPTS) {
    await updateOpportunityAlert(job.supabase, job.alertId, {
      status: "failed",
      attempts: attempt,
      sent_at: null,
      error_message: sendResult.errorMessage,
    });
    return;
  }

  await updateOpportunityAlert(job.supabase, job.alertId, {
    attempts: attempt,
    error_message: sendResult.errorMessage,
  });

  await dependencies.sleep(resolveRetryDelayMs(sendResult, attempt));
  alertQueue.push({ ...job, attempts: attempt });
}

async function processLiveQueueJob(
  job: LiveQueueJob,
  dependencies: Required<AlertSenderDependencies>,
): Promise<void> {
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

  const resolvedDependencies: Required<AlertSenderDependencies> = {
    sendMessage: dependencies.sendMessage ?? sendTelegramMessage,
    sleep: dependencies.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
    now: dependencies.now ?? (() => new Date()),
  };

  try {
    while (alertQueue.length > 0) {
      const currentJob = alertQueue.shift();
      if (!currentJob) {
        continue;
      }

      if (currentJob.kind === "opportunity") {
        await processOpportunityQueueJob(currentJob, resolvedDependencies);
      } else {
        await processLiveQueueJob(currentJob, resolvedDependencies);
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}
