import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddSellerForm } from "@/features/favorites/AddSellerForm";

vi.mock("@/features/favorites/actions", () => ({
  addFavoriteSeller: vi.fn(),
  removeFavoriteSeller: vi.fn(),
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

describe("AddSellerForm", () => {
  const onSubmit = vi.fn();
  const onSuccess = vi.fn();
  const onLimitReached = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("renders in link mode by default", () => {
    render(<AddSellerForm onSubmit={onSubmit} />);
    expect(screen.getByPlaceholderText(/Cole o link/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Por link/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Por nome/ })).toBeInTheDocument();
  });

  it("submit button is disabled when input is empty", () => {
    render(<AddSellerForm onSubmit={onSubmit} />);
    expect(screen.getByRole("button", { name: /Adicionar/ })).toBeDisabled();
  });

  it("switches to nome mode showing platform selector and updated placeholder", async () => {
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /Por nome/ }));
    expect(screen.getByPlaceholderText(/Nome ou @username/)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows validation error for a non-URL input in link mode", async () => {
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText(/Cole o link/), "nao-e-url");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error for a URL that is not Shopee or TikTok", async () => {
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText(/Cole o link/), "https://amazon.com.br/vendedor");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit and onSuccess with a valid Shopee URL", async () => {
    onSubmit.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} onSuccess={onSuccess} />);
    await user.type(screen.getByPlaceholderText(/Cole o link/), "https://shopee.com.br/vendedor123");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("https://shopee.com.br/vendedor123"));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("calls onSubmit with a valid TikTok URL", async () => {
    onSubmit.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText(/Cole o link/), "https://www.tiktok.com/@vendedor123");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith("https://www.tiktok.com/@vendedor123"),
    );
  });

  it("shows the error message returned from onSubmit failure", async () => {
    onSubmit.mockResolvedValue({ ok: false, reason: "duplicate", message: "Vendedor já cadastrado." });
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText(/Cole o link/), "https://shopee.com.br/vendedor123");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Vendedor já cadastrado."),
    );
  });

  it("calls onLimitReached when the server returns reason 'limit'", async () => {
    onSubmit.mockResolvedValue({ ok: false, reason: "limit", message: "Limite atingido." });
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} onLimitReached={onLimitReached} />);
    await user.type(screen.getByPlaceholderText(/Cole o link/), "https://shopee.com.br/vendedor123");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    await waitFor(() => expect(onLimitReached).toHaveBeenCalled());
  });

  it("builds a Shopee URL from nome mode and submits it", async () => {
    onSubmit.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /Por nome/ }));
    await user.type(screen.getByPlaceholderText(/Nome ou @username/), "vendedor123");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith("https://shopee.com.br/vendedor123"),
    );
  });

  it("builds a TikTok URL from nome mode after selecting TikTok platform", async () => {
    onSubmit.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /Por nome/ }));
    await user.selectOptions(screen.getByRole("combobox"), "tiktok");
    await user.type(screen.getByPlaceholderText(/Nome ou @username/), "vendedor123");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith("https://www.tiktok.com/@vendedor123"),
    );
  });

  it("disables the input and submit button when disabled prop is true", () => {
    render(<AddSellerForm onSubmit={onSubmit} disabled />);
    expect(screen.getByPlaceholderText(/Cole o link/)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Adicionar/ })).toBeDisabled();
  });

  it("clears the error message when the user types after a failure", async () => {
    onSubmit.mockResolvedValueOnce({ ok: false, reason: "validation", message: "URL inválida." });
    const user = userEvent.setup();
    render(<AddSellerForm onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText(/Cole o link/), "https://shopee.com.br/v");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText(/Cole o link/), "a");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
