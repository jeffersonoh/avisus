import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OpportunityList } from "@/features/dashboard/OpportunityList";
import type { DashboardFilters } from "@/features/dashboard/search-params";

const replace = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

const initialFilters: DashboardFilters = {
  marketplace: "all",
  category: "all",
  discount: "all",
  margin: "all",
  region: "all",
  sort: "margin",
  myInterests: false,
};

describe("OpportunityList filter layout", () => {
  it("groups mobile filters by purpose", () => {
    render(<OpportunityList opportunities={[]} initialFilters={initialFilters} />);

    const filters = screen.getByRole("region", { name: "Filtros de oportunidades" });

    expect(filters).toHaveClass("rounded-[20px]", "border", "bg-card", "p-2.5");
    expect(within(filters).getByText("Marketplace")).toBeInTheDocument();
    expect(within(filters).getByText("Preferências")).toBeInTheDocument();
    expect(within(filters).getByText("Ordenar")).toBeInTheDocument();
    expect(within(filters).getByText("0 ofertas")).toBeInTheDocument();
    expect(within(filters).queryByText("|")).not.toBeInTheDocument();
  });
});
