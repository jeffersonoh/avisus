import { z } from "zod";

const marketplaceFilterSchema = z.enum(["all", "Mercado Livre", "Shopee", "Magazine Luiza"]);

const categoryOrRegion = z.preprocess((val) => {
  if (val == null) return "all";
  const s = String(val).trim();
  return s === "" ? "all" : s;
}, z.string().min(1));

export const dashboardSearchParamsSchema = z.object({
  marketplace: marketplaceFilterSchema.default("all"),
  category: categoryOrRegion.default("all"),
  discount: z.enum(["all", "d15", "d30", "d45"]).default("all"),
  margin: z.enum(["all", "m20", "m30", "m40"]).default("all"),
  region: categoryOrRegion.default("all"),
  sort: z.enum(["margin", "discount", "date"]).default("margin"),
});

export type DashboardFilters = z.infer<typeof dashboardSearchParamsSchema>;

type RawSearch = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function parseDashboardSearchParams(raw: RawSearch): DashboardFilters {
  const candidate = {
    marketplace: first(raw.marketplace),
    category: first(raw.category),
    discount: first(raw.discount),
    margin: first(raw.margin),
    region: first(raw.region),
    sort: first(raw.sort),
  };

  const parsed = dashboardSearchParamsSchema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }

  return dashboardSearchParamsSchema.parse({});
}

/** Parse a partir de pares string (ex.: `URLSearchParams` já materializado). */
export function parseDashboardSearchParamsFromEntries(
  entries: Iterable<[string, string]>,
): DashboardFilters {
  const record: Record<string, string> = {};
  for (const [k, v] of entries) {
    record[k] = v;
  }
  return parseDashboardSearchParams(record);
}

export function serializeDashboardFilters(filters: DashboardFilters): string {
  const params = new URLSearchParams();

  if (filters.marketplace !== "all") {
    params.set("marketplace", filters.marketplace);
  }
  if (filters.category !== "all") {
    params.set("category", filters.category);
  }
  if (filters.discount !== "all") {
    params.set("discount", filters.discount);
  }
  if (filters.margin !== "all") {
    params.set("margin", filters.margin);
  }
  if (filters.region !== "all") {
    params.set("region", filters.region);
  }
  if (filters.sort !== "margin") {
    params.set("sort", filters.sort);
  }

  return params.toString();
}
