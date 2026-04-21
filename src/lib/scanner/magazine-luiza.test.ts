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

// Fixture baseada no HTML real retornado pela Magalu em 2026-04: o próprio
// card é um <a data-testid="product-card-container"> e o price-value inclui
// prefixo "ou " quando há desconto no Pix.
const KNOWN_SEARCH_HTML = `
<ul>
  <li>
    <a href="/furadeira-bosch-gsb-13-re/p/ABC-123/te/fura/?seller_id=magazineluiza" data-testid="product-card-container">
      <img data-testid="image" src="https://img.magalu.com.br/furadeira.jpg" />
      <h2 data-testid="product-title">Furadeira Bosch GSB 13 RE</h2>
      <div data-testid="price-default">
        <p data-testid="price-original">R$&nbsp;400,00</p>
        <p data-testid="price-value"><span>ou </span>R$&nbsp;300,00</p>
      </div>
    </a>
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
      { timeoutMs: 20000, renderJs: false, premiumProxy: true, countryCode: "br" },
    );
    expect(products).toEqual([
      {
        marketplace: "Magazine Luiza",
        externalId: "abc-123",
        name: "Furadeira Bosch GSB 13 RE",
        price: 300,
        originalPrice: 400,
        discountPct: 25,
        freight: 0,
        freightFree: false,
        unitsSold: null,
        category: null,
        buyUrl:
          "https://www.magazineluiza.com.br/furadeira-bosch-gsb-13-re/p/ABC-123/te/fura/?seller_id=magazineluiza",
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
