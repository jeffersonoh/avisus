import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

vi.mock("@/lib/auth/actions", () => ({
  updatePassword: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("UpdatePasswordForm", () => {
  it("renders password fields and submit button", () => {
    render(<UpdatePasswordForm />);

    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redefinir senha" })).toBeInTheDocument();
  });

  it("validates matching passwords before submit", async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    await user.type(screen.getByLabelText("Nova senha"), "senha-segura");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "senha-diferente");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(screen.getByRole("alert")).toHaveTextContent("As senhas informadas não conferem.");
  });
});
