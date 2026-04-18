import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchScrapingBeeHtml } from "@/lib/scanner/scraping-bee";

import { checkShopeeLive } from "./shopee-live";

vi.mock("@/lib/scanner/scraping-bee", () => ({
  fetchScrapingBeeHtml: vi.fn(),
}));

describe("shopee live client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns no-op when ENABLE_SHOPEE_LIVE is false", async () => {
    vi.stubEnv("ENABLE_SHOPEE_LIVE", "false");
    const fetcher = vi.fn();

    const result = await checkShopeeLive(
      {
        sellerUsername: "lojateste",
        sellerUrl: "https://shopee.com.br/lojateste",
      },
      { fetcher: fetcher as unknown as typeof fetch },
    );

    expect(result).toEqual({
      isLive: false,
      url: "https://shopee.com.br/lojateste",
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(fetchScrapingBeeHtml).not.toHaveBeenCalled();
  });

  it("returns isLive=true when public layer detects live markers", async () => {
    const fetcher = vi.fn(async () =>
      new Response('<html><title>Live da Loja</title><div>ao vivo agora</div></html>', {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as unknown as typeof fetch;

    const result = await checkShopeeLive(
      {
        sellerUsername: "lojateste",
        sellerUrl: "https://shopee.com.br/lojateste",
      },
      {
        fetcher,
        sleep: async () => undefined,
        randomInt: () => 180,
      },
    );

    expect(result.isLive).toBe(true);
    expect(result.url).toBe("https://shopee.com.br/lojateste");
    expect(fetchScrapingBeeHtml).not.toHaveBeenCalled();
  });

  it("applies random delay before public request", async () => {
    const sleep = vi.fn(async () => undefined);
    const fetcher = vi.fn(async () =>
      new Response("<html></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as unknown as typeof fetch;

    await checkShopeeLive(
      {
        sellerUsername: "lojateste",
        sellerUrl: "https://shopee.com.br/lojateste",
      },
      {
        fetcher,
        sleep,
        randomInt: () => 250,
      },
    );

    expect(sleep).toHaveBeenCalledWith(250);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
