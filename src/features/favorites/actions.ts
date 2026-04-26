"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { appActionError, type AppActionError } from "@/lib/errors";
import {
  parseFavoriteSellerUrl,
  type FavoriteSellerPlatform,
} from "@/lib/scanner/live/url-parser";
import { enforcePlanLimit } from "@/lib/plan-enforce";
import { normalizePlan } from "@/lib/plan-limits";
import { createServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type FavoriteSellerRow = Database["public"]["Tables"]["favorite_sellers"]["Row"];

export type FavoriteSellerActionItem = Pick<
  FavoriteSellerRow,
  | "id"
  | "seller_name"
  | "seller_url"
  | "seller_username"
  | "is_live"
  | "last_live_at"
  | "last_checked_at"
  | "created_at"
> & {
  platform: FavoriteSellerPlatform;
};

export type AddFavoriteSellerResult =
  | { ok: true; seller: FavoriteSellerActionItem }
  | { ok: false; error: AppActionError };

export type RemoveFavoriteSellerResult =
  | { ok: true; id: string }
  | { ok: false; error: AppActionError };

export type ListFavoriteSellersResult =
  | { ok: true; sellers: FavoriteSellerActionItem[] }
  | { ok: false; error: AppActionError };

const addFavoriteSellerSchema = z
  .string()
  .trim()
  .url("Informe uma URL valida.")
  .refine(
    (value) => parseFavoriteSellerUrl(value) !== null,
    "Use link da Shopee ou TikTok com username valido.",
  );

const removeFavoriteSellerSchema = z.object({
  id: z.string().uuid("Vendedor invalido para remocao."),
});

function mapUnknownError(): AppActionError {
  return appActionError("UNKNOWN", "Nao foi possivel salvar agora. Tente novamente em instantes.");
}

function mapDuplicateError(): AppActionError {
  return appActionError("DUPLICATE", "Esse vendedor ja esta nos seus favoritos.");
}

async function getAuthenticatedClient() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      error: appActionError("UNAUTHORIZED", "Sessao invalida. Faca login novamente."),
    };
  }

  return { supabase, user, error: null };
}

async function enforceFavoriteSellerLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AppActionError | null> {

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return mapUnknownError();
  }

  const { count, error: countError } = await supabase
    .from("favorite_sellers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    return mapUnknownError();
  }

  return enforcePlanLimit({
    plan: normalizePlan(profile.plan),
    currentCount: count ?? 0,
    limitKey: "maxFavoriteSellers",
    message: "Voce atingiu o limite de vendedores favoritos do seu plano.",
  });
}

export async function addFavoriteSeller(rawUrl: string): Promise<AddFavoriteSellerResult> {
  const parsedUrl = addFavoriteSellerSchema.safeParse(rawUrl);
  if (!parsedUrl.success) {
    return {
      ok: false,
      error: appActionError(
        "VALIDATION_ERROR",
        parsedUrl.error.issues[0]?.message ?? "Informe uma URL valida.",
      ),
    };
  }

  const parsedSeller = parseFavoriteSellerUrl(parsedUrl.data);
  if (!parsedSeller) {
    return {
      ok: false,
      error: appActionError("VALIDATION_ERROR", "Use link da Shopee ou TikTok com username valido."),
    };
  }

  const { supabase, user, error: authError } = await getAuthenticatedClient();
  if (authError || !user) {
    return { ok: false, error: authError ?? mapUnknownError() };
  }

  const limitError = await enforceFavoriteSellerLimit(supabase, user.id);
  if (limitError) {
    return { ok: false, error: limitError };
  }

  const { data, error } = await supabase
    .from("favorite_sellers")
    .insert({
      user_id: user.id,
      platform: parsedSeller.platform,
      seller_username: parsedSeller.sellerUsername,
      seller_url: parsedSeller.sellerUrl,
    })
    .select(
      "id, platform, seller_name, seller_url, seller_username, is_live, last_live_at, last_checked_at, created_at",
    )
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { ok: false, error: mapDuplicateError() };
    }
    return { ok: false, error: mapUnknownError() };
  }

  if (data.platform !== "shopee" && data.platform !== "tiktok") {
    return { ok: false, error: mapUnknownError() };
  }

  revalidatePath("/favoritos");
  return {
    ok: true,
    seller: {
      id: data.id,
      platform: data.platform,
      seller_name: data.seller_name,
      seller_url: data.seller_url,
      seller_username: data.seller_username,
      is_live: data.is_live,
      last_live_at: data.last_live_at,
      last_checked_at: data.last_checked_at,
      created_at: data.created_at,
    },
  };
}

export async function removeFavoriteSeller(rawId: string): Promise<RemoveFavoriteSellerResult> {
  const parsedId = removeFavoriteSellerSchema.safeParse({ id: rawId });
  if (!parsedId.success) {
    return {
      ok: false,
      error: appActionError(
        "VALIDATION_ERROR",
        parsedId.error.issues[0]?.message ?? "Vendedor invalido para remocao.",
      ),
    };
  }

  const { supabase, user, error: authError } = await getAuthenticatedClient();
  if (authError || !user) {
    return { ok: false, error: authError ?? mapUnknownError() };
  }

  const { data, error } = await supabase
    .from("favorite_sellers")
    .delete()
    .eq("id", parsedId.data.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: mapUnknownError() };
  }

  if (!data) {
    return {
      ok: false,
      error: appActionError("NOT_FOUND", "Vendedor nao encontrado para remocao."),
    };
  }

  revalidatePath("/favoritos");
  return { ok: true, id: data.id };
}

export async function listFavoriteSellers(): Promise<ListFavoriteSellersResult> {
  const { supabase, user, error: authError } = await getAuthenticatedClient();
  if (authError || !user) {
    return { ok: false, error: authError ?? mapUnknownError() };
  }

  const { data, error } = await supabase
    .from("favorite_sellers")
    .select(
      "id, platform, seller_name, seller_url, seller_username, is_live, last_live_at, last_checked_at, created_at",
    )
    .eq("user_id", user.id)
    .order("is_live", { ascending: false })
    .order("last_live_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: mapUnknownError() };
  }

  const sellers: FavoriteSellerActionItem[] = [];
  for (const seller of data ?? []) {
    if (seller.platform !== "shopee" && seller.platform !== "tiktok") {
      continue;
    }

    sellers.push({
      id: seller.id,
      platform: seller.platform,
      seller_name: seller.seller_name,
      seller_url: seller.seller_url,
      seller_username: seller.seller_username,
      is_live: seller.is_live,
      last_live_at: seller.last_live_at,
      last_checked_at: seller.last_checked_at,
      created_at: seller.created_at,
    });
  }

  return { ok: true, sellers };
}
