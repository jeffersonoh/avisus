const APIFY_API_BASE = "https://api.apify.com/v2";
const DEFAULT_TIMEOUT_MS = 20_000;

export class ApifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApifyError";
  }
}

export class ApifyTimeoutError extends ApifyError {
  constructor(message: string) {
    super(message);
    this.name = "ApifyTimeoutError";
  }
}

export class ApifyUnauthorizedError extends ApifyError {
  constructor(message: string) {
    super(message);
    this.name = "ApifyUnauthorizedError";
  }
}

export type RunApifyActorSyncOptions = {
  timeoutMs?: number;
  fetcher?: typeof fetch;
};

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getApifyToken(): string {
  const token = readNonEmptyString(process.env.APIFY_TOKEN);
  if (!token) {
    throw new ApifyError(
      "Apify token is missing. Configure APIFY_TOKEN on server runtime.",
    );
  }

  return token;
}

function normalizeActorId(actorId: string): string {
  const trimmed = actorId.trim();
  if (!trimmed) {
    throw new ApifyError("Apify actor id is required.");
  }

  return trimmed.replace("/", "~");
}

function buildActorSyncUrl(actorId: string, token: string, timeoutSeconds: number): string {
  const normalized = normalizeActorId(actorId);
  const url = new URL(`${APIFY_API_BASE}/acts/${encodeURIComponent(normalized)}/run-sync-get-dataset-items`);
  url.searchParams.set("token", token);
  url.searchParams.set("timeout", String(timeoutSeconds));
  return url.toString();
}

export async function runApifyActorSync<TItem = unknown>(
  actorId: string,
  input: Record<string, unknown>,
  options: RunApifyActorSyncOptions = {},
): Promise<TItem[]> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutSeconds = Math.max(5, Math.ceil(timeoutMs / 1000));
  const token = getApifyToken();
  const requestUrl = buildActorSyncUrl(actorId, token, timeoutSeconds);
  const fetcher = options.fetcher ?? fetch;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetcher(requestUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApifyTimeoutError(
        `Apify actor ${actorId} timed out after ${timeoutMs}ms.`,
      );
    }

    throw new ApifyError(`Apify actor ${actorId} request failed.`);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) {
    throw new ApifyUnauthorizedError(
      `Apify authorization failed with status ${response.status}.`,
    );
  }

  if (!response.ok) {
    throw new ApifyError(
      `Apify actor ${actorId} returned status ${response.status}.`,
    );
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new ApifyError(
      `Apify actor ${actorId} returned unexpected payload shape.`,
    );
  }

  return payload as TItem[];
}
