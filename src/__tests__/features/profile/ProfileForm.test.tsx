import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileForm } from "@/features/profile/ProfileForm";

vi.mock("@/features/profile/hooks", () => ({
  useProfile: vi.fn(),
}));

vi.mock("@/features/profile/ProfileCompleteness", () => ({
  ProfileCompleteness: () => null,
}));

vi.mock("@/features/profile/RegionSelector", () => ({
  RegionSelector: () => <div data-testid="region-selector" />,
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { useProfile } from "@/features/profile/hooks";

const defaultProfile = {
  name: "Carlos Silva",
  email: "carlos@email.com",
  phone: "",
  uf: "SC",
  city: "Florianópolis",
  telegramUsername: "",
  alertChannels: ["web"] as ("web" | "telegram")[],
  lgpdConsent: true,
};

const defaultHookReturn = {
  profile: defaultProfile,
  updateProfileField: vi.fn(),
  toggleAlertChannel: vi.fn(),
  isSaving: false,
  error: null,
  saveFeedback: null,
};

const defaultProps = {
  plan: "free" as const,
  initialName: "Carlos Silva",
  initialEmail: "carlos@email.com",
  initialPhone: null,
  initialUf: "SC",
  initialCity: "Florianópolis",
  initialTelegramUsername: null,
  initialAlertChannels: ["web"],
};

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProfile).mockReturnValue(defaultHookReturn);
  });

  it("renders the plan card with the FREE plan label", () => {
    render(<ProfileForm {...defaultProps} />);
    expect(screen.getByText(/Plano FREE/i)).toBeInTheDocument();
  });

  it("renders the personal information section with name and email inputs", () => {
    render(<ProfileForm {...defaultProps} />);
    expect(screen.getByDisplayValue("Carlos Silva")).toBeInTheDocument();
    expect(screen.getByDisplayValue("carlos@email.com")).toBeInTheDocument();
  });

  it("email input is read-only", () => {
    render(<ProfileForm {...defaultProps} />);
    const emailInput = screen.getByDisplayValue("carlos@email.com");
    expect(emailInput).toHaveAttribute("readonly");
  });

  it("renders the region selector component", () => {
    render(<ProfileForm {...defaultProps} />);
    expect(screen.getByTestId("region-selector")).toBeInTheDocument();
  });

  it("renders the alert channels section with Web App and Telegram toggles", () => {
    render(<ProfileForm {...defaultProps} />);
    expect(screen.getByRole("switch", { name: /Canal web/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Canal telegram/i })).toBeInTheDocument();
  });

  it("web channel toggle reflects active state when web is in alertChannels", () => {
    render(<ProfileForm {...defaultProps} />);
    const webToggle = screen.getByRole("switch", { name: /Canal web/i });
    expect(webToggle).toHaveAttribute("aria-checked", "true");
  });

  it("calls updateProfileField with new name when the name input changes", async () => {
    const updateProfileField = vi.fn();
    vi.mocked(useProfile).mockReturnValue({ ...defaultHookReturn, updateProfileField });
    const user = userEvent.setup();
    render(<ProfileForm {...defaultProps} />);
    const nameInput = screen.getByDisplayValue("Carlos Silva");
    await user.clear(nameInput);
    await user.type(nameInput, "Ana");
    expect(updateProfileField).toHaveBeenCalledWith("name", expect.any(String));
  });

  it("calls toggleAlertChannel when the web toggle is clicked", async () => {
    const toggleAlertChannel = vi.fn();
    // Both channels active so canDisableWeb = true and the toggle is enabled
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      toggleAlertChannel,
      profile: { ...defaultProfile, alertChannels: ["web", "telegram"] },
    });
    const user = userEvent.setup();
    render(<ProfileForm {...defaultProps} />);
    const webToggle = screen.getByRole("switch", { name: /Canal web/i });
    await user.click(webToggle);
    expect(toggleAlertChannel).toHaveBeenCalledWith("web", false);
  });

  it("renders the LGPD consent section", () => {
    render(<ProfileForm {...defaultProps} />);
    expect(screen.getByText("Privacidade e dados (LGPD)")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("shows error message when error is set in the hook", () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      error: "Não foi possível salvar o perfil.",
    });
    render(<ProfileForm {...defaultProps} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar o perfil.");
  });

  it("shows 'Salvando...' text when isSaving is true", () => {
    vi.mocked(useProfile).mockReturnValue({ ...defaultHookReturn, isSaving: true });
    render(<ProfileForm {...defaultProps} />);
    expect(screen.getByText("Salvando...")).toBeInTheDocument();
  });

  it("shows save feedback when saveFeedback is set", () => {
    vi.mocked(useProfile).mockReturnValue({ ...defaultHookReturn, saveFeedback: "Salvo" });
    render(<ProfileForm {...defaultProps} />);
    expect(screen.getByText("Salvo")).toBeInTheDocument();
  });

  it("renders an upgrade link to /planos for free plan", () => {
    render(<ProfileForm {...defaultProps} />);
    const upgradeLink = screen.getByRole("link", { name: /Upgrade/i });
    expect(upgradeLink).toHaveAttribute("href", "/planos");
  });

  it("renders a valid telegram username indicator when telegramUsername is valid", () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      profile: { ...defaultProfile, telegramUsername: "@usuario_valido" },
    });
    render(<ProfileForm {...defaultProps} />);
    expect(screen.getByText("Válido")).toBeInTheDocument();
  });
});
