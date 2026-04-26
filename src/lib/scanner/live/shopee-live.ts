import { runApifyActorSync as defaultRunApifyActorSync } from "./apify";
import {
  LIVE_REQUEST_TIMEOUT_MS,
  type LiveCheckDependencies,
  type LiveCheckResult,
  type LiveCheckSellerInput,
  type LiveFieldHints,
  isPlatformLiveCheckEnabled,
  parseApifyLiveItem,
} from "./common";

const SHOPEE_LIVE_HINTS: LiveFieldHints = {
  liveKeys: ["isLive", "is_live", "liveStatus", "live_status", "onAir", "on_air", "live"],
  titleKeys: ["liveTitle", "live_title", "title", "sessionTitle", "session_title", "name"],
  urlKeys: ["liveUrl", "live_url", "sessionUrl", "session_url", "shareUrl", "url"],
};

function getShopeeActorId(): string | null {
  const raw = process.env.APIFY_SHOPEE_ACTOR_ID?.trim();
  return raw && raw.length > 0 ? raw : null;
}

function buildActorInput(seller: LiveCheckSellerInput): Record<string, unknown> {
  const handle = seller.sellerUsername.trim().replace(/^@+/, "");

  return {
    usernames: [handle],
    sellerUrls: [seller.sellerUrl],
    profileUrls: [seller.sellerUrl],
    resultsPerPage: 1,
  };
}

export async function checkShopeeLive(
  seller: LiveCheckSellerInput,
  dependencies: LiveCheckDependencies = {},
): Promise<LiveCheckResult> {
  if (!isPlatformLiveCheckEnabled(process.env.ENABLE_SHOPEE_LIVE)) {
    return {
      isLive: false,
      url: seller.sellerUrl,
    };
  }

  const actorId = getShopeeActorId();
  if (!actorId) {
    return {
      isLive: false,
      url: seller.sellerUrl,
    };
  }

  const runActor = dependencies.runApifyActorSync ?? defaultRunApifyActorSync;

  try {
    const items = await runActor(actorId, buildActorInput(seller), {
      timeoutMs: LIVE_REQUEST_TIMEOUT_MS,
    });

    const firstItem = items[0];
    return parseApifyLiveItem(firstItem, seller.sellerUrl, SHOPEE_LIVE_HINTS);
  } catch {
    return {
      isLive: false,
      url: seller.sellerUrl,
    };
  }
}
