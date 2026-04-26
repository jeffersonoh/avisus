import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";

vi.mock("@/lib/auth/actions", () => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("PasswordResetRequestForm", () => {
  it("renders email field and submit button", () => {
    render(<PasswordResetRequestForm />);

    expect(screen.getByLabelText("E-mail da conta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para login" })).toHaveAttribute("href", "/login");
  });

  it("validates invalid email before submit", async () => {
    const user = userEvent.setup();
    render(<PasswordResetRequestForm />);

    await user.type(screen.getByLabelText("E-mail da conta"), "email-invalido");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe um e-mail válido.");
  });
});
