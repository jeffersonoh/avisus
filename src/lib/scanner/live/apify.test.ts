import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApifyError,
  ApifyTimeoutError,
  ApifyUnauthorizedError,
  runApifyActorSync,
} from "./apify";

describe("apify actor sync client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("throws ApifyError when APIFY_TOKEN is missing", async () => {
    vi.stubEnv("APIFY_TOKEN", "");
    const fetcher = vi.fn();

    await expect(
      runApifyActorSync("apify/tiktok-scraper", {}, { fetcher: fetcher as unknown as typeof fetch }),
    ).rejects.toBeInstanceOf(ApifyError);

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("POSTs JSON input and returns parsed dataset items", async () => {
    vi.stubEnv("APIFY_TOKEN", "token-123");

    const fetcher = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toContain("api.apify.com/v2/acts/apify~tiktok-scraper/run-sync-get-dataset-items");
      expect(url).toContain("token=token-123");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual({ usernames: ["canal"] });

      return new Response(JSON.stringify([{ isLive: true }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const items = await runApifyActorSync<{ isLive: boolean }>(
      "apify/tiktok-scraper",
      { usernames: ["canal"] },
      { fetcher },
    );

    expect(items).toEqual([{ isLive: true }]);
  });

  it("normalizes slash actor id to tilde in URL", async () => {
    vi.stubEnv("APIFY_TOKEN", "token-123");

    const fetcher = vi.fn(async (url: string) => {
      expect(url).toContain("apify~tiktok-scraper");
      expect(url).not.toContain("apify/tiktok-scraper/run-sync");
      return new Response(JSON.stringify([]), { status: 200 });
    }) as unknown as typeof fetch;

    await runApifyActorSync("apify/tiktok-scraper", {}, { fetcher });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("throws ApifyUnauthorizedError on 401", async () => {
    vi.stubEnv("APIFY_TOKEN", "token-123");

    const fetcher = vi.fn(
      async () => new Response("unauthorized", { status: 401 }),
    ) as unknown as typeof fetch;

    await expect(
      runApifyActorSync("apify/tiktok-scraper", {}, { fetcher }),
    ).rejects.toBeInstanceOf(ApifyUnauthorizedError);
  });

  it("throws ApifyTimeoutError when fetch aborts", async () => {
    vi.stubEnv("APIFY_TOKEN", "token-123");

    const fetcher = vi.fn(async () => {
      const abortError = new Error("aborted");
      abortError.name = "AbortError";
      throw abortError;
    }) as unknown as typeof fetch;

    await expect(
      runApifyActorSync("apify/tiktok-scraper", {}, { fetcher, timeoutMs: 100 }),
    ).rejects.toBeInstanceOf(ApifyTimeoutError);
  });

  it("throws ApifyError when response is not an array", async () => {
    vi.stubEnv("APIFY_TOKEN", "token-123");

    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "oops" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    ) as unknown as typeof fetch;

    await expect(
      runApifyActorSync("apify/tiktok-scraper", {}, { fetcher }),
    ).rejects.toBeInstanceOf(ApifyError);
  });
});
