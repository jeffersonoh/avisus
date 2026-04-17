import { CheerioAPI, load } from "cheerio";
import { AnyNode } from "domhandler";

import { ScrapingBeeTimeoutError, fetchScrapingBeeHtml } from "@/lib/scanner/scraping-bee";

const MAGALU_BASE_URL = "https://www.magazineluiza.com.br";
const MAGALU_SEARCH_PATH = "/busca/";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;

type MagaluScrapeMode = "api" | "managed" | "disabled";

export type Product = {
  marketplace: "Magazine Luiza";
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

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildSearchUrl(term: string): string {
  const encodedTerm = encodeURIComponent(term.trim());
  return `${MAGALU_BASE_URL}${MAGALU_SEARCH_PATH}${encodedTerm}/`;
}

function getMagaluScrapeMode(): MagaluScrapeMode {
  const rawMode = readNonEmptyString(process.env.MAGALU_SCRAPE_MODE)?.toLowerCase();
  if (rawMode === "api" || rawMode === "managed" || rawMode === "disabled") {
    return rawMode;
  }

  if (rawMode) {
    console.warn(
      `[scanner][magalu] invalid MAGALU_SCRAPE_MODE="${rawMode}". Falling back to "managed".`,
    );
  }

  return "managed";
}

function toAbsoluteUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, MAGALU_BASE_URL).toString();
  } catch {
    return null;
  }
}

function normalizeExternalId(rawValue: string): string {
  const normalized = rawValue.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : rawValue.trim().toLowerCase();
}

function parseBrazilianPrice(rawText: string | null): number | null {
  if (!rawText) {
    return null;
  }

  const normalized = rawText.replace(/\s+/g, " ");
  const match = normalized.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})?)/);
  if (!match || !match[1]) {
    return null;
  }

  const numeric = Number(match[1].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  return roundToTwo(numeric);
}

function parseDiscountPct(rawText: string | null): number | null {
  if (!rawText) {
    return null;
  }

  const match = rawText.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
  if (!match || !match[1]) {
    return null;
  }

  const numeric = Number(match[1].replace(",", "."));
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  return roundToTwo(numeric);
}

function calculateDiscountPct(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || price < 0 || price >= originalPrice) {
    return 0;
  }

  return roundToTwo(((originalPrice - price) / originalPrice) * 100);
}

function getFirstText($: CheerioAPI, card: AnyNode, selectors: string[]): string | null {
  for (const selector of selectors) {
    const text = readNonEmptyString($(card).find(selector).first().text());
    if (text) {
      return text;
    }
  }

  return null;
}

function getFirstAttr($: CheerioAPI, card: AnyNode, selectors: string[], attrName: string): string | null {
  for (const selector of selectors) {
    const attrValue = readNonEmptyString($(card).find(selector).first().attr(attrName));
    if (attrValue) {
      return attrValue;
    }
  }

  return null;
}

function pickProductCards($: CheerioAPI): AnyNode[] {
  // Selectors documentados para reduzir fragilidade quando Magalu ajustar classes/data-testid.
  const cardSelectors = [
    '[data-testid="product-card-container"]',
    '[data-testid="product-card"]',
    "li.product-card",
  ];

  for (const selector of cardSelectors) {
    const cards = $(selector).toArray();
    if (cards.length > 0) {
      return cards;
    }
  }

  return [];
}

