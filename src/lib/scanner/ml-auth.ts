const ML_OAUTH_TOKEN_URL = "https://api.mercadolibre.com/oauth/token";
const REQUEST_TIMEOUT_MS = 15_000;
const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 60_000;

type MercadoLivreCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

type RefreshTokenResponse = {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string | null;
};

type CachedAccessToken = {
  value: string;
  expiresAtEpochMs: number;
};

export class MercadoLivreAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MercadoLivreAuthError";
  }
}

let cachedAccessToken: CachedAccessToken | null = null;
let cachedRefreshToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readPositiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function getRequiredCredentials(): MercadoLivreCredentials {
  const clientId = readString(process.env.ML_CLIENT_ID);
  const clientSecret = readString(process.env.ML_CLIENT_SECRET);
  const refreshToken = readString(process.env.ML_REFRESH_TOKEN);

  if (!clientId || !clientSecret || !refreshToken) {
    throw new MercadoLivreAuthError(
      "Mercado Livre credentials are missing. Configure ML_CLIENT_ID, ML_CLIENT_SECRET and ML_REFRESH_TOKEN.",
    );
  }

  return { clientId, clientSecret, refreshToken };
}

function isCachedTokenValid(nowEpochMs: number): boolean {
  if (!cachedAccessToken) {
    return false;
  }

  return cachedAccessToken.expiresAtEpochMs - ACCESS_TOKEN_REFRESH_LEEWAY_MS > nowEpochMs;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
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

async function requestNewAccessToken(credentials: MercadoLivreCredentials): Promise<RefreshTokenResponse> {
  const refreshToken = cachedRefreshToken ?? credentials.refreshToken;

  const payload = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: refreshToken,
  });

  let response: Response;
  try {
    response = await fetchWithTimeout(
      ML_OAUTH_TOKEN_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload,
      },
      REQUEST_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new MercadoLivreAuthError("Mercado Livre OAuth refresh timed out after 15 seconds.");
    }

    throw new MercadoLivreAuthError("Mercado Livre OAuth refresh request failed.");
  }

  if (!response.ok) {
    throw new MercadoLivreAuthError(
      `Mercado Livre OAuth refresh failed with status ${response.status}.`,
    );
  }

  const body = (await response.json()) as unknown;
  if (!isRecord(body)) {
    throw new MercadoLivreAuthError("Mercado Livre OAuth response is invalid.");
  }

  const accessToken = readString(body.access_token);
  const expiresInSeconds = readPositiveNumber(body.expires_in);
  const rotatedRefreshToken = readString(body.refresh_token);

  if (!accessToken || !expiresInSeconds) {
    throw new MercadoLivreAuthError("Mercado Livre OAuth response is missing token fields.");
  }

  return {
    accessToken,
    expiresInSeconds,
    refreshToken: rotatedRefreshToken,
  };
}

async function refreshAccessToken(): Promise<string> {
  const credentials = getRequiredCredentials();

  if (!cachedRefreshToken) {
    cachedRefreshToken = credentials.refreshToken;
  }

  const refreshed = await requestNewAccessToken(credentials);
  cachedAccessToken = {
    value: refreshed.accessToken,
    expiresAtEpochMs: Date.now() + refreshed.expiresInSeconds * 1000,
  };

  if (refreshed.refreshToken) {
    cachedRefreshToken = refreshed.refreshToken;
  }

  return refreshed.accessToken;
}

export async function getMercadoLivreAccessToken(options?: {
  forceRefresh?: boolean;
}): Promise<string> {
  const forceRefresh = options?.forceRefresh ?? false;
  const nowEpochMs = Date.now();

  if (!forceRefresh && isCachedTokenValid(nowEpochMs) && cachedAccessToken) {
    return cachedAccessToken.value;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken();
  }

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
