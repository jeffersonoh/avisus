import { afterEach, describe, expect, it, vi } from "vitest";

import { checkTikTokLive } from "./tiktok-live";

describe("tiktok live client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns no-op when ENABLE_TIKTOK_LIVE is false", async () => {
    vi.stubEnv("ENABLE_TIKTOK_LIVE", "false");
    vi.stubEnv("APIFY_TIKTOK_ACTOR_ID", "apify/tiktok-scraper");
    const runApifyActorSync = vi.fn();

    const result = await checkTikTokLive(
      {
        sellerUsername: "canal",
        sellerUrl: "https://www.tiktok.com/@canal",
      },
      { runApifyActorSync },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://www.tiktok.com/@canal",
    });
    expect(runApifyActorSync).not.toHaveBeenCalled();
  });

  it("returns no-op when APIFY_TIKTOK_ACTOR_ID is not configured", async () => {
    vi.stubEnv("ENABLE_TIKTOK_LIVE", "true");
    vi.stubEnv("APIFY_TIKTOK_ACTOR_ID", "");
    const runApifyActorSync = vi.fn();

    const result = await checkTikTokLive(
      {
        sellerUsername: "canal",
        sellerUrl: "https://www.tiktok.com/@canal",
      },
      { runApifyActorSync },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://www.tiktok.com/@canal",
    });
    expect(runApifyActorSync).not.toHaveBeenCalled();
  });

  it("maps Apify dataset item with isLive=true to LiveCheckResult", async () => {
    vi.stubEnv("ENABLE_TIKTOK_LIVE", "true");
    vi.stubEnv("APIFY_TIKTOK_ACTOR_ID", "apify/tiktok-scraper");

    const runApifyActorSync = vi.fn().mockResolvedValue([
      {
        isLive: true,
        liveTitle: "Canal em live",
        liveUrl: "https://www.tiktok.com/@canal/live",
      },
    ]);

    const result = await checkTikTokLive(
      {
        sellerUsername: "canal",
        sellerUrl: "https://www.tiktok.com/@canal",
      },
      { runApifyActorSync },
    );

    expect(runApifyActorSync).toHaveBeenCalledTimes(1);
    const [actorId, input] = runApifyActorSync.mock.calls[0] ?? [];
    expect(actorId).toBe("apify/tiktok-scraper");
    expect(input).toMatchObject({
      usernames: ["canal"],
      profiles: ["@canal"],
      profileUrls: ["https://www.tiktok.com/@canal"],
    });
    expect(result).toEqual({
      isLive: true,
      title: "Canal em live",
      url: "https://www.tiktok.com/@canal/live",
    });
  });

  it("returns isLive=false when dataset has no items", async () => {
    vi.stubEnv("ENABLE_TIKTOK_LIVE", "true");
    vi.stubEnv("APIFY_TIKTOK_ACTOR_ID", "apify/tiktok-scraper");

    const runApifyActorSync = vi.fn().mockResolvedValue([]);

    const result = await checkTikTokLive(
      {
        sellerUsername: "canal",
        sellerUrl: "https://www.tiktok.com/@canal",
      },
      { runApifyActorSync },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://www.tiktok.com/@canal",
    });
  });

  it("falls back to isLive=false when Apify run throws", async () => {
    vi.stubEnv("ENABLE_TIKTOK_LIVE", "true");
    vi.stubEnv("APIFY_TIKTOK_ACTOR_ID", "apify/tiktok-scraper");

    const runApifyActorSync = vi.fn().mockRejectedValue(new Error("boom"));

    const result = await checkTikTokLive(
      {
        sellerUsername: "canal",
        sellerUrl: "https://www.tiktok.com/@canal",
      },
      { runApifyActorSync },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://www.tiktok.com/@canal",
    });
  });
});
