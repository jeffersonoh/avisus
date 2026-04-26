import "server-only";

import { unstable_cache } from "next/cache";

import { createServiceRoleClient } from "@/lib/supabase/service";

export type CachedProfile = { plan: string | null; name: string | null } | null;

export const profileCacheTag = (userId: string) => `profile:${userId}`;

export function getCachedProfile(userId: string): Promise<CachedProfile> {
  return unstable_cache(
    async (): Promise<CachedProfile> => {
      const supabase = createServiceRoleClient();
      const { data } = await supabase
        .from("profiles")
        .select("plan, name")
        .eq("id", userId)
        .maybeSingle();
      return data ?? null;
    },
    ["profile", userId],
    { tags: [profileCacheTag(userId)], revalidate: 60 },
  )();
}
