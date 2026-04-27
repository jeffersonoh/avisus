import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ScrapingBeeTimeoutError,
  ScrapingBeeUnauthorizedError,
  fetchScrapingBeeHtml,
} from "@/lib/scanner/scraping-bee";
import { parseMercadoLivreSearchHtml, searchByTerm } from "@/lib/scanner/mercado-livre";

vi.mock("@/lib/scanner/scraping-bee", () => ({
  fetchScrapingBeeHtml: vi.fn(),
  ScrapingBeeTimeoutError: class ScrapingBeeTimeoutError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ScrapingBeeTimeoutError";
    }
  },
  ScrapingBeeUnauthorizedError: class ScrapingBeeUnauthorizedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ScrapingBeeUnauthorizedError";
    }
  },
}));

const KNOWN_SEARCH_HTML = `
<ol>
  <li class="ui-search-layout__item">
    <div class="poly-card">
      <h2 class="poly-box">
        <a class="poly-component__title" href="https://www.mercadolivre.com.br/fone-bluetooth-jbl-tune-510bt/p/MLB-1234567890">
          Fone Bluetooth JBL Tune 510BT
        </a>
      </h2>
      <div class="poly-component__price">
        <s class="andes-money-amount--previous">
          <span class="andes-money-amount">
            <span class="andes-money-amount__fraction">399</span>
            <span class="andes-money-amount__cents">90</span>
          </span>
        </s>
        <span class="andes-money-amount">
          <span class="andes-money-amount__fraction">249</span>
          <span class="andes-money-amount__cents">90</span>
        </span>
      </div>
      <div class="poly-component__shipping">Frete grátis</div>
      <span class="poly-component__sold">+1mil vendidos</span>
      <img class="poly-component__picture" src="https://http2.mlstatic.com/fone.jpg" />
    </div>
  </li>
</ol>
`;

