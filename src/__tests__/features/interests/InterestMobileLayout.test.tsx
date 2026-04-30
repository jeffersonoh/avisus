import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { InterestForm } from "@/features/interests/InterestForm";
import { InterestList } from "@/features/interests/InterestList";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("interests mobile layout", () => {
  it("keeps suggestion grid and interest cards constrained to the viewport", () => {
    renderWithQueryClient(
      <InterestList
        plan="free"
        initialInterests={[
          {
            id: "interest-1",
            term: "termo extremamente longo para validar truncamento no mobile",
            active: true,
            created_at: "2026-04-29T12:00:00.000Z",
            last_scanned_at: "2026-04-29T13:00:00.000Z",
          },
        ]}
      />,
    );

    const categoryGrid = screen.getByRole("button", { name: /ferramentas/i }).parentElement?.parentElement;
    const interestTerm = screen.getByText("termo extremamente longo para validar truncamento no mobile");
    const interestCard = interestTerm.closest("div")?.parentElement?.parentElement?.parentElement?.parentElement;

    expect(categoryGrid).toHaveStyle({
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
      maxWidth: "100%",
    });
    expect(interestCard).toHaveStyle({ maxWidth: "100%", minWidth: "0", overflow: "hidden" });
  });

  it("allows edit form buttons to wrap on mobile", () => {
    render(
      <InterestForm
        mode="edit"
        defaultValue="iphone"
        submitLabel="Salvar alteração"
        onSubmit={() => ({ ok: true })}
        onCancel={() => undefined}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /salvar alteração/i });
    const actions = submitButton.parentElement;

    expect(actions).toHaveClass("w-full", "min-w-0", "flex-wrap");
    expect(submitButton).toHaveClass("min-w-0", "flex-1", "text-xs");
    expect(screen.getByRole("button", { name: /cancelar/i })).toHaveClass("min-w-0", "flex-1", "text-xs");
  });

  it("shows high-demand products from the Fechou o Brique report", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<InterestList plan="pro" initialInterests={[]} />);

    await user.click(screen.getByRole("button", { name: /ferramentas/i }));
    expect(screen.getByRole("button", { name: /parafusadeira 48v 2 baterias/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chave de impacto/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /máquina de solda mma200/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /caixa de ferramentas 46 peças/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /auto & moto/i }));
    expect(screen.getByRole("button", { name: /compressor de ar portátil/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bomba de ar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /intercomunicador de moto/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /capacetes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /carregador veicular turbo retrátil/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /eletrônicos/i }));
    expect(screen.getByRole("button", { name: /smart tv 43/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /smartwatch/i })).toBeInTheDocument();
  });
});
