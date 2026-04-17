const SCRAPING_BEE_API_URL = "https://app.scrapingbee.com/api/v1/";
const DEFAULT_TIMEOUT_MS = 20_000;

export class ScrapingBeeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScrapingBeeError";
  }
}

export class ScrapingBeeTimeoutError extends ScrapingBeeError {
  constructor(message: string) {
    super(message);
    this.name = "ScrapingBeeTimeoutError";
  }
}

export class ScrapingBeeUnauthorizedError extends ScrapingBeeError {
  constructor(message: string) {
    super(message);
    this.name = "ScrapingBeeUnauthorizedError";
  }
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getScrapingBeeApiKey(): string {
  const apiKey = readNonEmptyString(process.env.SCRAPINGBEE_API_KEY);
  if (!apiKey) {
    throw new ScrapingBeeError(
      "ScrapingBee API key is missing. Configure SCRAPINGBEE_API_KEY on server runtime.",
    );
  }

  return apiKey;
}

function buildScrapingBeeUrl(targetUrl: string, apiKey: string): string {
  const requestUrl = new URL(SCRAPING_BEE_API_URL);
  requestUrl.searchParams.set("api_key", apiKey);
  requestUrl.searchParams.set("url", targetUrl);
  requestUrl.searchParams.set("render_js", "true");
  requestUrl.searchParams.set("premium_proxy", "false");
  return requestUrl.toString();
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchScrapingBeeHtml(
  targetUrl: string,
  options?: {
    timeoutMs?: number;
  },
): Promise<string> {
  const normalizedUrl = readNonEmptyString(targetUrl);
  if (!normalizedUrl) {
    throw new ScrapingBeeError("Target URL is required for ScrapingBee requests.");
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const apiKey = getScrapingBeeApiKey();
  const requestUrl = buildScrapingBeeUrl(normalizedUrl, apiKey);

  let response: Response;
  try {
    response = await fetchWithTimeout(
      requestUrl,
      {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml",
        },
      },
      timeoutMs,
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ScrapingBeeTimeoutError(
        `ScrapingBee request timed out after ${timeoutMs}ms for URL ${normalizedUrl}.`,
      );
    }

    throw new ScrapingBeeError(`ScrapingBee request failed for URL ${normalizedUrl}.`);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ScrapingBeeUnauthorizedError(
        `ScrapingBee authorization failed with status ${response.status}.`,
      );
    }

    throw new ScrapingBeeError(`ScrapingBee request failed with status ${response.status}.`);
  }

  const html = await response.text();
  if (!html.trim()) {
    throw new ScrapingBeeError("ScrapingBee returned an empty HTML document.");
  }

  return html;
}
