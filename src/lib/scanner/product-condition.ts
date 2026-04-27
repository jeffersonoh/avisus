export type ProductConditionFilterInput = {
  name: string;
  category?: string | null;
  buyUrl?: string | null;
};

const BLOCKED_NON_NEW_PRODUCT_PATTERNS = [
  /\busad[oa]s?\b/,
  /\bsemi\s*nov[oa]s?\b/,
  /\bseminov[oa]s?\b/,
  /\brecondicionad[oa]s?\b/,
  /\brefurbished\b/,
  /\brefurb\b/,
  /\bopen\s*box\b/,
  /\bvitrine\b/,
  /\bmostruari[oa]\b/,
  /\brenovad[oa]s?\b/,
  /\bpre\s*owned\b/,
  /\bsegunda\s*mao\b/,
];

function normalizeConditionText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLikelyNewProduct(input: ProductConditionFilterInput): boolean {
  const normalizedText = normalizeConditionText(
    [input.name, input.category, input.buyUrl].filter((value): value is string => Boolean(value)).join(" "),
  );

  if (!normalizedText) {
    return false;
  }

  return !BLOCKED_NON_NEW_PRODUCT_PATTERNS.some((pattern) => pattern.test(normalizedText));
}
