import { CheerioAPI, load } from "cheerio";
import { AnyNode } from "domhandler";

import { ScrapingBeeTimeoutError, fetchScrapingBeeHtml } from "@/lib/scanner/scraping-bee";

const ML_BASE_URL = "https://www.mercadolivre.com.br";
const ML_LISTING_HOST = "https://lista.mercadolivre.com.br";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;

type MercadoLivreScrapeMode = "managed" | "disabled";

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

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildSearchUrl(term: string): string {
  // Formato público do ML: https://lista.mercadolivre.com.br/<termo-com-hifens>
  const slug = term
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${ML_LISTING_HOST}/${slug}`;
}

function getScrapeMode(): MercadoLivreScrapeMode {
  const rawMode = readNonEmptyString(process.env.MERCADO_LIVRE_SCRAPE_MODE)?.toLowerCase();
  if (rawMode === "managed" || rawMode === "disabled") {
    return rawMode;
  }

  if (rawMode) {
    console.warn(
      `[scanner][ml] invalid MERCADO_LIVRE_SCRAPE_MODE="${rawMode}". Falling back to "managed".`,
    );
  }

  return "managed";
}

function toAbsoluteUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value, ML_BASE_URL).toString();
  } catch {
    return null;
  }
}

function parseBrazilianPrice(rawText: string | null): number | null {
  if (!rawText) return null;
  const normalized = rawText.replace(/\s+/g, " ");
  const match = normalized.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})?)/);
  if (!match?.[1]) return null;
  const numeric = Number(match[1].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return roundToTwo(numeric);
}

function calculateDiscountPct(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || price < 0 || price >= originalPrice) return 0;
  return roundToTwo(((originalPrice - price) / originalPrice) * 100);
}

function parseAndesMoneyAmount($: CheerioAPI, element: AnyNode): number | null {
  // O Mercado Livre renderiza preços com `.andes-money-amount` contendo
  // `.andes-money-amount__fraction` (parte inteira, com ponto como separador de
  // milhar — ex.: "8.095") e opcionalmente `.andes-money-amount__cents`.
  // Extraímos dígitos diretos dos elementos para evitar ambiguidade entre
  // separador de milhar e decimal no parseamento textual.
  const wrapper = $(element);
  if (wrapper.length === 0) return null;

  const fractionText = readNonEmptyString(wrapper.find(".andes-money-amount__fraction").first().text());
  if (!fractionText) {
    return parseBrazilianPrice(readNonEmptyString(wrapper.text()));
  }

  const integerDigits = fractionText.replace(/\D/g, "");
  if (!integerDigits) return null;

  const centsText = readNonEmptyString(wrapper.find(".andes-money-amount__cents").first().text());
  const centsDigits = centsText ? centsText.replace(/\D/g, "").slice(0, 2).padEnd(2, "0") : "";

  const numeric = Number(centsDigits ? `${integerDigits}.${centsDigits}` : integerDigits);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return roundToTwo(numeric);
}

function parseUnitsSold(rawText: string | null): number | null {
  if (!rawText) return null;
  // Ex.: "+50 vendidos", "2mil vendidos", "vendidos 120"
  const match = rawText.match(/(\d+(?:\.\d+)?)(mil)?/i);
  if (!match?.[1]) return null;
  const numeric = Number(match[1].replace(",", "."));
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  const scaled = match[2] ? numeric * 1000 : numeric;
  return Math.trunc(scaled);
}

function extractExternalId(buyUrl: string, name: string): string {
  // ML identifiers: MLB1234567890 ou MLB-1234567890
  const mlbMatch = buyUrl.match(/MLB-?(\d{6,})/i);
  if (mlbMatch?.[1]) return `MLB${mlbMatch[1]}`;

  const fromName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return fromName.length > 0 ? fromName : buyUrl;
}

function getFirstText($: CheerioAPI, card: AnyNode, selectors: string[]): string | null {
  for (const selector of selectors) {
    const text = readNonEmptyString($(card).find(selector).first().text());
    if (text) return text;
  }
  return null;
}

function getFirstAttr(
  $: CheerioAPI,
  card: AnyNode,
  selectors: string[],
  attrName: string,
): string | null {
  for (const selector of selectors) {
    const value = readNonEmptyString($(card).find(selector).first().attr(attrName));
    if (value) return value;
  }
  return null;
}

// Escopo de preço: apenas andes-money-amount dentro do bloco oficial de preço
// do card. Cai em fallback só quando nenhum container oficial é encontrado — e,
// nesse caso, exclui explicitamente descendentes de parcelas, que usam a mesma
// classe andes-money-amount e poluiriam a extração (ex.: "12x R$ 500").
const PRICE_CONTAINER_SELECTORS =
  ".poly-component__price .andes-money-amount, .poly-price__current .andes-money-amount, .ui-search-price__second-line .andes-money-amount";
const INSTALLMENT_EXCLUSION_SELECTOR =
  ".poly-component__installments, .poly-price__installments, .ui-search-installments, .ui-search-price__second-line__label";

function collectPriceContainers($: CheerioAPI, card: AnyNode): AnyNode[] {
  const scoped = $(card).find(PRICE_CONTAINER_SELECTORS).toArray();
  if (scoped.length > 0) return scoped;

  return $(card)
    .find(".andes-money-amount")
    .filter((_, element) => $(element).closest(INSTALLMENT_EXCLUSION_SELECTOR).length === 0)
    .toArray();
}

function pickProductCards($: CheerioAPI): AnyNode[] {
  // Selectors documentados. ML muda layout periodicamente — mantemos múltiplos.
  const cardSelectors = [
    "li.ui-search-layout__item",
    ".ui-search-result",
    '[data-testid="result"]',
  ];

  for (const selector of cardSelectors) {
    const cards = $(selector).toArray();
    if (cards.length > 0) return cards;
  }

  return [];
}

function mapCardToProduct($: CheerioAPI, card: AnyNode, index: number): Product | null {
  const titleSelectors = [
    ".poly-component__title",
    ".ui-search-item__title",
    "h2.poly-box",
    "h2.ui-search-item__title",
  ];
  const buyUrlSelectors = ["a.poly-component__title", "a.ui-search-link", "a.ui-search-item__group__element", "a[href]"];
  const imageSelectors = [
    "img.poly-component__picture",
    "img.ui-search-result-image__element",
    "img[src]",
    "img[data-src]",
  ];

  const name = getFirstText($, card, titleSelectors);
  const buyUrlRaw = getFirstAttr($, card, buyUrlSelectors, "href");
  const buyUrl = toAbsoluteUrl(buyUrlRaw);

  if (!name || !buyUrl) {
    console.warn(`[scanner][ml] unable to parse card ${index + 1}: missing name or buy_url.`);
    return null;
  }

  const priceContainers = collectPriceContainers($, card);
  let price: number | null = null;
  let originalPrice: number | null = null;

  for (const container of priceContainers) {
    const isPrevious = $(container).closest("s, .andes-money-amount--previous").length > 0;
    const parsed = parseAndesMoneyAmount($, container);
    if (parsed === null) continue;

    if (isPrevious) {
      if (originalPrice === null) originalPrice = parsed;
    } else if (price === null) {
      price = parsed;
    }
  }

  if (price === null) {
    console.warn(`[scanner][ml] unable to parse card ${index + 1}: missing price.`);
    return null;
  }

  const effectiveOriginalPrice =
    originalPrice !== null && originalPrice > 0 && originalPrice >= price ? originalPrice : price;

  const discountPct = calculateDiscountPct(price, effectiveOriginalPrice);

  const shippingText = readNonEmptyString(
    $(card).find(".poly-component__shipping, .ui-search-item__shipping, .ui-pb-highlight").text(),
  );
  const freightFree = shippingText !== null && /frete\s*gr[áa]tis/i.test(shippingText);

  const unitsSoldText = readNonEmptyString(
    $(card).find(".poly-component__sold, .ui-search-item__group--sold-quantity").text(),
  );
  const unitsSold = parseUnitsSold(unitsSoldText);

  const imageUrlRaw =
    getFirstAttr($, card, imageSelectors, "src") ?? getFirstAttr($, card, imageSelectors, "data-src");
  const imageUrl = toAbsoluteUrl(imageUrlRaw);

  return {
    marketplace: "Mercado Livre",
    externalId: extractExternalId(buyUrl, name),
    name,
    price,
    originalPrice: effectiveOriginalPrice,
    discountPct,
    freight: 0,
    freightFree,
    unitsSold,
    category: null,
    buyUrl,
    imageUrl,
  };
}

export function parseMercadoLivreSearchHtml(html: string): Product[] {
  const normalizedHtml = html.trim();
  if (!normalizedHtml) return [];

  const $ = load(normalizedHtml);
  const cards = pickProductCards($);

  if (cards.length === 0) {
    console.warn("[scanner][ml] no product cards found using configured selectors.");
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
        renderJs: false,
        premiumProxy: true,
        countryCode: "br",
      });
      return parseMercadoLivreSearchHtml(html);
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;
      if (!isLastAttempt) continue;

      if (error instanceof ScrapingBeeTimeoutError) {
        console.error(
          `[scanner][ml] managed mode timeout after ${REQUEST_TIMEOUT_MS}ms for term "${term}". Returning empty array.`,
        );
        return [];
      }

      console.error(
        `[scanner][ml] managed mode failed for term "${term}". Returning empty array.`,
      );
      return [];
    }
  }

  return [];
}

export async function searchByTerm(term: string): Promise<Product[]> {
  const normalizedTerm = term.trim();
  if (!normalizedTerm) return [];

  const mode = getScrapeMode();
  if (mode === "disabled") return [];

  return searchManagedByTerm(normalizedTerm);
}
