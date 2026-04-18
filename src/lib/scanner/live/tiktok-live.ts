import { fetchScrapingBeeHtml } from "@/lib/scanner/scraping-bee";

import {
  type LiveCheckDependencies,
  type LiveCheckResult,
  type LiveCheckSellerInput,
  fetchTextWithTimeout,
  isPlatformLiveCheckEnabled,
  waitRandomDelay,
} from "./common";

const LIVE_MARKERS = [
  /"isLive"\s*:\s*true/i,
  /"roomId"\s*:/i,
  /liveRoom/i,
  /\bao vivo\b/i,
];

function extractLiveTitle(html: string): string | undefined {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return title?.trim();
}

function parseLiveFromHtml(html: string, fallbackUrl: string): LiveCheckResult {
  const isLive = LIVE_MARKERS.some((pattern) => pattern.test(html));
  const liveUrl = html.match(/https:\/\/www\.tiktok\.com\/[^"'\s<>]*\/live[^"'\s<>]*/i)?.[0] ?? fallbackUrl;

  return {
    isLive,
    title: isLive ? extractLiveTitle(html) : undefined,
    url: liveUrl,
  };
}

async function checkViaPublicLayer(
  seller: LiveCheckSellerInput,
  dependencies: LiveCheckDependencies,
): Promise<LiveCheckResult | null> {
  await waitRandomDelay(dependencies);

  try {
    const response = await fetchTextWithTimeout(seller.sellerUrl, dependencies);
    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return parseLiveFromHtml(html, seller.sellerUrl);
  } catch {
    return null;
  }
}

async function checkViaScrapingBeeLayer(
  seller: LiveCheckSellerInput,
  dependencies: LiveCheckDependencies,
): Promise<LiveCheckResult> {
  await waitRandomDelay(dependencies);

  const html = await fetchScrapingBeeHtml(seller.sellerUrl, {
    timeoutMs: 10_000,
  });

  return parseLiveFromHtml(html, seller.sellerUrl);
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

  const publicResult = await checkViaPublicLayer(seller, dependencies);
  if (publicResult) {
    return publicResult;
  }

  try {
    return await checkViaScrapingBeeLayer(seller, dependencies);
  } catch {
    return {
      isLive: false,
      url: seller.sellerUrl,
    };
  }
}
