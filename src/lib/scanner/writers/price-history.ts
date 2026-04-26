import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, TablesInsert } from "@/types/database";

export type PriceHistoryWriterInput = {
  productId: string;
  marketplace: string;
  price: number;
  originalPrice: number;
  discountPct: number;
  unitsSold: number | null;
};

function normalizeUnitsSold(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.trunc(value);
}

function mapToPriceHistoryInsert(input: PriceHistoryWriterInput): TablesInsert<"price_history"> {
  return {
    product_id: input.productId,
    marketplace: input.marketplace,
    price: input.price,
    original_price: input.originalPrice,
    discount_pct: input.discountPct,
    units_sold: normalizeUnitsSold(input.unitsSold),
  };
}

export async function insertPriceHistorySnapshots(
  supabase: SupabaseClient<Database>,
  snapshots: PriceHistoryWriterInput[],
): Promise<number> {
  if (snapshots.length === 0) {
    return 0;
  }

  const payload = snapshots.map(mapToPriceHistoryInsert);
  const { error } = await supabase.from("price_history").insert(payload);

  if (error) {
    throw new Error(`Failed to insert price history snapshots: ${error.message}`);
  }

  return payload.length;
}
