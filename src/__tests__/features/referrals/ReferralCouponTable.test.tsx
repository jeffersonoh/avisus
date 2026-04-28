import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReferralCouponListItem } from "@/features/referrals/actions";
import { ReferralCouponTable } from "@/features/referrals/admin/ReferralCouponTable";

const routerMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

const activeCoupon: ReferralCouponListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "ATIVO_2026",
  partnerName: "Parceiro Ativo",
  partnerEmail: "ativo@avisus.local",
  commissionRatePct: 10,
  isActive: true,
  expiresAt: null,
  notes: null,
  createdAt: "2026-04-01T12:00:00.000Z",
  updatedAt: "2026-04-01T12:00:00.000Z",
  signupCount: 3,
  paidConversionCount: 1,
  commissionAmount: 123.45,
};

const inactiveCoupon: ReferralCouponListItem = {
  ...activeCoupon,
  id: "22222222-2222-4222-8222-222222222222",
  code: "INATIVO_2026",
  partnerName: "Parceiro Inativo",
  partnerEmail: null,
  isActive: false,
  signupCount: 0,
  paidConversionCount: 0,
  commissionAmount: 0,
};

describe("ReferralCouponTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza badge Ativo para cupom ativo e Inativo para cupom desativado", () => {
    render(<ReferralCouponTable coupons={[activeCoupon, inactiveCoupon]} toggleAction={vi.fn()} />);

    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("dispara action de toggle com o ID correto", async () => {
    const user = userEvent.setup();
    const toggleAction = vi.fn().mockResolvedValue({ ok: true, id: activeCoupon.id });
    render(<ReferralCouponTable coupons={[activeCoupon]} toggleAction={toggleAction} />);

    await user.click(screen.getByRole("button", { name: "Desativar" }));

    await waitFor(() => expect(toggleAction).toHaveBeenCalledWith(activeCoupon.id, false));
    expect(routerMocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("exibe erro quando action de toggle falha", async () => {
    const user = userEvent.setup();
    const toggleAction = vi.fn().mockResolvedValue({ ok: false, error: "Não foi possível atualizar o cupom." });
    render(<ReferralCouponTable coupons={[activeCoupon]} toggleAction={toggleAction} />);

    await user.click(screen.getByRole("button", { name: "Desativar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível atualizar o cupom.");
    expect(routerMocks.refresh).not.toHaveBeenCalled();
  });

  it("formata valores monetários em BRL pt-BR", () => {
    render(<ReferralCouponTable coupons={[activeCoupon]} toggleAction={vi.fn()} />);

    expect(screen.getByText("R$ 123,45")).toBeInTheDocument();
  });

  it("mantém ações essenciais acessíveis em viewport mobile", () => {
    vi.stubGlobal("innerWidth", 375);
    render(<ReferralCouponTable coupons={[activeCoupon]} toggleAction={vi.fn()} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute("href", `/admin/cupons/${activeCoupon.id}`);
    expect(screen.getByRole("button", { name: "Desativar" })).toBeEnabled();
  });

  it("renderiza estado vazio com CTA para criar cupom", () => {
    render(<ReferralCouponTable coupons={[]} toggleAction={vi.fn()} />);

    expect(screen.getByText("Nenhum cupom encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Criar cupom/ })).toHaveAttribute("href", "/admin/cupons/novo");
  });

  it("permite ativar cupom inativo", async () => {
    const user = userEvent.setup();
    const toggleAction = vi.fn().mockResolvedValue({ ok: true, id: inactiveCoupon.id });
    render(<ReferralCouponTable coupons={[inactiveCoupon]} toggleAction={toggleAction} />);

    await user.click(screen.getByRole("button", { name: "Ativar" }));

    await waitFor(() => expect(toggleAction).toHaveBeenCalledWith(inactiveCoupon.id, true));
  });
});
