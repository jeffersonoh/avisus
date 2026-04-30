import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("shows category and region options even without loaded opportunities", async () => {
    const user = userEvent.setup();

    render(
      <OpportunityList
        opportunities={[]}
        initialFilters={initialFilters}
        categoryOptions={["Ferramentas", "Eletrônicos"]}
        regionOptions={["SC", "SP"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^Filtros$/ }));

    const category = screen.getByLabelText("Categoria");
    const region = screen.getByLabelText("Região (UF)");

    expect(within(category).getByRole("option", { name: "Ferramentas" })).toHaveValue("Ferramentas");
    expect(within(category).getByRole("option", { name: "Eletrônicos" })).toHaveValue("Eletrônicos");
    expect(within(region).getByRole("option", { name: "SC" })).toHaveValue("SC");
    expect(within(region).getByRole("option", { name: "SP" })).toHaveValue("SP");
  });
});
