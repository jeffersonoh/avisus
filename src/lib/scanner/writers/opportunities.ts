import type { SupabaseClient } from "@supabase/supabase-js";

import type { OpportunityQuality } from "@/lib/scanner/constants";
import { calculateMargin } from "@/lib/scanner/margin-calculator";
import type { Database, TablesInsert } from "@/types/database";

import { buildProductExternalKey } from "./products";

const DEFAULT_MARKETPLACE_FEES: Record<string, number> = {
  "Mercado Livre": 15,
  "Magazine Luiza": 16,
};

type ExistingOpportunityRow = {
  id: string;
  marketplace: string;
  external_id: string | null;
};

type PersistedOpportunityRow = {
  id: string;
  marketplace: string;
  external_id: string | null;
};

export type OpportunityWriterInput = {
  productId: string;
  marketplace: string;
  externalId: string;
  name: string;
  price: number;
  originalPrice: number;
  discountPct: number;
  freight: number;
  freightFree: boolean;
  category: string | null;
  buyUrl: string;
  imageUrl: string | null;
  expiresAt?: string | null;
};

type MarginChannelInput = {
  channel: string;
  market_price: number;
  fee_pct: number;
};

type OpportunityUpsertEntry = {
  input: OpportunityWriterInput;
  externalKey: string;
  margins: {
    channels: Array<MarginChannelInput & { net_margin: number }>;
    margin_best: number | null;
    margin_best_channel: string | null;
    quality: OpportunityQuality | null;
  };
};

export type OpportunityWriterResult = {
  id: string;
  externalKey: string;
  isNew: boolean;
  quality: OpportunityQuality | null;
  marginBest: number | null;
  marginBestChannel: string | null;
  channelMargins: Array<MarginChannelInput & { net_margin: number }>;
};

function resolveFeesMap(feesByMarketplace: Map<string, number>): Map<string, number> {
  if (feesByMarketplace.size > 0) {
    return feesByMarketplace;
  }

  return new Map(Object.entries(DEFAULT_MARKETPLACE_FEES));
}

function mapToOpportunityInsert(entry: OpportunityUpsertEntry): TablesInsert<"opportunities"> {
  return {
    product_id: entry.input.productId,
    external_id: entry.input.externalId,
    name: entry.input.name,
    marketplace: entry.input.marketplace,
    price: entry.input.price,
    original_price: entry.input.originalPrice,
    discount_pct: entry.input.discountPct,
    freight: entry.input.freight,
    freight_free: entry.input.freightFree,
    margin_best: entry.margins.margin_best,
    margin_best_channel: entry.margins.margin_best_channel,
    quality: entry.margins.quality,
    category: entry.input.category,
    buy_url: entry.input.buyUrl,
    image_url: entry.input.imageUrl,
    expires_at: entry.input.expiresAt ?? null,
    status: "active",
  };
}

function buildMarginChannels(
  input: OpportunityWriterInput,
  feesByMarketplace: Map<string, number>,
): MarginChannelInput[] {
  const marketPriceBase = input.originalPrice > 0 ? input.originalPrice : input.price;

  return Array.from(feesByMarketplace.entries()).map(([channel, feePct]) => ({
    channel,
    market_price: marketPriceBase,
    fee_pct: feePct,
  }));
}

function buildUpsertEntries(
  inputs: OpportunityWriterInput[],
  feesByMarketplace: Map<string, number>,
): OpportunityUpsertEntry[] {
  const resolvedFees = resolveFeesMap(feesByMarketplace);

  return inputs.map((input) => {
    const channels = buildMarginChannels(input, resolvedFees);
    const marginResult = calculateMargin({
      price: input.price,
      freight: input.freight,
      freight_free: input.freightFree,
      channels,
    });

    return {
      input,
      externalKey: buildProductExternalKey(input.marketplace, input.externalId),
      margins: {
        channels: marginResult.channels,
        margin_best: marginResult.margin_best,
        margin_best_channel: marginResult.margin_best_channel,
        quality: marginResult.quality,
      },
    };
  });
}

