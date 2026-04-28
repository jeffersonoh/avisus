import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { REFERRAL_RECOGNIZED_MESSAGE } from "@/features/referrals/messages";

const mocks = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn(),
  },
  signInWithGoogle: vi.fn(),
  signUpWithEmail: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
  signInWithGoogle: mocks.signInWithGoogle,
  signUpWithEmail: mocks.signUpWithEmail,
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mocks.cookieStore),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import RegistroPage from "@/app/(auth)/registro/page";

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieStore.get.mockReturnValue(undefined);
    mocks.signUpWithEmail.mockResolvedValue({});
  });

  it("submits referralCode with email and password when filled", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("E-mail"), "novo@avisus.test");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.type(screen.getByLabelText("Cupom de parceiro"), "parceiro_avisus");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => expect(mocks.signUpWithEmail).toHaveBeenCalled());
    const formData = mocks.signUpWithEmail.mock.calls[0]?.[1] as FormData;
    expect(formData.get("email")).toBe("novo@avisus.test");
    expect(formData.get("password")).toBe("password123");
    expect(formData.get("referralCode")).toBe("PARCEIRO_AVISUS");
  });

  it("keeps signup possible without coupon and does not mark the field as required", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const referralInput = screen.getByLabelText("Cupom de parceiro");
    expect(referralInput).not.toBeRequired();

    await user.type(screen.getByLabelText("E-mail"), "semcupom@avisus.test");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => expect(mocks.signUpWithEmail).toHaveBeenCalled());
    const formData = mocks.signUpWithEmail.mock.calls[0]?.[1] as FormData;
    expect(formData.get("referralCode")).toBe("");
  });

  it("validates invalid coupon format on the client before submit", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("E-mail"), "cliente@avisus.test");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.type(screen.getByLabelText("Cupom de parceiro"), "abc");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Cupom inválido.");
    expect(mocks.signUpWithEmail).not.toHaveBeenCalled();
  });

  it("shows server referralCode error and allows correction", async () => {
    const user = userEvent.setup();
    mocks.signUpWithEmail.mockResolvedValueOnce({
      fieldErrors: { referralCode: "Cupom inválido, inativo ou expirado." },
    });
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("E-mail"), "erro@avisus.test");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.type(screen.getByLabelText("Cupom de parceiro"), "valido_2026");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cupom inválido, inativo ou expirado.");

    const referralInput = screen.getByLabelText("Cupom de parceiro");
    await user.clear(referralInput);
    await user.type(referralInput, "outro_2026");

    expect(referralInput).toHaveValue("OUTRO_2026");
  });

  it("shows general server error feedback", async () => {
    const user = userEvent.setup();
    mocks.signUpWithEmail.mockResolvedValueOnce({ error: "Não foi possível concluir o cadastro." });
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("E-mail"), "geral@avisus.test");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir o cadastro.");
  });

  it("shows server info feedback", async () => {
    const user = userEvent.setup();
    mocks.signUpWithEmail.mockResolvedValueOnce({ info: "Verifique seu e-mail para ativar a conta." });
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("E-mail"), "info@avisus.test");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Verifique seu e-mail para ativar a conta.");
  });
});

describe("RegistroPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signUpWithEmail.mockResolvedValue({});
  });

  it("renders the form with referral field filled from avisus_referral_code cookie", async () => {
    mocks.cookieStore.get.mockImplementation((name: string) =>
      name === "avisus_referral_code" ? { value: "PARCEIRO_AVISUS" } : undefined,
    );

    render(await RegistroPage());

    expect(screen.getByLabelText("Cupom de parceiro")).toHaveValue("PARCEIRO_AVISUS");
    expect(screen.getByRole("status")).toHaveTextContent(REFERRAL_RECOGNIZED_MESSAGE);
  });
});
