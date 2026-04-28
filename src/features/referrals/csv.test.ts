import { describe, expect, it } from "vitest";

import {
  calculateReferralCommissionAmount,
  serializeReferralCommissionsCsv,
  type ReferralCommissionCsvRow,
} from "./csv";

const baseRow: ReferralCommissionCsvRow = {
  couponCode: "PARCEIRO_AVISUS",
  partnerName: "Parceiro Teste",
  commissionRatePct: 12.5,
  conversionId: "conversion-1",
  userReference: "user:12345678",
  paidPlan: "starter",
  paidAmount: 199.9,
  paidCurrency: "BRL",
  commissionAmount: 24.99,
  signupDate: "2026-04-20T10:00:00.000Z",
  firstPaidDate: "2026-04-21T10:00:00.000Z",
  stripeInvoiceId: "in_123",
};

describe("referral commission CSV", () => {
  it("escapes commas, quotes and line breaks in text fields", () => {
    const csv = serializeReferralCommissionsCsv([
      {
        ...baseRow,
        couponCode: "CUPOM,2026",
        partnerName: "Parceiro \"Linha\"\nNova",
      },
    ]);

    expect(csv).toContain('"CUPOM,2026"');
    expect(csv).toContain('"Parceiro ""Linha""\nNova"');
  });

  it("calculates commission from paid amount and rate with two decimal places", () => {
    expect(calculateReferralCommissionAmount(199.9, 12.5)).toBe(24.99);

    const csv = serializeReferralCommissionsCsv([baseRow]);

    expect(csv).toContain("199.90,BRL,24.99");
  });
});
