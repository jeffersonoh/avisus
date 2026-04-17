"use client";

import { useState } from "react";
import { z } from "zod";

import {
  addFavoriteSeller as addFavoriteSellerAction,
  removeFavoriteSeller as removeFavoriteSellerAction,
} from "@/features/favorites/actions";
import type { AppActionError } from "@/lib/errors";
import {
  parseFavoriteSellerUrl,
  type FavoriteSellerPlatform,
} from "@/lib/scanner/live/url-parser";
import { getPlanLimit, isUnlimited, type Plan } from "@/lib/plan-limits";
import type { Database } from "@/types/database";

type FavoriteSellerRow = Database["public"]["Tables"]["favorite_sellers"]["Row"];

export type FavoriteSellerItem = Pick<
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

export type FavoriteSellerActionResult =
  | { ok: true }
  | {
      ok: false;
      reason: "validation" | "duplicate" | "limit" | "unknown";
      message: string;
    };

export const SellerUrlSchema = z
  .string()
  .trim()
  .url("Informe uma URL válida.")
  .refine(
    (value) => parseFavoriteSellerUrl(value) !== null,
    "Use link da Shopee ou TikTok com username válido.",
  );

export function parseSellerUrl(rawUrl: string): {
  platform: FavoriteSellerPlatform;
  sellerUsername: string;
  sellerUrl: string;
} | null {
  return parseFavoriteSellerUrl(rawUrl);
}

function sortSellers(items: FavoriteSellerItem[]): FavoriteSellerItem[] {
  return [...items].sort((a, b) => {
    if (a.is_live !== b.is_live) {
      return a.is_live ? -1 : 1;
    }

    const aLive = a.last_live_at ? Date.parse(a.last_live_at) : 0;
    const bLive = b.last_live_at ? Date.parse(b.last_live_at) : 0;
    if (aLive !== bLive) {
      return bLive - aLive;
    }

    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

function isDuplicateSeller(
  items: FavoriteSellerItem[],
  platform: FavoriteSellerPlatform,
  sellerUsername: string,
): boolean {
  return items.some(
    (item) => item.platform === platform && item.seller_username.toLowerCase() === sellerUsername,
  );
}

const DUPLICATE_ERROR_MESSAGE = "Esse vendedor já está nos seus favoritos.";
const UNKNOWN_ERROR_MESSAGE = "Não foi possível salvar agora. Tente novamente em instantes.";

type UseFavoriteSellersInput = {
  plan: Plan;
  initialSellers: FavoriteSellerItem[];
};

function mapError(error: AppActionError): FavoriteSellerActionResult {
  if (error.code === "VALIDATION_ERROR") {
    return { ok: false, reason: "validation", message: error.message };
  }

  if (error.code === "DUPLICATE") {
    return { ok: false, reason: "duplicate", message: error.message };
  }

  if (error.code === "LIMIT_REACHED") {
    return { ok: false, reason: "limit", message: error.message };
  }

  return { ok: false, reason: "unknown", message: error.message || UNKNOWN_ERROR_MESSAGE };
}

export function useFavoriteSellers({ plan, initialSellers }: UseFavoriteSellersInput) {
  const [sellers, setSellers] = useState<FavoriteSellerItem[]>(() => sortSellers(initialSellers));

  const maxFavoriteSellers = getPlanLimit(plan, "maxFavoriteSellers");
  const unlimitedPlan = isUnlimited(maxFavoriteSellers);
  const limitReached = !unlimitedPlan && sellers.length >= maxFavoriteSellers;
  const remainingSlots = unlimitedPlan ? null : Math.max(0, maxFavoriteSellers - sellers.length);

  async function addSeller(rawUrl: string): Promise<FavoriteSellerActionResult> {
    const parsedUrl = SellerUrlSchema.safeParse(rawUrl);
    if (!parsedUrl.success) {
      return {
        ok: false,
        reason: "validation",
        message: parsedUrl.error.issues[0]?.message ?? "Informe uma URL válida.",
      };
    }

    const parsedSeller = parseSellerUrl(parsedUrl.data);
    if (!parsedSeller) {
      return {
        ok: false,
        reason: "validation",
        message: "Use link da Shopee ou TikTok com username válido.",
      };
    }

    if (isDuplicateSeller(sellers, parsedSeller.platform, parsedSeller.sellerUsername)) {
      return { ok: false, reason: "duplicate", message: DUPLICATE_ERROR_MESSAGE };
    }

    const result = await addFavoriteSellerAction(parsedSeller.sellerUrl);
    if (!result.ok) {
      return mapError(result.error);
    }

    const newSeller: FavoriteSellerItem = {
      id: result.seller.id,
      platform: result.seller.platform,
      seller_name: result.seller.seller_name,
      seller_url: result.seller.seller_url,
      seller_username: result.seller.seller_username,
      is_live: result.seller.is_live,
      last_live_at: result.seller.last_live_at,
      last_checked_at: result.seller.last_checked_at,
      created_at: result.seller.created_at,
    };

    setSellers((prev) => sortSellers([...prev, newSeller]));
    return { ok: true };
  }

  async function removeSeller(id: string): Promise<FavoriteSellerActionResult> {
    const result = await removeFavoriteSellerAction(id);
    if (!result.ok) {
      return mapError(result.error);
    }

    setSellers((prev) => prev.filter((item) => item.id !== id));
    return { ok: true };
  }

  return {
    sellers,
    maxFavoriteSellers,
    unlimitedPlan,
    limitReached,
    remainingSlots,
    addSeller,
    removeSeller,
  };
}