describe("mercado-livre search client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns empty list immediately when mode is disabled", async () => {
    vi.stubEnv("MERCADO_LIVRE_SCRAPE_MODE", "disabled");

    const products = await searchByTerm("fone bluetooth");

    expect(products).toEqual([]);
    expect(fetchScrapingBeeHtml).not.toHaveBeenCalled();
  });

  it("parses managed mode HTML and maps expected product fields", async () => {
    vi.stubEnv("MERCADO_LIVRE_SCRAPE_MODE", "managed");
    vi.mocked(fetchScrapingBeeHtml).mockResolvedValueOnce(KNOWN_SEARCH_HTML);

    const products = await searchByTerm("fone bluetooth");

    expect(fetchScrapingBeeHtml).toHaveBeenCalledTimes(1);
    expect(fetchScrapingBeeHtml).toHaveBeenCalledWith(
      "https://lista.mercadolivre.com.br/fone-bluetooth?ITEM_CONDITION=2230284",
      { timeoutMs: 20000, renderJs: false, premiumProxy: true, countryCode: "br" },
    );

    expect(products).toHaveLength(1);
    const [product] = products;
    expect(product).toBeDefined();
    expect(product).toMatchObject({
      marketplace: "Mercado Livre",
      externalId: "MLB1234567890",
      name: "Fone Bluetooth JBL Tune 510BT",
      price: 249.9,
      originalPrice: 399.9,
      freight: 0,
      freightFree: true,
      unitsSold: 1000,
      buyUrl:
        "https://www.mercadolivre.com.br/fone-bluetooth-jbl-tune-510bt/p/MLB-1234567890",
      imageUrl: "https://http2.mlstatic.com/fone.jpg",
    });
    expect(product?.discountPct).toBeCloseTo(37.5, 1);
  });

  it("normalizes term with accents and multi-word into URL slug", async () => {
    vi.stubEnv("MERCADO_LIVRE_SCRAPE_MODE", "managed");
    vi.mocked(fetchScrapingBeeHtml).mockResolvedValueOnce("<html></html>");

    await searchByTerm("Fone de Ouvido Bluetooth");

    expect(fetchScrapingBeeHtml).toHaveBeenCalledWith(
      "https://lista.mercadolivre.com.br/fone-de-ouvido-bluetooth?ITEM_CONDITION=2230284",
      { timeoutMs: 20000, renderJs: false, premiumProxy: true, countryCode: "br" },
    );
  });

  it("returns empty list and logs when managed mode times out (after retry)", async () => {
    vi.stubEnv("MERCADO_LIVRE_SCRAPE_MODE", "managed");
    vi.mocked(fetchScrapingBeeHtml).mockRejectedValue(
      new ScrapingBeeTimeoutError("timeout"),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const products = await searchByTerm("fone");

    expect(products).toEqual([]);
    expect(fetchScrapingBeeHtml).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns empty list and logs when ScrapingBee rejects with 403/401", async () => {
    vi.stubEnv("MERCADO_LIVRE_SCRAPE_MODE", "managed");
    vi.mocked(fetchScrapingBeeHtml).mockRejectedValue(
      new ScrapingBeeUnauthorizedError("403"),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const products = await searchByTerm("fone");

    expect(products).toEqual([]);
    expect(fetchScrapingBeeHtml).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("handles thousands separator in price fraction without truncation", () => {
    const htmlHighPrice = `
      <ol>
        <li class="ui-search-layout__item">
          <div class="poly-card">
            <a class="poly-component__title" href="https://www.mercadolivre.com.br/iphone/p/MLB-3333333333">iPhone 15 Pro</a>
            <div class="poly-component__price">
              <s class="andes-money-amount--previous">
                <span class="andes-money-amount">
                  <span class="andes-money-amount__fraction">8.095</span>
                </span>
              </s>
              <div class="poly-price__current">
                <span class="andes-money-amount">
                  <span class="andes-money-amount__fraction">4.751</span>
                </span>
              </div>
            </div>
          </div>
        </li>
      </ol>
    `;

    const products = parseMercadoLivreSearchHtml(htmlHighPrice);

    expect(products).toHaveLength(1);
    const [product] = products;
    expect(product).toMatchObject({ price: 4751, originalPrice: 8095 });
  });

  it("ignores installment amounts and keeps the real product price", () => {
    const htmlWithInstallments = `
      <ol>
        <li class="ui-search-layout__item">
          <div class="poly-card">
            <a class="poly-component__title" href="https://www.mercadolivre.com.br/iphone/p/MLB-2222222222">iPhone 15 Pro Max</a>
            <div class="poly-component__price">
              <s class="andes-money-amount--previous">
                <span class="andes-money-amount">
                  <span class="andes-money-amount__fraction">9.999</span>
                  <span class="andes-money-amount__cents">00</span>
                </span>
              </s>
              <span class="andes-money-amount">
                <span class="andes-money-amount__fraction">7.499</span>
                <span class="andes-money-amount__cents">90</span>
              </span>
            </div>
            <div class="poly-component__installments">
              <span class="andes-money-amount">
                <span class="andes-money-amount__fraction">624</span>
                <span class="andes-money-amount__cents">99</span>
              </span>
              em 12x sem juros
            </div>
          </div>
        </li>
      </ol>
    `;

    const products = parseMercadoLivreSearchHtml(htmlWithInstallments);

    expect(products).toHaveLength(1);
    const [product] = products;
    expect(product).toMatchObject({
      price: 7499.9,
      originalPrice: 9999,
    });
  });

  it("parseMercadoLivreSearchHtml returns empty when HTML has no cards", () => {
    const products = parseMercadoLivreSearchHtml("<html><body></body></html>");
    expect(products).toEqual([]);
  });

  it("parseMercadoLivreSearchHtml skips cards missing required fields", () => {
    const htmlMissingPrice = `
      <ol>
        <li class="ui-search-layout__item">
          <a class="poly-component__title" href="https://www.mercadolivre.com.br/fone/p/MLB9999999999">Fone</a>
          <!-- no andes-money-amount -->
        </li>
      </ol>
    `;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const products = parseMercadoLivreSearchHtml(htmlMissingPrice);

    expect(products).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });
});
