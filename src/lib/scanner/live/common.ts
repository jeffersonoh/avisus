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
  fetcher?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  randomInt?: (min: number, max: number) => number;
};

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export const LIVE_REQUEST_TIMEOUT_MS = 10_000;

function defaultRandomInt(min: number, max: number): number {
  const span = max - min + 1;
  return Math.floor(Math.random() * span) + min;
}

export function isPlatformLiveCheckEnabled(rawValue: string | undefined): boolean {
  return rawValue?.trim().toLowerCase() !== "false";
}

export async function waitRandomDelay(dependencies: LiveCheckDependencies = {}): Promise<void> {
  const sleep = dependencies.sleep ?? (async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const randomInt = dependencies.randomInt ?? defaultRandomInt;
  const delayMs = randomInt(100, 500);
  await sleep(delayMs);
}

export function pickRandomUserAgent(dependencies: LiveCheckDependencies = {}): string {
  const randomInt = dependencies.randomInt ?? defaultRandomInt;
  const index = randomInt(0, USER_AGENTS.length - 1);
  return USER_AGENTS[index] ?? DEFAULT_USER_AGENT;
}

export async function fetchTextWithTimeout(
  url: string,
  dependencies: LiveCheckDependencies = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LIVE_REQUEST_TIMEOUT_MS);
  const fetcher = dependencies.fetcher ?? fetch;

  try {
    return await fetcher(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "user-agent": pickRandomUserAgent(dependencies),
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
