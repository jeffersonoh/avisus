import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { FavoriteSellerList } from "@/features/favorites/FavoriteSellerList";
import type { FavoriteSellerItem } from "@/features/favorites/hooks";
import { normalizePlan } from "@/lib/plan-limits";
import { AUTH_USER_ID_HEADER } from "@/lib/supabase/middleware";
import { createServerClient } from "@/lib/supabase/server";

export default async function FavoritosPage() {
  const userId = (await headers()).get(AUTH_USER_ID_HEADER);
  if (!userId) {
    redirect("/login");
  }

  const supabase = await createServerClient();

  const [{ data: profile }, { data: sellersData }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
    supabase
      .from("favorite_sellers")
      .select(
        "id, platform, seller_name, seller_url, seller_username, is_live, last_live_at, last_checked_at, created_at",
      )
      .eq("user_id", userId)
      .order("is_live", { ascending: false })
      .order("last_live_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  const initialSellers: FavoriteSellerItem[] = [];
  for (const item of sellersData ?? []) {
    if (item.platform !== "shopee" && item.platform !== "tiktok") {
      continue;
    }

    initialSellers.push({
      id: item.id,
      platform: item.platform,
      seller_name: item.seller_name,
      seller_url: item.seller_url,
      seller_username: item.seller_username,
      is_live: item.is_live,
      last_live_at: item.last_live_at,
      last_checked_at: item.last_checked_at,
      created_at: item.created_at,
    });
  }

  return (
    <FavoriteSellerList plan={normalizePlan(profile?.plan)} initialSellers={initialSellers} />
  );
}
