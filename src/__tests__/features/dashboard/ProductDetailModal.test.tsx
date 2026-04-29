import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductDetailModal } from "@/features/dashboard/ProductDetailModal";
import type { ChannelMargin, Opportunity } from "@/features/dashboard/types";
import { calculateMargin } from "@/lib/scanner/margin-calculator";

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

// Fixture espelha o que o scanner persiste em channel_margins:
// - fee é percentual inteiro (15, 16), mesmo contrato de fee_pct no DB
// - netMargin é percentual e bate com calculateNetMarginPercent
// Qualquer mudança de escala em qualquer uma das pontas estoura o cenário
// "mantém consistência com o backend" abaixo.
const baseOpportunity: Opportunity = {
  id: "opp-echo-dot",
  name: "Echo Dot 5a Geração",
  marketplace: "Mercado Livre",
  imageUrl: "",
  price: 499.53,
  originalPrice: 699,
  freight: 0,
  freightFree: false,
  margin: 18.94,
  quality: "good",
  category: "Eletrônicos",
  region: "SP",
  city: "São Paulo",
  expiresLabel: "2h 15min",
  hot: false,
  buyUrl: "https://example.com/p/123",
  updatedAt: new Date().toISOString(),
  channelMargins: [
    { channel: "Mercado Livre", marketPrice: 699, fee: 15, netMargin: 18.94 },
    { channel: "Magazine Luiza", marketPrice: 699, fee: 16, netMargin: 17.54 },
  ],
};

function findRowValue(label: RegExp): HTMLElement {
  const row = screen.getByText(label).closest("div[style]")?.parentElement;
  if (!row) {
    throw new Error(`row not found for label ${label}`);
  }
  return row as HTMLElement;
}

function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("ProductDetailModal — lucro estimado e escala de fee", () => {
  it('renderiza "Lucro estimado" usando fee como percentual (0-100), não decimal', () => {
    render(
      <ProductDetailModal
        opportunity={baseOpportunity}
        open
        onClose={() => undefined}
      />,
    );

    // Fórmula correta: marketPrice × (1 - fee/100) - acqTotal
    //   = 699 × (1 - 15/100) - 499.53
    //   = 699 × 0.85        - 499.53
    //   = 594.15            - 499.53
    //   = 94.62
    // Regressão do bug trataria fee como decimal e renderizaria "-R$ 10.285,53".
    const row = findRowValue(/Lucro estimado/);
    expect(within(row).getByText(/R\$\s*94,62/)).toBeInTheDocument();
    expect(within(row).queryByText(/-\s*R\$\s*10\.285/)).not.toBeInTheDocument();
  });

  it("fallback sem canais usa originalPrice - acqTotal", () => {
    const noChannels: Opportunity = { ...baseOpportunity, channelMargins: [] };

    render(
      <ProductDetailModal opportunity={noChannels} open onClose={() => undefined} />,
    );

    // 699 - 499.53 = 199.47
    const row = findRowValue(/Lucro estimado/);
    expect(within(row).getByText(/R\$\s*199,47/)).toBeInTheDocument();
  });

  it('expande tabela de canais e renderiza "Taxa" como percentual bruto (15%, não 1500%)', async () => {
    const user = userEvent.setup();
    render(
      <ProductDetailModal
        opportunity={baseOpportunity}
        open
        onClose={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Margem por canal de revenda/ }));

    // Regressão do bug (fee * 100) mostraria "1500%" para ML e "1600%" para Magalu.
    expect(screen.getByText("15%")).toBeInTheDocument();
    expect(screen.getByText("16%")).toBeInTheDocument();
    expect(screen.queryByText(/1500%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1600%/)).not.toBeInTheDocument();
  });

  it("mantém consistência: profit / acqTotal × 100 ≈ netMargin do backend", () => {
    // Arrange: gera fee/netMargin usando o MESMO calculador do scanner para
    // travar o contrato end-to-end (backend grava percent, UI lê percent).
    const backend = calculateMargin({
      price: 499.53,
      freight: 0,
      channels: [
        { channel: "Mercado Livre", market_price: 699, fee_pct: 15 },
        { channel: "Magazine Luiza", market_price: 699, fee_pct: 16 },
      ],
    });

    const channelMargins: ChannelMargin[] = backend.channels.map((c) => ({
      channel: c.channel,
      marketPrice: c.market_price,
      fee: c.fee_pct,
      netMargin: c.net_margin,
    }));

    const opp: Opportunity = {
      ...baseOpportunity,
      channelMargins,
      margin: backend.margin_best ?? 0,
    };

    render(<ProductDetailModal opportunity={opp} open onClose={() => undefined} />);

    // Act: extrai o valor de "Lucro estimado" renderizado e recomputa a margem
    // esperando que bata com margin_best calculado pelo scanner.
    const row = findRowValue(/Lucro estimado/);
    const rendered = row.textContent ?? "";
    const match = rendered.match(/R\$\s*([\d.]+,\d{2})/);
    if (!match?.[1]) {
      throw new Error(`nenhum valor BRL encontrado em "${rendered}"`);
    }
    const profit = Number(match[1].replace(/\./g, "").replace(",", "."));

    const acqTotal = opp.price + (opp.freightFree ? 0 : opp.freight);
    const recomputedMargin = (profit / acqTotal) * 100;

    // Tolerância 0.05% absorve arredondamento de 2 casas (profit) e 2 casas (netMargin).
    expect(recomputedMargin).toBeCloseTo(backend.margin_best ?? 0, 1);
  });

  it("limita a modal ao viewport mobile e impede overflow horizontal", async () => {
    setViewportWidth(390);
    render(<ProductDetailModal opportunity={baseOpportunity} open onClose={() => undefined} />);

    const dialog = screen.getByRole("dialog");
    const body = screen.getByRole("heading", { name: baseOpportunity.name }).parentElement?.parentElement;

    await waitFor(() => expect(dialog.getAttribute("style")).toContain("width: 100%"));
    expect(dialog.getAttribute("style")).toContain("max-width: 100%");
    expect(dialog.getAttribute("style")).toContain("height: 100dvh");
    expect(dialog.getAttribute("style")).toContain("max-height: 100dvh");
    expect(dialog.getAttribute("style")).toContain("border-radius: 0");
    expect(dialog.getAttribute("style")).toContain("min-width: 0");
    expect(body?.getAttribute("style")).toContain("overflow-x: hidden");
    expect(body?.getAttribute("style")).toContain("min-height: 0");
  });

  it("usa colunas fluidas na tabela de canais para caber no mobile", async () => {
    const user = userEvent.setup();
    render(<ProductDetailModal opportunity={baseOpportunity} open onClose={() => undefined} />);

    await user.click(screen.getByRole("button", { name: /Margem por canal de revenda/ }));

    const headerRow = screen.getByText("Canal").parentElement;
    const firstChannelRow = screen.getByText(/Mercado Livre ★/).parentElement?.parentElement;

    expect(headerRow?.getAttribute("style")).toContain(
      "grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.9fr) minmax(0, 0.45fr) minmax(0, 0.75fr)",
    );
    expect(firstChannelRow?.getAttribute("style")).toContain(
      "grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.9fr) minmax(0, 0.45fr) minmax(0, 0.75fr)",
    );
  });
});
