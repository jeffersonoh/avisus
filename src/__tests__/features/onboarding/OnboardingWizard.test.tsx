import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/components/theme/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("@/features/interests/hooks", () => ({
  useInterests: vi.fn(),
  POPULAR_INTEREST_SUGGESTIONS: ["air fryer", "tênis nike"],
}));

vi.mock("@/features/interests/actions", () => ({
  createInterest: vi.fn(),
  deleteInterest: vi.fn(),
  updateInterest: vi.fn(),
}));

vi.mock("@/features/profile/RegionSelector", () => ({
  RegionSelector: ({
    onUfChange,
    onCityChange,
  }: {
    uf: string;
    city: string;
    onUfChange: (uf: string) => void;
    onCityChange: (city: string) => void;
  }) => (
    <div data-testid="region-selector">
      <button type="button" onClick={() => onUfChange("SC")}>Selecionar SC</button>
      <button type="button" onClick={() => onCityChange("Florianópolis")}>Selecionar Florianópolis</button>
    </div>
  ),
}));

vi.mock("@/features/onboarding/actions", () => ({
  finishOnboarding: vi.fn(),
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

import { useInterests } from "@/features/interests/hooks";
import { finishOnboarding } from "@/features/onboarding/actions";

const noInterests = {
  interests: [],
  createInterest: vi.fn().mockResolvedValue({ ok: true }),
  updateInterest: vi.fn().mockResolvedValue({ ok: true }),
  deleteInterest: vi.fn().mockResolvedValue({ ok: true }),
  maxInterests: 5,
  unlimitedPlan: false,
  limitReached: false,
  remainingSlots: 5,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
};

const withOneInterest = {
  ...noInterests,
  interests: [{ id: "1", term: "air fryer", active: true, created_at: "2024-01-01", last_scanned_at: null }],
};

const defaultProps = {
  plan: "free" as const,
  initialInterests: [],
  initialUf: null,
  initialCity: null,
  initialAlertChannels: ["web"],
  initialTelegramUsername: null,
};

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useInterests).mockReturnValue(noInterests);
  });

  it("renders step 1 with 'Seus interesses' heading by default", () => {
    render(<OnboardingWizard {...defaultProps} />);
    expect(screen.getByText("Seus interesses")).toBeInTheDocument();
    expect(screen.getByText(/Passo 1 de 3/)).toBeInTheDocument();
  });

  it("renders popular interest suggestion chips in step 1", () => {
    render(<OnboardingWizard {...defaultProps} />);
    expect(screen.getByRole("button", { name: /air fryer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tênis nike/i })).toBeInTheDocument();
  });

  it("shows an error when trying to advance from step 1 with no interests", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cadastre ao menos um interesse para continuar.",
    );
  });

  it("advances to step 2 when at least one interest exists", async () => {
    vi.mocked(useInterests).mockReturnValue(withOneInterest);
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => expect(screen.getByText("Sua região")).toBeInTheDocument());
    expect(screen.getByText(/Passo 2 de 3/)).toBeInTheDocument();
  });

  it("renders the RegionSelector in step 2", async () => {
    vi.mocked(useInterests).mockReturnValue(withOneInterest);
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => expect(screen.getByTestId("region-selector")).toBeInTheDocument());
  });

  it("goes back to step 1 when Voltar is clicked on step 2", async () => {
    vi.mocked(useInterests).mockReturnValue(withOneInterest);
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Sua região"));
    await user.click(screen.getByRole("button", { name: /Voltar/ }));
    await waitFor(() => expect(screen.getByText("Seus interesses")).toBeInTheDocument());
  });

  it("shows error when trying to advance from step 2 without region", async () => {
    vi.mocked(useInterests).mockReturnValue(withOneInterest);
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Sua região"));
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Selecione UF e cidade para avançar.");
  });

  it("advances to step 3 after selecting UF and city in step 2", async () => {
    vi.mocked(useInterests).mockReturnValue(withOneInterest);
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Sua região"));
    await user.click(screen.getByRole("button", { name: /Selecionar SC/ }));
    await user.click(screen.getByRole("button", { name: /Selecionar Florianópolis/ }));
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => expect(screen.getByText("Canal de alertas")).toBeInTheDocument());
    expect(screen.getByText(/Passo 3 de 3/)).toBeInTheDocument();
  });

  it("renders LGPD consent checkbox and conclude button in step 3", async () => {
    vi.mocked(useInterests).mockReturnValue(withOneInterest);
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Sua região"));
    await user.click(screen.getByRole("button", { name: /Selecionar SC/ }));
    await user.click(screen.getByRole("button", { name: /Selecionar Florianópolis/ }));
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Canal de alertas"));
    expect(screen.getByText("Cálculo da margem")).toBeInTheDocument();
    expect(screen.getByText(/Mercado Livre 15% e Magazine Luiza 16%/)).toBeInTheDocument();
    expect(screen.getByText(/Perfil > Margem de revenda/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Começar a monitorar/ })).toBeDisabled();
  });

  it("enables the conclude button only after LGPD consent is given", async () => {
    vi.mocked(useInterests).mockReturnValue(withOneInterest);
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Sua região"));
    await user.click(screen.getByRole("button", { name: /Selecionar SC/ }));
    await user.click(screen.getByRole("button", { name: /Selecionar Florianópolis/ }));
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Canal de alertas"));
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: /Começar a monitorar/ })).not.toBeDisabled();
  });

  it("calls finishOnboarding and navigates on successful conclude", async () => {
    vi.mocked(finishOnboarding).mockResolvedValue({ ok: true, redirectTo: "/dashboard" });
    vi.mocked(useInterests).mockReturnValue(withOneInterest);
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Sua região"));
    await user.click(screen.getByRole("button", { name: /Selecionar SC/ }));
    await user.click(screen.getByRole("button", { name: /Selecionar Florianópolis/ }));
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Canal de alertas"));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Começar a monitorar/ }));
    await waitFor(() => expect(finishOnboarding).toHaveBeenCalled());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows error message when finishOnboarding fails", async () => {
    vi.mocked(finishOnboarding).mockResolvedValue({ ok: false, error: "Erro no servidor." });
    vi.mocked(useInterests).mockReturnValue(withOneInterest);
    const user = userEvent.setup();
    render(<OnboardingWizard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Sua região"));
    await user.click(screen.getByRole("button", { name: /Selecionar SC/ }));
    await user.click(screen.getByRole("button", { name: /Selecionar Florianópolis/ }));
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    await waitFor(() => screen.getByText("Canal de alertas"));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Começar a monitorar/ }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor."),
    );
  });
});
