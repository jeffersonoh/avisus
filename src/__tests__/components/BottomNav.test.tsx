import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("keeps mobile nav and grouped menu constrained to the viewport", async () => {
    const user = userEvent.setup();
    render(<BottomNav />);

    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    const navList = within(nav).getByRole("list");
    const groupButton = screen.getByRole("button", { name: "Avisos" });

    expect(navList).toHaveClass("w-full", "min-w-0");
    expect(groupButton).toHaveClass("min-w-0", "w-full");

    await user.click(groupButton);

    const menu = screen.getByRole("menu", { name: "Alertas e Lives" });
    expect(menu).toHaveClass("w-[min(10rem,calc(100vw-1rem))]");
    expect(menu).toHaveClass("max-w-[calc(100vw-1rem)]");
    expect(menu.className).not.toContain("overflow-x-auto");
  });

  it("closes the grouped menu when the dashboard scrolls on mobile", async () => {
    const user = userEvent.setup();
    render(<BottomNav />);

    const groupButton = screen.getByRole("button", { name: "Avisos" });
    await user.click(groupButton);

    expect(screen.getByRole("menu", { name: "Alertas e Lives" })).toBeInTheDocument();

    fireEvent.scroll(window);

    expect(groupButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu", { name: "Alertas e Lives" })).not.toBeInTheDocument();
  });
});
