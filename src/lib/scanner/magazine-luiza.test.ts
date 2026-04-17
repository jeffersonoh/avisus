import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScrapingBeeTimeoutError, fetchScrapingBeeHtml } from "@/lib/scanner/scraping-bee";
import { searchByTerm } from "@/lib/scanner/magazine-luiza";

vi.mock("@/lib/scanner/scraping-bee", () => ({
  fetchScrapingBeeHtml: vi.fn(),
  ScrapingBeeTimeoutError: class ScrapingBeeTimeoutError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ScrapingBeeTimeoutError";
    }
  },
}));

const KNOWN_SEARCH_HTML = `
<ul>
  <li data-testid="product-card-container" data-product-id="ABC-123">
    <a href="/produto/furadeira-bosch-gsb-13-re/p/ABC-123/">
      <h2 data-testid="product-title">Furadeira Bosch GSB 13 RE</h2>
      <img src="https://img.magalu.com.br/furadeira.jpg" />
    </a>
    <p data-testid="price-original">R$ 399,90</p>
    <p data-testid="price-value">R$ 299,90</p>
    <span data-testid="discount">25% OFF</span>
  </li>
</ul>
`;

describe("magazine-luiza search client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns empty list immediately when mode is disabled", async () => {
    vi.stubEnv("MAGALU_SCRAPE_MODE", "disabled");

    const products = await searchByTerm("furadeira");

    expect(products).toEqual([]);
    expect(fetchScrapingBeeHtml).not.toHaveBeenCalled();
  });

  it("parses managed mode HTML and maps expected product fields", async () => {
    vi.stubEnv("MAGALU_SCRAPE_MODE", "managed");
    vi.mocked(fetchScrapingBeeHtml).mockResolvedValueOnce(KNOWN_SEARCH_HTML);

    const products = await searchByTerm("furadeira");

    expect(fetchScrapingBeeHtml).toHaveBeenCalledTimes(1);
    expect(fetchScrapingBeeHtml).toHaveBeenCalledWith(
      "https://www.magazineluiza.com.br/busca/furadeira/",
      { timeoutMs: 20000 },
    );
    expect(products).toEqual([
      {
        marketplace: "Magazine Luiza",
        externalId: "abc-123",
        name: "Furadeira Bosch GSB 13 RE",
        price: 299.9,
        originalPrice: 399.9,
        discountPct: 25,
        freight: 0,
        freightFree: false,
        unitsSold: null,
        category: null,
        buyUrl: "https://www.magazineluiza.com.br/produto/furadeira-bosch-gsb-13-re/p/ABC-123/",
        imageUrl: "https://img.magalu.com.br/furadeira.jpg",
      },
    ]);
  });

  it("returns empty list and logs when managed mode times out", async () => {
    vi.stubEnv("MAGALU_SCRAPE_MODE", "managed");
    vi.mocked(fetchScrapingBeeHtml).mockRejectedValue(
      new ScrapingBeeTimeoutError("Timed out waiting for ScrapingBee response."),
    );
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });

    const products = await searchByTerm("furadeira");

    expect(products).toEqual([]);
    expect(fetchScrapingBeeHtml).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[scanner][magalu] managed mode timeout after 20000ms for term "furadeira". Returning empty array.',
    );
  });
});
