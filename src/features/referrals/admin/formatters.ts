const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatReferralCurrency(value: number): string {
  return brlFormatter.format(value);
}
