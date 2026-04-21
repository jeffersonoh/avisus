import { afterEach, describe, expect, it, vi } from "vitest";

import { checkShopeeLive } from "./shopee-live";

describe("shopee live client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns no-op when ENABLE_SHOPEE_LIVE is false", async () => {
    vi.stubEnv("ENABLE_SHOPEE_LIVE", "false");
    vi.stubEnv("APIFY_SHOPEE_ACTOR_ID", "apify/shopee-scraper");
    const runApifyActorSync = vi.fn();

    const result = await checkShopeeLive(
      {
        sellerUsername: "lojateste",
        sellerUrl: "https://shopee.com.br/lojateste",
      },
      { runApifyActorSync },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://shopee.com.br/lojateste",
    });
    expect(runApifyActorSync).not.toHaveBeenCalled();
  });

  it("returns no-op when APIFY_SHOPEE_ACTOR_ID is not configured", async () => {
    vi.stubEnv("ENABLE_SHOPEE_LIVE", "true");
    vi.stubEnv("APIFY_SHOPEE_ACTOR_ID", "");
    const runApifyActorSync = vi.fn();

    const result = await checkShopeeLive(
      {
        sellerUsername: "lojateste",
        sellerUrl: "https://shopee.com.br/lojateste",
      },
      { runApifyActorSync },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://shopee.com.br/lojateste",
    });
    expect(runApifyActorSync).not.toHaveBeenCalled();
  });

  it("maps Apify dataset item with isLive=true to LiveCheckResult", async () => {
    vi.stubEnv("ENABLE_SHOPEE_LIVE", "true");
    vi.stubEnv("APIFY_SHOPEE_ACTOR_ID", "apify/shopee-scraper");

    const runApifyActorSync = vi.fn().mockResolvedValue([
      {
        isLive: true,
        title: "Live da Loja",
        liveUrl: "https://shopee.com.br/lojateste/live/123",
      },
    ]);

    const result = await checkShopeeLive(
      {
        sellerUsername: "lojateste",
        sellerUrl: "https://shopee.com.br/lojateste",
      },
      { runApifyActorSync },
    );

    expect(runApifyActorSync).toHaveBeenCalledTimes(1);
    const [actorId, input] = runApifyActorSync.mock.calls[0] ?? [];
    expect(actorId).toBe("apify/shopee-scraper");
    expect(input).toMatchObject({
      usernames: ["lojateste"],
      sellerUrls: ["https://shopee.com.br/lojateste"],
    });
    expect(result).toEqual({
      isLive: true,
      title: "Live da Loja",
      url: "https://shopee.com.br/lojateste/live/123",
    });
  });

  it("returns isLive=false when dataset has no items", async () => {
    vi.stubEnv("ENABLE_SHOPEE_LIVE", "true");
    vi.stubEnv("APIFY_SHOPEE_ACTOR_ID", "apify/shopee-scraper");

    const runApifyActorSync = vi.fn().mockResolvedValue([]);

    const result = await checkShopeeLive(
      {
        sellerUsername: "lojateste",
        sellerUrl: "https://shopee.com.br/lojateste",
      },
      { runApifyActorSync },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://shopee.com.br/lojateste",
    });
  });

  it("falls back to isLive=false when Apify run throws", async () => {
    vi.stubEnv("ENABLE_SHOPEE_LIVE", "true");
    vi.stubEnv("APIFY_SHOPEE_ACTOR_ID", "apify/shopee-scraper");

    const runApifyActorSync = vi.fn().mockRejectedValue(new Error("boom"));

    const result = await checkShopeeLive(
      {
        sellerUsername: "lojateste",
        sellerUrl: "https://shopee.com.br/lojateste",
      },
      { runApifyActorSync },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://shopee.com.br/lojateste",
    });
  });
});
