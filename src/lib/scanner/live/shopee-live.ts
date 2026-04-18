import { fetchScrapingBeeHtml } from "@/lib/scanner/scraping-bee";

import {
  type LiveCheckDependencies,
  type LiveCheckResult,
  type LiveCheckSellerInput,
  fetchTextWithTimeout,
  isPlatformLiveCheckEnabled,
  waitRandomDelay,
} from "./common";

const LIVE_MARKERS = [/\bao vivo\b/i, /\blive\b/i, /is_live/i, /watching_count/i];

function extractLiveTitle(html: string): string | undefined {
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (ogTitle && ogTitle.trim().length > 0) {
    return ogTitle.trim();
  }

  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return title?.trim();
}

function parseLiveFromHtml(html: string, fallbackUrl: string): LiveCheckResult {
  const isLive = LIVE_MARKERS.some((pattern) => pattern.test(html));
  const liveUrl = html.match(/https:\/\/shopee\.com\.br\/[^"'\s<>]*live[^"'\s<>]*/i)?.[0] ?? fallbackUrl;

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
