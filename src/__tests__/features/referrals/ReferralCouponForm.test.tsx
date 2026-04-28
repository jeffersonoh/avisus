import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReferralCouponForm } from "@/features/referrals/admin/ReferralCouponForm";
import type { ReferralCouponDetail } from "@/features/referrals/actions";

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

const existingCoupon: ReferralCouponDetail = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "PARCEIRO_AVISUS",
  partnerName: "Parceiro Teste",
  partnerEmail: "parceiro@avisus.local",
  commissionRatePct: 12.5,
  isActive: true,
  expiresAt: "2026-05-10T12:00:00.000Z",
  notes: "Campanha de lançamento",
  createdAt: "2026-04-01T12:00:00.000Z",
  updatedAt: "2026-04-01T12:00:00.000Z",
  signupCount: 2,
  paidConversionCount: 1,
  commissionAmount: 19.9,
  conversions: [],
};

describe("ReferralCouponForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza campos código, parceiro, e-mail, comissão, expiração, ativo e observações", () => {
    render(<ReferralCouponForm mode="edit" coupon={existingCoupon} submitAction={vi.fn()} />);

    expect(screen.getByLabelText("Código")).toHaveValue("PARCEIRO_AVISUS");
    expect(screen.getByLabelText("Parceiro")).toHaveValue("Parceiro Teste");
    expect(screen.getByLabelText("E-mail do parceiro")).toHaveValue("parceiro@avisus.local");
    expect(screen.getByLabelText("Comissão (%)")).toHaveValue(12.5);
    expect(screen.getByLabelText("Expiração")).toBeInTheDocument();
    expect(screen.getByLabelText(/Ativo/)).toBeChecked();
    expect(screen.getByLabelText("Observações")).toHaveValue("Campanha de lançamento");
  });

  it("mostra erro para comissão acima de 100%", async () => {
    const user = userEvent.setup();
    render(<ReferralCouponForm mode="create" submitAction={vi.fn()} />);

    await user.type(screen.getByLabelText("Código"), "PARCEIRO_AVISUS");
    await user.type(screen.getByLabelText("Parceiro"), "Parceiro Teste");
    await user.type(screen.getByLabelText("E-mail do parceiro"), "parceiro@avisus.local");
    await user.clear(screen.getByLabelText("Comissão (%)"));
    await user.type(screen.getByLabelText("Comissão (%)"), "101");
    await user.click(screen.getByRole("button", { name: /Criar cupom/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Comissão deve estar entre 0 e 100.");
  });

  it("envia dados válidos para criação e mostra sucesso/redirect", async () => {
    const user = userEvent.setup();
    const submitAction = vi.fn().mockResolvedValue({ ok: true, id: "coupon-1" });
    render(<ReferralCouponForm mode="create" submitAction={submitAction} />);

    await user.type(screen.getByLabelText("Código"), "parceiro_avisus");
    await user.type(screen.getByLabelText("Parceiro"), "Parceiro Teste");
    await user.type(screen.getByLabelText("E-mail do parceiro"), "parceiro@avisus.local");
    await user.clear(screen.getByLabelText("Comissão (%)"));
    await user.type(screen.getByLabelText("Comissão (%)"), "15");
    await user.click(screen.getByRole("button", { name: /Criar cupom/ }));

    await waitFor(() =>
      expect(submitAction).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "PARCEIRO_AVISUS",
          partnerName: "Parceiro Teste",
          partnerEmail: "parceiro@avisus.local",
          commissionRatePct: 15,
          isActive: true,
        }),
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Cupom criado com sucesso.");
    expect(routerMocks.push).toHaveBeenCalledWith("/admin/cupons");
  });
});