function extractExternalId($: CheerioAPI, card: AnyNode, buyUrl: string, name: string): string {
  const directId =
    readNonEmptyString($(card).attr("data-product-id")) ??
    readNonEmptyString($(card).attr("data-sku")) ??
    readNonEmptyString($(card).attr("data-id"));

  if (directId) {
    return normalizeExternalId(directId);
  }

  const fromBuyUrl = buyUrl.match(/\/(?:p|produto)\/([^/?#]+)/i)?.[1];
  if (fromBuyUrl) {
    return normalizeExternalId(fromBuyUrl);
  }

  return normalizeExternalId(name);
}

function mapCardToProduct($: CheerioAPI, card: AnyNode, index: number): Product | null {
  // Selectors documentados por campo para facilitar manutenção do parser.
  const titleSelectors = ['[data-testid="product-title"]', "h2", "h3", "a[title]"];
  const buyUrlSelectors = ["a[href]"];
  const priceSelectors = ['[data-testid="price-value"]', '[data-testid="price"]', '[data-testid="price-current"]'];
  const originalPriceSelectors = ['[data-testid="price-original"]', '[data-testid="price-before"]'];
  const discountSelectors = ['[data-testid="discount"]', '[data-testid="price-discount"]'];
  const imageSelectors = ["img[src]", "img[data-src]"];

  const name = getFirstText($, card, titleSelectors);
  const buyUrlRaw = getFirstAttr($, card, buyUrlSelectors, "href");
  const buyUrl = toAbsoluteUrl(buyUrlRaw);
  const price = parseBrazilianPrice(getFirstText($, card, priceSelectors));

  if (!name || !buyUrl || price === null) {
    console.warn(`[scanner][magalu] unable to parse card ${index + 1}: missing name, buy_url or price.`);
    return null;
  }

  const parsedOriginalPrice = parseBrazilianPrice(getFirstText($, card, originalPriceSelectors));
  const originalPrice =
    parsedOriginalPrice !== null && parsedOriginalPrice > 0 && parsedOriginalPrice >= price
      ? parsedOriginalPrice
      : price;

  const parsedDiscount = parseDiscountPct(getFirstText($, card, discountSelectors));
  const discountPct =
    parsedDiscount !== null && parsedDiscount >= 0
      ? parsedDiscount
      : calculateDiscountPct(price, originalPrice);

  const imageUrlRaw = getFirstAttr($, card, imageSelectors, "src") ?? getFirstAttr($, card, imageSelectors, "data-src");
  const imageUrl = toAbsoluteUrl(imageUrlRaw);

  return {
    marketplace: "Magazine Luiza",
    externalId: extractExternalId($, card, buyUrl, name),
    name,
    price,
    originalPrice,
    discountPct,
    freight: 0,
    freightFree: false,
    unitsSold: null,
    category: null,
    buyUrl,
    imageUrl,
  };
}

export function parseMagazineLuizaSearchHtml(html: string): Product[] {
  const normalizedHtml = html.trim();
  if (!normalizedHtml) {
    return [];
  }

  const $ = load(normalizedHtml);
  const cards = pickProductCards($);

  if (cards.length === 0) {
    console.warn("[scanner][magalu] no product cards found using configured selectors.");
    return [];
  }

  return cards
    .map((card, index) => mapCardToProduct($, card, index))
    .filter((product): product is Product => product !== null);
}

async function searchManagedByTerm(term: string): Promise<Product[]> {
  const searchUrl = buildSearchUrl(term);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const html = await fetchScrapingBeeHtml(searchUrl, {
        timeoutMs: REQUEST_TIMEOUT_MS,
      });

      return parseMagazineLuizaSearchHtml(html);
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;

      if (!isLastAttempt) {
        continue;
      }

      if (error instanceof ScrapingBeeTimeoutError) {
        console.error(
          `[scanner][magalu] managed mode timeout after ${REQUEST_TIMEOUT_MS}ms for term "${term}". Returning empty array.`,
        );
        return [];
      }

      console.error(
        `[scanner][magalu] managed mode failed for term "${term}". Returning empty array.`,
      );
      return [];
    }
  }

  return [];
}

async function searchApiPlaceholder(term: string): Promise<Product[]> {
  console.info(
    `[scanner][magalu] api mode placeholder enabled for term "${term}". Returning empty array until API integration is implemented.`,
  );
  return [];
}

export async function searchByTerm(term: string): Promise<Product[]> {
  const normalizedTerm = term.trim();
  if (!normalizedTerm) {
    return [];
  }

  const mode = getMagaluScrapeMode();
  if (mode === "disabled") {
    return [];
  }

  if (mode === "api") {
    return searchApiPlaceholder(normalizedTerm);
  }

  return searchManagedByTerm(normalizedTerm);
}
