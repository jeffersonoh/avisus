export function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function discountPercent(price: number, originalPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round((1 - price / originalPrice) * 100);
}
