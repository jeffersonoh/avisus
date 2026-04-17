import type { SupabaseClient } from "@supabase/supabase-js";

import { PLAN_LIMITS, normalizePlan, type Plan } from "@/lib/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Database, Tables } from "@/types/database";

import { searchByTerm as searchMagazineLuizaByTerm, type Product as MagazineLuizaProduct } from "./magazine-luiza";
import { searchByTerm as searchMercadoLivreByTerm, type Product as MercadoLivreProduct } from "./mercado-livre";
import { upsertOpportunitiesWithMargins } from "./writers/opportunities";
import { insertPriceHistorySnapshots, type PriceHistoryWriterInput } from "./writers/price-history";
import { buildProductExternalKey, upsertProducts } from "./writers/products";

type ScannerProduct = MercadoLivreProduct | MagazineLuizaProduct;
type ActiveInterest = Pick<Tables<"interests">, "id" | "user_id" | "term" | "last_scanned_at">;
type ProfileSnapshot = Pick<Tables<"profiles">, "id" | "plan" | "min_discount_pct">;

type MatcherLogger = Pick<Console, "error" | "warn" | "info">;

const DEFAULT_MIN_DISCOUNT_PCT = 15;
const SECONDARY_MATCH_THRESHOLD = 0.3;
const MATCHER_MARKETPLACES = ["Mercado Livre", "Magazine Luiza"] as const;

const DEFAULT_MARKETPLACE_FEES: Record<string, number> = {
  "Mercado Livre": 15,
  "Magazine Luiza": 16,
};

export type OpportunityMatcherResult = {
  scanned: number;
  new_opportunities: number;
  alerts_sent: number;
  pipeline: {
    eligible_interests: number;
    processed_opportunities: number;
    secondary_match_threshold: number;
    marketplaces: readonly string[];
  };
};

type RunOpportunityMatcherOptions = {
  supabase?: SupabaseClient<Database>;
  now?: Date;
  logger?: MatcherLogger;
  searchMercadoLivre?: (term: string) => Promise<MercadoLivreProduct[]>;
  searchMagazineLuiza?: (term: string) => Promise<MagazineLuizaProduct[]>;
};

type SecondaryMatchInput = {
  opportunityName: string;
  interests: ActiveInterest[];
  threshold?: number;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTrigrams(value: string): Set<string> {
  const normalized = normalizeText(value);
  const padded = `  ${normalized} `;

  if (padded.length <= 3) {
    return new Set([padded.padEnd(3, " ")]);
  }

  const trigrams = new Set<string>();
  for (let index = 0; index <= padded.length - 3; index += 1) {
    trigrams.add(padded.slice(index, index + 3));
  }

  return trigrams;
}

export function calculateTrigramSimilarity(left: string, right: string): number {
  const leftTrigrams = toTrigrams(left);
  const rightTrigrams = toTrigrams(right);

  if (leftTrigrams.size === 0 || rightTrigrams.size === 0) {
    return 0;
  }

  let intersectionSize = 0;
  for (const trigram of leftTrigrams) {
    if (rightTrigrams.has(trigram)) {
      intersectionSize += 1;
    }
  }

  return (2 * intersectionSize) / (leftTrigrams.size + rightTrigrams.size);
}

export function isInterestEligibleForScan(
  lastScannedAt: string | null,
  plan: Plan,
  now: Date,
): boolean {
  if (!lastScannedAt) {
    return true;
  }

  const lastScanDate = new Date(lastScannedAt);
  if (Number.isNaN(lastScanDate.getTime())) {
    return true;
  }

  const elapsedMinutes = (now.getTime() - lastScanDate.getTime()) / (60 * 1000);
  return elapsedMinutes >= PLAN_LIMITS[plan].scanIntervalMin;
}

export function dedupeProductsByExternalKey(products: ScannerProduct[]): ScannerProduct[] {
  const seenKeys = new Set<string>();
  const dedupedProducts: ScannerProduct[] = [];

  for (const product of products) {
    const key = buildProductExternalKey(product.marketplace, product.externalId);
    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    dedupedProducts.push(product);
  }

  return dedupedProducts;
}

export function findSecondaryInterestMatches(input: SecondaryMatchInput): ActiveInterest[] {
  const threshold = input.threshold ?? SECONDARY_MATCH_THRESHOLD;

  return input.interests.filter((interest) => {
    const similarity = calculateTrigramSimilarity(input.opportunityName, interest.term);
    return similarity >= threshold;
  });
}

function resolveMinDiscountPct(value: number | null): number {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return DEFAULT_MIN_DISCOUNT_PCT;
  }

  return value;
}

