import { render, screen, within } from "@testing-library/react";
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
  it("groups Alertas and Lives in the mobile navigation", () => {
    render(<BottomNav />);

    const group = screen.getByRole("group", { name: "Alertas e Lives" });

    expect(within(group).getByRole("link", { name: "Alertas" })).toHaveAttribute("href", "/alertas");
    expect(within(group).getByRole("link", { name: "Lives" })).toHaveAttribute("href", "/favoritos");
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Interesses" })).toHaveAttribute("href", "/interesses");
    expect(screen.getByRole("link", { name: "Conta" })).toHaveAttribute("href", "/perfil");
  });
});
