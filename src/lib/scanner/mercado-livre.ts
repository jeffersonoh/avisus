import { MercadoLivreAuthError, getMercadoLivreAccessToken } from "@/lib/scanner/ml-auth";

const ML_SEARCH_URL = "https://api.mercadolibre.com/sites/MLB/search";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_5XX_RETRIES = 2;

export type Product = {
  marketplace: "Mercado Livre";
  externalId: string;
  name: string;
  price: number;
  originalPrice: number;
  discountPct: number;
  freight: number;
  freightFree: boolean;
  unitsSold: number | null;
  category: string | null;
  buyUrl: string;
  imageUrl: string | null;
};

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

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toHttpsUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }

  return url;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateDiscountPct(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || price < 0 || price >= originalPrice) {
    return 0;
  }

  return roundToTwo(((originalPrice - price) / originalPrice) * 100);
}

function mapSearchResultToProduct(searchResult: unknown): Product | null {
  if (!isRecord(searchResult)) {
    return null;
  }

  const externalId = readString(searchResult.id);
  const name = readString(searchResult.title);
  const price = readNumber(searchResult.price);
  const buyUrl = readString(searchResult.permalink);

  if (!externalId || !name || price === null || price < 0 || !buyUrl) {
    return null;
  }

  const rawOriginalPrice = readNumber(searchResult.original_price);
  const originalPrice =
    rawOriginalPrice !== null && rawOriginalPrice > 0 && rawOriginalPrice >= price
      ? rawOriginalPrice
      : price;

  const shipping = isRecord(searchResult.shipping) ? searchResult.shipping : null;
  const freightFree = shipping?.free_shipping === true;
  const freightCost = readNumber(shipping?.cost);
  const freight = freightCost !== null && freightCost > 0 ? roundToTwo(freightCost) : 0;

  const unitsSoldRaw = readNumber(searchResult.sold_quantity);
  const unitsSold = unitsSoldRaw !== null && unitsSoldRaw >= 0 ? Math.trunc(unitsSoldRaw) : null;

  const category = readString(searchResult.category_id);
  const imageUrl = toHttpsUrl(readString(searchResult.thumbnail));

  return {
    marketplace: "Mercado Livre",
    externalId,
    name,
    price: roundToTwo(price),
    originalPrice: roundToTwo(originalPrice),
    discountPct: calculateDiscountPct(price, originalPrice),
    freight,
    freightFree,
    unitsSold,
    category,
    buyUrl,
    imageUrl,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildSearchUrl(term: string): string {
  const url = new URL(ML_SEARCH_URL);
  url.searchParams.set("q", term);
  url.searchParams.set("limit", "50");
  return url.toString();
}

async function performSearchRequest(term: string, accessToken: string): Promise<Response> {
  return fetchWithTimeout(
    buildSearchUrl(term),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
    REQUEST_TIMEOUT_MS,
  );
}

async function requestSearchWithRetries(term: string, accessToken: string): Promise<Response | null> {
  for (let attempt = 0; attempt <= MAX_5XX_RETRIES; attempt += 1) {
    let response: Response;

    try {
      response = await performSearchRequest(term, accessToken);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error(`[scanner][ml] search timeout for term "${term}".`);
      } else {
        console.error(`[scanner][ml] search request failed for term "${term}".`);
      }

      return null;
    }

    if (response.status >= 500 && response.status <= 599) {
      if (attempt < MAX_5XX_RETRIES) {
        continue;
      }

      console.error(
        `[scanner][ml] search failed with ${response.status} after ${MAX_5XX_RETRIES} retries for term "${term}".`,
      );
      return null;
    }

    return response;
  }

  return null;
}

async function parseResults(response: Response): Promise<Product[]> {
  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    return [];
  }

  const results = payload.results;
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .map((result) => mapSearchResultToProduct(result))
    .filter((product): product is Product => product !== null);
}

export async function searchByTerm(term: string): Promise<Product[]> {
  const normalizedTerm = term.trim();
  if (!normalizedTerm) {
    return [];
  }

  const firstAccessToken = await getMercadoLivreAccessToken();
  let response = await requestSearchWithRetries(normalizedTerm, firstAccessToken);

  if (response?.status === 401) {
    const refreshedToken = await getMercadoLivreAccessToken({ forceRefresh: true });
    response = await requestSearchWithRetries(normalizedTerm, refreshedToken);
  }

  if (response?.status === 401) {
    console.error(`[scanner][ml] persistent 401 when searching term "${normalizedTerm}".`);
    throw new MercadoLivreAuthError("Mercado Livre authentication failed with persistent 401.");
  }

  if (!response) {
    return [];
  }

  if (!response.ok) {
    console.error(
      `[scanner][ml] search returned status ${response.status} for term "${normalizedTerm}".`,
    );
    return [];
  }

  try {
    return await parseResults(response);
  } catch {
    console.error(`[scanner][ml] unable to parse search response for term "${normalizedTerm}".`);
    return [];
  }
}
