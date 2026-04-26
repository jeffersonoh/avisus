import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/LoginForm";

vi.mock("@/lib/auth/actions", () => ({
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("LoginForm", () => {
  it("renders forgot password link", () => {
    render(<LoginForm />);

    expect(screen.getByRole("link", { name: "Esqueci minha senha" })).toHaveAttribute(
      "href",
      "/esqueci-senha",
    );
  });

  it("renders password reset success feedback", () => {
    render(<LoginForm passwordResetSuccess />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Senha redefinida com sucesso. Entre com sua nova senha.",
    );
  });
});
