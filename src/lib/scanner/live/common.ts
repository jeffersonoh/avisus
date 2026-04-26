import { runApifyActorSync } from "./apify";

export type LiveCheckSellerInput = {
  sellerUsername: string;
  sellerUrl: string;
};

export type LiveCheckResult = {
  isLive: boolean;
  title?: string;
  url: string;
};

export type LiveCheckDependencies = {
  runApifyActorSync?: typeof runApifyActorSync;
};

export const LIVE_REQUEST_TIMEOUT_MS = 20_000;

export function isPlatformLiveCheckEnabled(rawValue: string | undefined): boolean {
  return rawValue?.trim().toLowerCase() !== "false";
}

function firstString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pickField(item: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (key in item) {
      return item[key];
    }
  }

  return undefined;
}

function coerceLiveFlag(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true" || lower === "live" || lower === "on_air") {
      return true;
    }
  }

  if (typeof value === "number") {
    return value > 0;
  }

  return false;
}

export type LiveFieldHints = {
  liveKeys: readonly string[];
  titleKeys: readonly string[];
  urlKeys: readonly string[];
};

export function parseApifyLiveItem(
  item: unknown,
  fallbackUrl: string,
  hints: LiveFieldHints,
): LiveCheckResult {
  if (!item || typeof item !== "object") {
    return { isLive: false, url: fallbackUrl };
  }

  const record = item as Record<string, unknown>;
  const isLive = coerceLiveFlag(pickField(record, hints.liveKeys));
  const title = firstString(pickField(record, hints.titleKeys));
  const url = firstString(pickField(record, hints.urlKeys)) ?? fallbackUrl;

  return {
    isLive,
    title: isLive ? title : undefined,
    url,
  };
}
