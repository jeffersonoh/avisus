import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChannelConfig } from "@/features/notifications/ChannelConfig";

vi.mock("@/features/profile/actions", () => ({
  updateAlertChannels: vi.fn(),
  updateSilenceWindow: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { updateAlertChannels, updateSilenceWindow } from "@/features/profile/actions";

const defaultProps = {
  plan: "free" as const,
  initialChannels: [] as string[],
  initialSilenceStart: null,
  initialSilenceEnd: null,
};

describe("ChannelConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateAlertChannels).mockResolvedValue({ ok: true, savedFields: ["alert_channels"] });
    vi.mocked(updateSilenceWindow).mockResolvedValue({ ok: true, savedFields: ["silence_start", "silence_end"] });
  });

  it("renders all three channel options", () => {
    render(<ChannelConfig {...defaultProps} />);
    expect(screen.getByText("Telegram")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Web App")).toBeInTheDocument();
  });

  it("shows 'Inativo' status for Telegram and Web App when no channels are active", () => {
    render(<ChannelConfig {...defaultProps} />);
    const inactiveLabels = screen.getAllByText("Inativo");
    expect(inactiveLabels).toHaveLength(2);
  });

  it("shows 'Ativo' for Telegram when it starts active", () => {
    render(<ChannelConfig {...defaultProps} initialChannels={["telegram"]} />);
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("shows PRO badge on WhatsApp for free plan", () => {
    render(<ChannelConfig {...defaultProps} />);
    expect(screen.getByText("PRO")).toBeInTheDocument();
    expect(screen.getByText("Plano pago")).toBeInTheDocument();
  });

  it("hides PRO badge and shows 'Não configurado' on WhatsApp for starter plan", () => {
    render(<ChannelConfig {...defaultProps} plan="starter" />);
    expect(screen.queryByText("PRO")).not.toBeInTheDocument();
    expect(screen.getByText("Não configurado")).toBeInTheDocument();
  });

  it("toggles Telegram to active when the Telegram card is clicked", async () => {
    const user = userEvent.setup();
    render(<ChannelConfig {...defaultProps} />);
    const telegramBtn = screen.getByText("Telegram").closest("button")!;
    await user.click(telegramBtn);
    await waitFor(() => expect(within(telegramBtn).getByText("Ativo")).toBeInTheDocument());
  });

  it("toggles Web App to active when the Web App card is clicked", async () => {
    const user = userEvent.setup();
    render(<ChannelConfig {...defaultProps} />);
    const webBtn = screen.getByText("Web App").closest("button")!;
    await user.click(webBtn);
    await waitFor(() => expect(within(webBtn).getByText("Ativo")).toBeInTheDocument());
  });

  it("shows silence time controls when silence mode toggle is turned on", async () => {
    const user = userEvent.setup();
    render(<ChannelConfig {...defaultProps} />);
    const silenceToggle = screen.getByRole("switch", { name: /silêncio/i });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    await user.click(silenceToggle);
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });

  it("hides silence time controls when silence mode toggle is turned off", async () => {
    const user = userEvent.setup();
    render(<ChannelConfig {...defaultProps} initialSilenceStart="22:00" initialSilenceEnd="07:00" />);
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    const silenceToggle = screen.getByRole("switch", { name: /silêncio/i });
    await user.click(silenceToggle);
    await waitFor(() => expect(screen.queryByRole("combobox")).not.toBeInTheDocument());
  });

  it("applies preset silence times when a preset button is clicked", async () => {
    const user = userEvent.setup();
    render(<ChannelConfig {...defaultProps} initialSilenceStart="22:00" initialSilenceEnd="07:00" />);
    await user.click(screen.getByRole("button", { name: "23:00–08:00" }));
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects[0]?.value).toBe("23:00");
    expect(selects[1]?.value).toBe("08:00");
  });

  it("calls updateAlertChannels and updateSilenceWindow when save is clicked", async () => {
    const user = userEvent.setup();
    render(<ChannelConfig {...defaultProps} initialChannels={["web"]} />);
    await user.click(screen.getByRole("button", { name: /Salvar preferências/ }));
    await waitFor(() => expect(updateAlertChannels).toHaveBeenCalled());
    await waitFor(() => expect(updateSilenceWindow).toHaveBeenCalled());
  });

  it("shows 'Salvo!' feedback after a successful save", async () => {
    const user = userEvent.setup();
    render(<ChannelConfig {...defaultProps} initialChannels={["web"]} />);
    await user.click(screen.getByRole("button", { name: /Salvar preferências/ }));
    await waitFor(() => expect(screen.getByText("Salvo!")).toBeInTheDocument());
  });

  it("shows error message when updateAlertChannels fails", async () => {
    vi.mocked(updateAlertChannels).mockResolvedValue({
      ok: false,
      error: { code: "UNKNOWN", message: "Erro ao salvar canais." },
    });
    const user = userEvent.setup();
    render(<ChannelConfig {...defaultProps} initialChannels={["web"]} />);
    await user.click(screen.getByRole("button", { name: /Salvar preferências/ }));
    await waitFor(() => expect(screen.getByText("Erro ao salvar canais.")).toBeInTheDocument());
  });

  it("shows a link to /planos on WhatsApp card for free plan", () => {
    render(<ChannelConfig {...defaultProps} />);
    const link = screen.getByRole("link", { name: /Ver planos/ });
    expect(link).toHaveAttribute("href", "/planos");
  });
});
