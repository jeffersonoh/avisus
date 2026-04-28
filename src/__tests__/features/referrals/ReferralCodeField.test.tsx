import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ReferralCodeField } from "@/features/referrals/ReferralCodeField";

describe("ReferralCodeField", () => {
  it("renders the partner coupon label and no-discount explanation", () => {
    render(<ReferralCodeField />);

    expect(screen.getByLabelText("Cupom de parceiro")).toBeInTheDocument();
    expect(screen.getByText(/não altera o preço do plano/i)).toBeInTheDocument();
  });

  it("shows initial value PARCEIRO_2026 when received by prop", () => {
    render(<ReferralCodeField initialValue="PARCEIRO_2026" />);

    expect(screen.getByLabelText("Cupom de parceiro")).toHaveValue("PARCEIRO_2026");
    expect(screen.getByRole("status")).toHaveTextContent("Cupom reconhecido.");
  });

  it("allows editing and removing the initial code", async () => {
    const user = userEvent.setup();
    render(<ReferralCodeField initialValue="PARCEIRO_2026" />);

    const input = screen.getByLabelText("Cupom de parceiro");

    await user.clear(input);
    expect(input).toHaveValue("");

    await user.type(input, "novo_2026");
    expect(input).toHaveValue("NOVO_2026");
  });

  it("shows accessible error when error is provided", () => {
    render(<ReferralCodeField error="Cupom inválido, inativo ou expirado." />);

    expect(screen.getByLabelText("Cupom de parceiro")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Cupom inválido, inativo ou expirado.");
  });
});
