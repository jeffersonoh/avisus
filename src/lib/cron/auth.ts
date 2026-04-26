import { timingSafeEqual } from "node:crypto";

const CRON_BEARER_PREFIX = "Bearer ";

export type CronAuthResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_secret" | "missing_header" | "invalid_header" | "invalid_token";
    };

function isTokenMatch(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function validateCronAuthorizationHeader(request: Request): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return { ok: false, reason: "missing_secret" };
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return { ok: false, reason: "missing_header" };
  }

  if (!authorization.startsWith(CRON_BEARER_PREFIX)) {
    return { ok: false, reason: "invalid_header" };
  }

  const token = authorization.slice(CRON_BEARER_PREFIX.length).trim();
  if (!token) {
    return { ok: false, reason: "invalid_token" };
  }

  if (!isTokenMatch(cronSecret, token)) {
    return { ok: false, reason: "invalid_token" };
  }

  return { ok: true };
}

export function isScanCronEnabled(): boolean {
  return process.env.ENABLE_SCANNER_CRON !== "false";
}

export function isTelegramAlertsEnabled(): boolean {
  return process.env.ENABLE_TELEGRAM_ALERTS !== "false";
}
