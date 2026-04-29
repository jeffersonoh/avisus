import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductCard } from "@/features/dashboard/ProductCard";
import type { Opportunity } from "@/features/dashboard/types";

vi.mock("next/image", () => ({
  default: ({ alt = "", src, ...props }: { alt?: string; src: string; [key: string]: unknown }) => {
    const imgProps = { ...props };
    delete imgProps.fill;
    delete imgProps.unoptimized;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} src={src} {...imgProps} />
    );
  },
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

const opportunity: Opportunity = {
  id: "opp-wide-card",
  name: "Parafusadeira de impacto profissional com maleta e acessórios extras",
  marketplace: "Magazine Luiza",
  imageUrl: "https://example.com/product.png",
  price: 227.91,
  originalPrice: 899,
  freight: 0,
  freightFree: false,
  margin: 235.29,
  quality: "exceptional",
  category: "Ferramentas",
  region: "SP",
  city: "São Paulo",
  expiresLabel: "2h 15min",
  hot: true,
  buyUrl: "https://example.com/buy",
  updatedAt: "2026-04-29T12:00:00.000Z",
  channelMargins: [
    { channel: "Magazine Luiza", marketPrice: 899, fee: 16, netMargin: 235.29 },
  ],
};

describe("ProductCard mobile layout", () => {
  it("keeps the opportunity card constrained to the viewport", () => {
    render(<ProductCard opportunity={opportunity} index={0} onOpenDetail={() => undefined} />);

    const card = screen.getByRole("button", { name: /abrir detalhes/i });
    const marketplaceBadge = screen.getAllByText("Magazine Luiza")[0]?.closest("span")?.parentElement;
    const marginBox = screen.getByText(/melhor revenda via/i).closest("div")?.parentElement?.parentElement;

    expect(card).toHaveClass("w-full", "max-w-full", "min-w-0", "overflow-hidden");
    expect(marketplaceBadge).toHaveClass("max-w-[min(68vw,13rem)]", "min-w-0");
    expect(marginBox).toHaveClass("max-w-full", "min-w-0");
  });
});