function buildOpportunityKey(product: ScannerProduct): string {
  return buildProductExternalKey(product.marketplace, product.externalId);
}

async function fetchActiveInterests(
  supabase: SupabaseClient<Database>,
): Promise<ActiveInterest[]> {
  const { data, error } = await supabase
    .from("interests")
    .select("id, user_id, term, last_scanned_at")
    .eq("active", true);

  if (error) {
    throw new Error(`Failed to load interests: ${error.message}`);
  }

  return data ?? [];
}

async function fetchProfilesByIds(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<Map<string, ProfileSnapshot>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, plan, min_discount_pct")
    .in("id", userIds);

  if (error) {
    throw new Error(`Failed to load profiles for matcher: ${error.message}`);
  }

  const profileMap = new Map<string, ProfileSnapshot>();
  for (const profile of data ?? []) {
    profileMap.set(profile.id, profile);
  }

  return profileMap;
}

async function fetchMarketplaceFees(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, number>> {
  const feeMap = new Map<string, number>();

  const { data, error } = await supabase
    .from("marketplace_fees")
    .select("marketplace, category, fee_pct");

  if (error) {
    return new Map(Object.entries(DEFAULT_MARKETPLACE_FEES));
  }

  const rows = data ?? [];
  for (const row of rows) {
    if (row.category === "default") {
      feeMap.set(row.marketplace, row.fee_pct);
    }
  }

  if (feeMap.size === 0) {
    for (const row of rows) {
      if (!feeMap.has(row.marketplace)) {
        feeMap.set(row.marketplace, row.fee_pct);
      }
    }
  }

  if (feeMap.size === 0) {
    return new Map(Object.entries(DEFAULT_MARKETPLACE_FEES));
  }

  return feeMap;
}

async function collectProductsByTerm(
  term: string,
  logger: MatcherLogger,
  searchMercadoLivre: (inputTerm: string) => Promise<MercadoLivreProduct[]>,
  searchMagazineLuiza: (inputTerm: string) => Promise<MagazineLuizaProduct[]>,
): Promise<ScannerProduct[]> {
  const settledSearches = await Promise.allSettled([
    searchMercadoLivre(term),
    searchMagazineLuiza(term),
  ]);

  const products: ScannerProduct[] = [];
  for (const searchResult of settledSearches) {
    if (searchResult.status === "fulfilled") {
      products.push(...searchResult.value);
      continue;
    }

    logger.error(`[scanner][matcher] marketplace search failed for term "${term}".`);
  }

  return dedupeProductsByExternalKey(products);
}

async function enqueueUniqueAlerts(
  supabase: SupabaseClient<Database>,
  opportunityId: string,
  userIds: string[],
  logger: MatcherLogger,
): Promise<number> {
  let queuedAlerts = 0;

  for (const userId of userIds) {
    const { error } = await supabase.from("alerts").insert({
      user_id: userId,
      opportunity_id: opportunityId,
      channel: "web",
      status: "pending",
    });

    if (!error) {
      queuedAlerts += 1;
      continue;
    }

    if (error.code === "23505") {
      continue;
    }

    logger.error(
      `[scanner][matcher] failed inserting alert for user ${userId} and opportunity ${opportunityId}.`,
    );
  }

  return queuedAlerts;
}

async function updateLastScannedAt(
  supabase: SupabaseClient<Database>,
  interestId: string,
  scannedAt: string,
  logger: MatcherLogger,
): Promise<void> {
  const { error } = await supabase
    .from("interests")
    .update({ last_scanned_at: scannedAt })
    .eq("id", interestId);

  if (error) {
    logger.warn(`[scanner][matcher] failed to update last_scanned_at for interest ${interestId}.`);
  }
}

export async function runOpportunityMatcher(
  options: RunOpportunityMatcherOptions = {},
): Promise<OpportunityMatcherResult> {
  const supabase = options.supabase ?? createServiceRoleClient();
  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const logger = options.logger ?? console;

  const searchMercadoLivre = options.searchMercadoLivre ?? searchMercadoLivreByTerm;
  const searchMagazineLuiza = options.searchMagazineLuiza ?? searchMagazineLuizaByTerm;

  const activeInterests = await fetchActiveInterests(supabase);
  const userIds = Array.from(new Set(activeInterests.map((interest) => interest.user_id)));
  const profilesById = await fetchProfilesByIds(supabase, userIds);
  const feesByMarketplace = await fetchMarketplaceFees(supabase);

  const eligibleInterests = activeInterests.filter((interest) => {
    const profile = profilesById.get(interest.user_id);
    if (!profile) {
      return false;
    }

    return isInterestEligibleForScan(
      interest.last_scanned_at,
      normalizePlan(profile.plan),
      now,
    );
  });

  let scanned = 0;
  let newOpportunities = 0;
  let queuedAlerts = 0;
  let processedOpportunities = 0;

  const seenOpportunityKeys = new Set<string>();

  for (const interest of eligibleInterests) {
    try {
      const profile = profilesById.get(interest.user_id);
      if (!profile) {
        continue;
      }

      const minDiscountPct = resolveMinDiscountPct(profile.min_discount_pct);
      const products = await collectProductsByTerm(
        interest.term,
        logger,
        searchMercadoLivre,
        searchMagazineLuiza,
      );

      const filteredProducts = products.filter(
        (product) => product.discountPct >= minDiscountPct,
      );

      const productWriterResult = await upsertProducts(
        supabase,
        filteredProducts.map((product) => ({
          marketplace: product.marketplace,
          externalId: product.externalId,
          name: product.name,
          category: product.category,
          imageUrl: product.imageUrl,
          price: product.price,
        })),
        nowIso,
      );

      const productsWithIds: Array<{ product: ScannerProduct; productId: string }> = [];
      const priceHistorySnapshots: PriceHistoryWriterInput[] = [];

      for (const product of filteredProducts) {
        const productId = productWriterResult.byExternalKey.get(buildOpportunityKey(product));
        if (!productId) {
          logger.warn(
            `[scanner][matcher] product id not returned for ${product.marketplace}/${product.externalId}.`,
          );
          continue;
        }

        productsWithIds.push({ product, productId });
        priceHistorySnapshots.push({
          productId,
          marketplace: product.marketplace,
          price: product.price,
          originalPrice: product.originalPrice,
          discountPct: product.discountPct,
          unitsSold: product.unitsSold,
        });
      }

      try {
        await insertPriceHistorySnapshots(supabase, priceHistorySnapshots);
      } catch {
        logger.error(
          `[scanner][matcher] failed writing price_history snapshots for interest ${interest.id}.`,
        );
      }

      const opportunityCandidates: Array<{
        opportunityKey: string;
        product: ScannerProduct;
        productId: string;
      }> = [];

      for (const { product, productId } of productsWithIds) {
        const opportunityKey = buildOpportunityKey(product);
        if (seenOpportunityKeys.has(opportunityKey)) {
          continue;
        }

        seenOpportunityKeys.add(opportunityKey);
        opportunityCandidates.push({ opportunityKey, product, productId });
      }

      const persistedOpportunities = await upsertOpportunitiesWithMargins(
        supabase,
        opportunityCandidates.map(({ product, productId }) => ({
          productId,
          marketplace: product.marketplace,
          externalId: product.externalId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          discountPct: product.discountPct,
          freight: product.freight,
          freightFree: product.freightFree,
          category: product.category,
          buyUrl: product.buyUrl,
          imageUrl: product.imageUrl,
          expiresAt: null,
        })),
        feesByMarketplace,
      );

      const productsByOpportunityKey = new Map(
        opportunityCandidates.map(({ opportunityKey, product }) => [opportunityKey, product]),
      );

      for (const persistedOpportunity of persistedOpportunities) {
        processedOpportunities += 1;

        if (persistedOpportunity.quality === null) {
          continue;
        }

        if (persistedOpportunity.isNew) {
          newOpportunities += 1;
        }

        const sourceProduct = productsByOpportunityKey.get(persistedOpportunity.externalKey);
        if (!sourceProduct) {
          continue;
        }

        const matchedInterests = findSecondaryInterestMatches({
          opportunityName: sourceProduct.name,
          interests: activeInterests,
          threshold: SECONDARY_MATCH_THRESHOLD,
        });

        const matchedUserIds = new Set<string>([interest.user_id]);
        for (const matchedInterest of matchedInterests) {
          matchedUserIds.add(matchedInterest.user_id);
        }

        queuedAlerts += await enqueueUniqueAlerts(
          supabase,
          persistedOpportunity.id,
          Array.from(matchedUserIds),
          logger,
        );
      }
    } catch {
      logger.error(`[scanner][matcher] failed processing interest ${interest.id}.`);
    } finally {
      scanned += 1;
      await updateLastScannedAt(supabase, interest.id, nowIso, logger);
    }
  }

  return {
    scanned,
    new_opportunities: newOpportunities,
    alerts_sent: queuedAlerts,
    pipeline: {
      eligible_interests: eligibleInterests.length,
      processed_opportunities: processedOpportunities,
      secondary_match_threshold: SECONDARY_MATCH_THRESHOLD,
      marketplaces: MATCHER_MARKETPLACES,
    },
  };
}
