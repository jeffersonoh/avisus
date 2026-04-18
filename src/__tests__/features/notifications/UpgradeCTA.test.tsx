import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UpgradeCTA } from "@/features/notifications/UpgradeCTA";

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("UpgradeCTA", () => {
  it("does not render for FREE user below daily limit", () => {
    const { container } = render(<UpgradeCTA plan="free" alertsSentToday={4} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders CTA with aria-label when FREE limit is reached", () => {
    render(<UpgradeCTA plan="free" alertsSentToday={5} />);

    expect(screen.getByLabelText("Limite diario de alertas atingido")).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: "Fazer upgrade para receber alertas ilimitados",
    });
    expect(link).toHaveAttribute("href", "/planos");
  });

  it("does not render for paid plans even with high alert count", () => {
    const starter = render(<UpgradeCTA plan="starter" alertsSentToday={99} />);
    expect(starter.container).toBeEmptyDOMElement();

    const pro = render(<UpgradeCTA plan="pro" alertsSentToday={99} />);
    expect(pro.container).toBeEmptyDOMElement();
  });
});
