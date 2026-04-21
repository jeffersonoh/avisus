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

const TIKTOK_LIVE_HINTS: LiveFieldHints = {
  liveKeys: ["isLive", "is_live", "liveStatus", "live_status", "live", "isLiveBroadcast"],
  titleKeys: ["liveTitle", "live_title", "title", "roomTitle", "room_title"],
  urlKeys: ["liveUrl", "live_url", "roomUrl", "room_url", "shareUrl", "url"],
};

function getTikTokActorId(): string | null {
  const raw = process.env.APIFY_TIKTOK_ACTOR_ID?.trim();
  return raw && raw.length > 0 ? raw : null;
}

function buildActorInput(seller: LiveCheckSellerInput): Record<string, unknown> {
  const handle = seller.sellerUsername.trim().replace(/^@+/, "");

  return {
    usernames: [handle],
    profiles: [`@${handle}`],
    profileUrls: [seller.sellerUrl],
    resultsPerPage: 1,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  };
}

export async function checkTikTokLive(
  seller: LiveCheckSellerInput,
  dependencies: LiveCheckDependencies = {},
): Promise<LiveCheckResult> {
  if (!isPlatformLiveCheckEnabled(process.env.ENABLE_TIKTOK_LIVE)) {
    return {
      isLive: false,
      url: seller.sellerUrl,
    };
  }

  const actorId = getTikTokActorId();
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
    return parseApifyLiveItem(firstItem, seller.sellerUrl, TIKTOK_LIVE_HINTS);
  } catch {
    return {
      isLive: false,
      url: seller.sellerUrl,
    };
  }
}
