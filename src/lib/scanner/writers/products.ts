import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, TablesInsert } from "@/types/database";

export type ProductWriterInput = {
  marketplace: string;
  externalId: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  price: number;
};

type PersistedProductRow = {
  id: string;
  marketplace: string;
  external_id: string | null;
};

export type ProductWriterResult = {
  byExternalKey: Map<string, string>;
};

export function buildProductExternalKey(marketplace: string, externalId: string): string {
  return `${marketplace}:${externalId.trim().toLowerCase()}`;
}

function mapToProductInsert(input: ProductWriterInput, scannedAtIso: string): TablesInsert<"products"> {
  return {
    marketplace: input.marketplace,
    external_id: input.externalId,
    name: input.name,
    category: input.category,
    image_url: input.imageUrl,
    last_price: input.price,
    last_seen_at: scannedAtIso,
  };
}

export async function upsertProducts(
  supabase: SupabaseClient<Database>,
  products: ProductWriterInput[],
  scannedAtIso: string,
): Promise<ProductWriterResult> {
  if (products.length === 0) {
    return { byExternalKey: new Map() };
  }

  const payloadByKey = new Map<string, TablesInsert<"products">>();
  for (const product of products) {
    payloadByKey.set(
      buildProductExternalKey(product.marketplace, product.externalId),
      mapToProductInsert(product, scannedAtIso),
    );
  }

  const payload = Array.from(payloadByKey.values());
  const { data, error } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "marketplace,external_id" })
    .select("id, marketplace, external_id");

  if (error) {
    throw new Error(`Failed to upsert products: ${error.message}`);
  }

  const byExternalKey = new Map<string, string>();
  for (const row of (data ?? []) as PersistedProductRow[]) {
    if (!row.external_id) {
      continue;
    }

    byExternalKey.set(buildProductExternalKey(row.marketplace, row.external_id), row.id);
  }

  return { byExternalKey };
}
