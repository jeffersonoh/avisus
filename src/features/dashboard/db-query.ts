import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { DashboardFilters } from "./search-params";
import type { ChannelMargin, MarketplaceName, Opportunity, OpportunityQuality } from "./types";

const PAGE_SIZE = 20;

const FILTER_OPTIONS_RANGE_END = 9999;

type DbRow = Database["public"]["Tables"]["opportunities"]["Row"] & {
  channel_margins: Database["public"]["Tables"]["channel_margins"]["Row"][];
};

export type DashboardFilterOptions = {
  categories: string[];
  regions: string[];
};

export type KeysetCursor = { detectedAt: string; id: string };

export function encodeCursor(c: KeysetCursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

function decodeCursor(s: string): KeysetCursor | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "detectedAt" in parsed &&
      "id" in parsed &&
      typeof (parsed as Record<string, unknown>).detectedAt === "string" &&
      typeof (parsed as Record<string, unknown>).id === "string"
    ) {
      return parsed as KeysetCursor;
    }
    return null;
  } catch {
    return null;
  }
}

function formatExpires(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expirado";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export function mapDbRow(row: DbRow): Opportunity {
  const channelMargins: ChannelMargin[] = row.channel_margins.map((cm) => ({
    channel: cm.channel,
    marketPrice: cm.market_price,
    fee: cm.fee_pct,
    netMargin: cm.net_margin,
  }));

  return {
    id: row.id,
    name: row.name,
    marketplace: row.marketplace as MarketplaceName,
    imageUrl: row.image_url ?? "",
    price: row.price,
    originalPrice: row.original_price,
    freight: row.freight,
    freightFree: row.freight_free,
    margin: row.margin_best ?? 0,
    quality: (row.quality as OpportunityQuality) ?? "good",
    category: row.category ?? "",
    region: row.region_uf ?? "",
    city: row.region_city ?? "",
    expiresLabel: formatExpires(row.expires_at),
    hot: row.hot,
    buyUrl: row.buy_url,
    channelMargins,
    updatedAt: row.detected_at,
  };
}

function discountMin(d: DashboardFilters["discount"]): number | null {
  if (d === "d15") return 15;
  if (d === "d30") return 30;
  if (d === "d45") return 45;
  return null;
}

function marginMin(m: DashboardFilters["margin"]): number | null {
  if (m === "m20") return 20;
  if (m === "m30") return 30;
  if (m === "m40") return 40;
  return null;
}

export async function fetchDashboardOpportunities(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters: DashboardFilters,
  rawCursor?: string,
): Promise<{ opportunities: Opportunity[]; nextCursor: string | null }> {
  const [{ data: dismissed }, { data: interests }] = await Promise.all([
    supabase
      .from("user_opportunity_status")
      .select("opportunity_id")
      .eq("user_id", userId)
      .eq("status", "dismissed"),
    filters.myInterests
      ? supabase
          .from("interests")
          .select("term")
          .eq("user_id", userId)
          .eq("active", true)
      : Promise.resolve({ data: null }),
  ]);

  const dismissedIds = dismissed?.map((d) => d.opportunity_id) ?? [];

  let query = supabase
    .from("opportunities")
    .select("*, channel_margins(*)")
    .eq("status", "active");

  if (filters.marketplace !== "all") {
    query = query.eq("marketplace", filters.marketplace);
  }
  if (filters.category !== "all") {
    query = query.eq("category", filters.category);
  }
  const dMin = discountMin(filters.discount);
  if (dMin !== null) {
    query = query.gte("discount_pct", dMin);
  }
  const mMin = marginMin(filters.margin);
  if (mMin !== null) {
    query = query.gte("margin_best", mMin);
  }
  if (filters.region !== "all") {
    query = query.eq("region_uf", filters.region);
  }
  if (dismissedIds.length > 0) {
    query = query.not("id", "in", `(${dismissedIds.join(",")})`);
  }
  if (filters.myInterests && interests && interests.length > 0) {
    const orConditions = interests.map((i: { term: string }) => `name.ilike.%${i.term.replace(/%/g, "")}%`).join(",");
    query = query.or(orConditions);
  }

  // Paginação keyset: cursor aponta para o último detected_at da página anterior
  const cursor = rawCursor ? decodeCursor(rawCursor) : null;
  if (cursor) {
    query = query.lt("detected_at", cursor.detectedAt);
  }

  // Ordenação primária: sempre detected_at DESC para o keyset funcionar corretamente
  if (filters.sort === "margin") {
    query = query.order("margin_best", { ascending: false });
  } else if (filters.sort === "discount") {
    query = query.order("discount_pct", { ascending: false });
  }
  query = query
    .order("detected_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(PAGE_SIZE);

  const { data, error } = await query;
  if (error) {
    console.error("[dashboard] fetch error:", error.message);
    return { opportunities: [], nextCursor: null };
  }

  const rows = (data ?? []) as DbRow[];
  const opportunities = rows.map(mapDbRow);

  const lastRow = rows[rows.length - 1];
  const nextCursor =
    rows.length === PAGE_SIZE && lastRow
      ? encodeCursor({ detectedAt: lastRow.detected_at, id: lastRow.id })
      : null;

  return { opportunities, nextCursor };
}

export async function fetchDashboardFilterOptions(
  supabase: SupabaseClient<Database>,
): Promise<DashboardFilterOptions> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("category, region_uf")
    .eq("status", "active")
    .range(0, FILTER_OPTIONS_RANGE_END);

  if (error) {
    console.error("[dashboard] filter options fetch error:", error.message);
    return { categories: [], regions: [] };
  }

  const categories = new Set<string>();
  const regions = new Set<string>();

  for (const row of data ?? []) {
    const category = row.category?.trim();
    const region = row.region_uf?.trim().toUpperCase();

    if (category) {
      categories.add(category);
    }
    if (region) {
      regions.add(region);
    }
  }

  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b, "pt-BR")),
    regions: [...regions].sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}
