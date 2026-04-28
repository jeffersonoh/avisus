export type ReferralCommissionCsvRow = {
  couponCode: string;
  partnerName: string;
  commissionRatePct: number;
  conversionId: string;
  userReference: string;
  paidPlan: string;
  paidAmount: number;
  paidCurrency: string;
  commissionAmount: number;
  signupDate: string;
  firstPaidDate: string;
  stripeInvoiceId: string | null;
};

const REFERRAL_COMMISSION_CSV_HEADERS = [
  "cupom",
  "parceiro",
  "taxa_comissao_pct",
  "conversao_id",
  "usuario_ref",
  "plano_pago",
  "valor_base",
  "moeda",
  "comissao_calculada",
  "data_cadastro",
  "data_primeiro_pagamento",
  "stripe_invoice_id",
];

export function calculateReferralCommissionAmount(paidAmount: number, commissionRatePct: number): number {
  return Math.round(((paidAmount * commissionRatePct) / 100 + Number.EPSILON) * 100) / 100;
}

function formatCsvMoney(value: number): string {
  return value.toFixed(2);
}

function escapeCsvField(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeReferralCommissionsCsv(rows: ReferralCommissionCsvRow[]): string {
  const lines = [
    REFERRAL_COMMISSION_CSV_HEADERS.join(","),
    ...rows.map((row) =>
      [
        row.couponCode,
        row.partnerName,
        row.commissionRatePct.toFixed(2),
        row.conversionId,
        row.userReference,
        row.paidPlan,
        formatCsvMoney(row.paidAmount),
        row.paidCurrency,
        formatCsvMoney(calculateReferralCommissionAmount(row.paidAmount, row.commissionRatePct)),
        row.signupDate,
        row.firstPaidDate,
        row.stripeInvoiceId,
      ]
        .map(escapeCsvField)
        .join(","),
    ),
  ];

  return `${lines.join("\n")}\n`;
}
