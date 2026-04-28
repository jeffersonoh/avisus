import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReferralCouponDetail, ReferralCouponListItem } from "@/features/referrals/actions";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  listReferralCoupons: vi.fn(),
  getReferralCouponDetails: vi.fn(),
  createReferralCouponAction: vi.fn(),
  updateReferralCouponAction: vi.fn(),
  toggleReferralCouponAction: vi.fn(),
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.routerPush, refresh: mocks.routerRefresh }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/features/referrals/actions", () => ({
  listReferralCoupons: mocks.listReferralCoupons,
  getReferralCouponDetails: mocks.getReferralCouponDetails,
  createReferralCouponAction: mocks.createReferralCouponAction,
  updateReferralCouponAction: mocks.updateReferralCouponAction,
  toggleReferralCouponAction: mocks.toggleReferralCouponAction,
}));

import AdminCouponsPage from "@/app/(admin)/admin/cupons/page";
import NewReferralCouponPage from "@/app/(admin)/admin/cupons/novo/page";
import EditReferralCouponPage from "@/app/(admin)/admin/cupons/[id]/page";

const listCoupon: ReferralCouponListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "PARCEIRO_2026",
  partnerName: "Parceiro Teste",
  partnerEmail: "parceiro@avisus.local",
  commissionRatePct: 10,
  isActive: true,
  expiresAt: null,
  notes: null,
  createdAt: "2026-04-01T12:00:00.000Z",
  updatedAt: "2026-04-01T12:00:00.000Z",
  signupCount: 4,
  paidConversionCount: 2,
  commissionAmount: 200,
};

const detailCoupon: ReferralCouponDetail = {
  ...listCoupon,
  notes: "Campanha principal",
  conversions: [
    {
      id: "conversion-1",
      userId: "33333333-3333-4333-8333-333333333333",
      planSelected: "pro",
      signupDate: "2026-04-10T12:00:00.000Z",
      firstPaidDate: "2026-04-11T12:00:00.000Z",
      paidAmount: 199,
      paidCurrency: "BRL",
      stripeInvoiceId: "in_123",
      stripeSubscriptionId: "sub_123",
      commissionAmount: 19.9,
    },
  ],
};

describe("Admin coupon pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    mocks.createReferralCouponAction.mockResolvedValue({ ok: true, id: listCoupon.id });
    mocks.updateReferralCouponAction.mockResolvedValue({ ok: true, id: listCoupon.id });
  });

  it("/admin/cupons renderiza lista vazia com CTA para criar cupom", async () => {
    mocks.listReferralCoupons.mockResolvedValue({ ok: true, items: [] });

    render(await AdminCouponsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Gestão de cupons" })).toBeInTheDocument();
    expect(screen.getByText("Nenhum cupom encontrado")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Criar cupom/ })[0]).toHaveAttribute("href", "/admin/cupons/novo");
  });

  it("/admin/cupons renderiza métricas agregadas quando há conversões", async () => {
    mocks.listReferralCoupons.mockResolvedValue({ ok: true, items: [listCoupon] });

    render(await AdminCouponsPage({ searchParams: Promise.resolve({ status: "active" }) }));

    expect(mocks.listReferralCoupons).toHaveBeenCalledWith({ status: "active", limit: 50 });
    expect(screen.getAllByText("Cadastros").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Conversões pagas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("R$ 200,00").length).toBeGreaterThan(0);
  });

  it("/admin/cupons/novo envia dados válidos para criação e mostra sucesso/redirect", async () => {
    const user = userEvent.setup();

    render(await NewReferralCouponPage());

    await user.type(screen.getByLabelText("Código"), "parceiro_2026");
    await user.type(screen.getByLabelText("Parceiro"), "Parceiro Teste");
    await user.type(screen.getByLabelText("E-mail do parceiro"), "parceiro@avisus.local");
    await user.clear(screen.getByLabelText("Comissão (%)"));
    await user.type(screen.getByLabelText("Comissão (%)"), "10");
    await user.click(screen.getByRole("button", { name: /Criar cupom/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("Cupom criado com sucesso.");
    expect(mocks.createReferralCouponAction).toHaveBeenCalledWith(
      expect.objectContaining({ code: "PARCEIRO_2026", partnerName: "Parceiro Teste" }),
    );
    expect(mocks.routerPush).toHaveBeenCalledWith("/admin/cupons");
  });

  it("/admin/cupons/[id] carrega dados existentes para edição", async () => {
    mocks.getReferralCouponDetails.mockResolvedValue({ ok: true, coupon: detailCoupon });

    render(await EditReferralCouponPage({ params: Promise.resolve({ id: listCoupon.id }) }));

    expect(mocks.getReferralCouponDetails).toHaveBeenCalledWith(listCoupon.id);
    expect(screen.getByRole("heading", { name: "PARCEIRO_2026" })).toBeInTheDocument();
    expect(screen.getByLabelText("Código")).toHaveValue("PARCEIRO_2026");
    expect(screen.getByLabelText("Parceiro")).toHaveValue("Parceiro Teste");
    expect(screen.getByText("Histórico de conversões")).toBeInTheDocument();
    expect(screen.getByText("R$ 19,90")).toBeInTheDocument();
  });

  it("/admin/cupons/[id] mostra erro quando detalhe não carrega", async () => {
    mocks.getReferralCouponDetails.mockResolvedValue({ ok: false, error: "Não foi possível carregar o cupom." });

    render(await EditReferralCouponPage({ params: Promise.resolve({ id: listCoupon.id }) }));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar o cupom.");
  });

  it("/admin/cupons/[id] mostra estado vazio quando não há conversões", async () => {
    mocks.getReferralCouponDetails.mockResolvedValue({ ok: true, coupon: { ...detailCoupon, conversions: [] } });

    render(await EditReferralCouponPage({ params: Promise.resolve({ id: listCoupon.id }) }));

    expect(screen.getByText("Ainda não há cadastros atribuídos a este cupom.")).toBeInTheDocument();
  });
});
