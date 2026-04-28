import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

import AdminLayout from "@/app/(admin)/admin/layout";
import AdminPage from "@/app/(admin)/admin/page";

describe("Admin server components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
  });

  it("does not render admin content for an authenticated non-admin user", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT: /dashboard?error=403"));

    await expect(AdminLayout({ children: <p>Conteúdo administrativo sensível</p> })).rejects.toThrow(
      "NEXT_REDIRECT: /dashboard?error=403",
    );
  });

  it("renders the administrative layout and Cupons link for admins", async () => {
    render(await AdminLayout({ children: <p>Conteúdo administrativo</p> }));

    expect(screen.getByRole("heading", { name: "Administração Avisus" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Administração" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cupons/ })).toHaveAttribute("href", "/admin/cupons");
    expect(screen.getByText("Conteúdo administrativo")).toBeInTheDocument();
  });

  it("renders the admin home entry without coupon or partner datasets before authorization", async () => {
    render(await AdminPage());

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Gestão de cupons de referência" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Acessar cupons/ })).toHaveAttribute("href", "/admin/cupons");
    expect(screen.queryByText(/Parceiro Teste|CUPOM_TESTE|commission_rate_pct/i)).not.toBeInTheDocument();
  });
});
