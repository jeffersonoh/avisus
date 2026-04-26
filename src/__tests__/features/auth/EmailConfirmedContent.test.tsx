import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmailConfirmedContent } from "@/components/auth/EmailConfirmedContent";

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("EmailConfirmedContent", () => {
  it("renders confirmation feedback and onboarding CTA", () => {
    render(<EmailConfirmedContent />);

    expect(screen.getByRole("heading", { name: "Sua conta Avisus está ativa" })).toBeInTheDocument();
    expect(screen.getByText("Cadastro confirmado")).toBeInTheDocument();
    expect(screen.getByText(/Seu e-mail foi confirmado com sucesso/)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Continuar configuração/ });
    expect(link).toHaveAttribute("href", "/onboarding");
  });
});