async function fetchExistingOpportunities(
  supabase: SupabaseClient<Database>,
  entries: OpportunityUpsertEntry[],
): Promise<Map<string, string>> {
  const marketplaces = Array.from(new Set(entries.map((entry) => entry.input.marketplace)));
  const externalIds = Array.from(new Set(entries.map((entry) => entry.input.externalId)));

  const { data, error } = await supabase
    .from("opportunities")
    .select("id, marketplace, external_id")
    .in("marketplace", marketplaces)
    .in("external_id", externalIds);

  if (error) {
    throw new Error(`Failed to load existing opportunities: ${error.message}`);
  }

  const existingByKey = new Map<string, string>();
  for (const row of (data ?? []) as ExistingOpportunityRow[]) {
    if (!row.external_id) {
      continue;
    }

    existingByKey.set(buildProductExternalKey(row.marketplace, row.external_id), row.id);
  }

  return existingByKey;
}

async function upsertOpportunityRows(
  supabase: SupabaseClient<Database>,
  entries: OpportunityUpsertEntry[],
): Promise<Map<string, string>> {
  const payload = entries.map(mapToOpportunityInsert);
  const { data, error } = await supabase
    .from("opportunities")
    .upsert(payload, { onConflict: "marketplace,external_id" })
    .select("id, marketplace, external_id");

  if (error) {
    throw new Error(`Failed to upsert opportunities: ${error.message}`);
  }

  const persistedByKey = new Map<string, string>();
  for (const row of (data ?? []) as PersistedOpportunityRow[]) {
    if (!row.external_id) {
      continue;
    }

    persistedByKey.set(buildProductExternalKey(row.marketplace, row.external_id), row.id);
  }

  return persistedByKey;
}

async function upsertChannelMargins(
  supabase: SupabaseClient<Database>,
  entries: OpportunityUpsertEntry[],
  persistedByKey: Map<string, string>,
): Promise<void> {
  const payload: TablesInsert<"channel_margins">[] = [];

  for (const entry of entries) {
    const opportunityId = persistedByKey.get(entry.externalKey);
    if (!opportunityId) {
      continue;
    }

    for (const margin of entry.margins.channels) {
      payload.push({
        opportunity_id: opportunityId,
        channel: margin.channel,
        market_price: margin.market_price,
        fee_pct: margin.fee_pct,
        net_margin: margin.net_margin,
      });
    }
  }

  if (payload.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("channel_margins")
    .upsert(payload, { onConflict: "opportunity_id,channel" });

  if (error) {
    throw new Error(`Failed to upsert channel margins: ${error.message}`);
  }
}

export async function upsertOpportunitiesWithMargins(
  supabase: SupabaseClient<Database>,
  inputs: OpportunityWriterInput[],
  feesByMarketplace: Map<string, number>,
): Promise<OpportunityWriterResult[]> {
  if (inputs.length === 0) {
    return [];
  }

  const entries = buildUpsertEntries(inputs, feesByMarketplace);
  const existingByKey = await fetchExistingOpportunities(supabase, entries);
  const persistedByKey = await upsertOpportunityRows(supabase, entries);
  await upsertChannelMargins(supabase, entries, persistedByKey);

  const results: OpportunityWriterResult[] = [];
  for (const entry of entries) {
    const opportunityId = persistedByKey.get(entry.externalKey);
    if (!opportunityId) {
      continue;
    }

    results.push({
      id: opportunityId,
      externalKey: entry.externalKey,
      isNew: !existingByKey.has(entry.externalKey),
      quality: entry.margins.quality,
      marginBest: entry.margins.margin_best,
      marginBestChannel: entry.margins.margin_best_channel,
      channelMargins: entry.margins.channels,
    });
  }

  return results;
}
