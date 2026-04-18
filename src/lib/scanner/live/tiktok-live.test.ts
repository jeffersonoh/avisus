import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchScrapingBeeHtml } from "@/lib/scanner/scraping-bee";

import { checkTikTokLive } from "./tiktok-live";

vi.mock("@/lib/scanner/scraping-bee", () => ({
  fetchScrapingBeeHtml: vi.fn(),
}));

describe("tiktok live client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns no-op when ENABLE_TIKTOK_LIVE is false", async () => {
    vi.stubEnv("ENABLE_TIKTOK_LIVE", "false");
    const fetcher = vi.fn();

    const result = await checkTikTokLive(
      {
        sellerUsername: "canal",
        sellerUrl: "https://www.tiktok.com/@canal",
      },
      { fetcher: fetcher as unknown as typeof fetch },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://www.tiktok.com/@canal",
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(fetchScrapingBeeHtml).not.toHaveBeenCalled();
  });

  it("falls back to ScrapingBee when public layer fails with 503", async () => {
    const fetcher = vi.fn(async () =>
      new Response("service unavailable", {
        status: 503,
      })) as unknown as typeof fetch;

    vi.mocked(fetchScrapingBeeHtml).mockResolvedValue(
      '<html><title>Canal em live</title><script>{"isLive":true}</script></html>',
    );

    const result = await checkTikTokLive(
      {
        sellerUsername: "canal",
        sellerUrl: "https://www.tiktok.com/@canal",
      },
      {
        fetcher,
        sleep: async () => undefined,
        randomInt: () => 220,
      },
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetchScrapingBeeHtml).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      isLive: true,
      title: "Canal em live",
      url: "https://www.tiktok.com/@canal",
    });
  });
});
