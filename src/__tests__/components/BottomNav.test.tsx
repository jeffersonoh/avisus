import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BottomNav } from "@/components/BottomNav";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useLinkStatus: () => ({ pending: false }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/alertas",
}));

describe("BottomNav", () => {
  it("opens a grouped menu for Alertas and Lives in the mobile navigation", async () => {
    const user = userEvent.setup();
    render(<BottomNav />);

    const groupButton = screen.getByRole("button", { name: "Avisos" });
    expect(groupButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu", { name: "Alertas e Lives" })).not.toBeInTheDocument();

    await user.click(groupButton);

    const menu = screen.getByRole("menu", { name: "Alertas e Lives" });

    expect(groupButton).toHaveAttribute("aria-expanded", "true");
    expect(within(menu).getByRole("menuitem", { name: "Alertas" })).toHaveAttribute("href", "/alertas");
    expect(within(menu).getByRole("menuitem", { name: "Lives" })).toHaveAttribute("href", "/favoritos");
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Interesses" })).toHaveAttribute("href", "/interesses");
    expect(screen.getByRole("link", { name: "Conta" })).toHaveAttribute("href", "/perfil");
  });
});
