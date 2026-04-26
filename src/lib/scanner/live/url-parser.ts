export type FavoriteSellerPlatform = "shopee" | "tiktok";

export type ParsedFavoriteSellerUrl = {
  platform: FavoriteSellerPlatform;
  sellerUsername: string;
  sellerUrl: string;
};

const SHOPEE_HOSTS = new Set(["shopee.com.br", "www.shopee.com.br"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);

function isValidSellerUsername(value: string): boolean {
  return /^[a-z0-9._-]{2,50}$/i.test(value);
}

export function parseFavoriteSellerUrl(rawUrl: string): ParsedFavoriteSellerUrl | null {
  try {
    const url = new URL(rawUrl.trim());
    const protocol = url.protocol.toLowerCase();
    if (protocol !== "https:" && protocol !== "http:") {
      return null;
    }

    const host = url.hostname.toLowerCase();
    const firstPathSegment = url.pathname
      .split("/")
      .filter((segment) => segment.length > 0)[0];

    if (!firstPathSegment) {
      return null;
    }

    if (SHOPEE_HOSTS.has(host) && !firstPathSegment.startsWith("@")) {
      const sellerUsername = firstPathSegment.toLowerCase();
      if (!isValidSellerUsername(sellerUsername)) {
        return null;
      }

      return {
        platform: "shopee",
        sellerUsername,
        sellerUrl: `https://shopee.com.br/${sellerUsername}`,
      };
    }

    if (TIKTOK_HOSTS.has(host) && firstPathSegment.startsWith("@")) {
      const sellerUsername = firstPathSegment.slice(1).toLowerCase();
      if (!isValidSellerUsername(sellerUsername)) {
        return null;
      }

      return {
        platform: "tiktok",
        sellerUsername,
        sellerUrl: `https://www.tiktok.com/@${sellerUsername}`,
      };
    }

    return null;
  } catch {
    return null;
  }
}
