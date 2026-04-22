"use server";

import { headers } from "next/headers";

import { AUTH_USER_ID_HEADER } from "@/lib/supabase/middleware";
import { createServerClient } from "@/lib/supabase/server";

import { fetchDashboardOpportunities } from "./db-query";
import { parseDashboardSearchParams } from "./search-params";
import type { Opportunity } from "./types";

export type LoadMoreResult =
  | { ok: true; opportunities: Opportunity[]; nextCursor: string | null }
  | { ok: false; error: string };

export async function loadMoreOpportunities(
  rawFilters: Record<string, string | undefined>,
  cursor: string,
): Promise<LoadMoreResult> {
  const userId = (await headers()).get(AUTH_USER_ID_HEADER);
  if (!userId) {
    return { ok: false, error: "UNAUTHORIZED" };
  }

  if (!cursor) {
    return { ok: false, error: "MISSING_CURSOR" };
  }

  const filters = parseDashboardSearchParams(rawFilters);
  const supabase = await createServerClient();
  const { opportunities, nextCursor } = await fetchDashboardOpportunities(
    supabase,
    userId,
    filters,
    cursor,
  );

  return { ok: true, opportunities, nextCursor };
}
