const PLACEHOLDER_MARKERS = ["replace_with", "your_sentry_dsn"];

export function getValidSentryDsn(dsn: string | undefined): string | undefined {
  if (!dsn) return undefined;

  const normalizedDsn = dsn.trim();
  if (!normalizedDsn) return undefined;

  const lowerDsn = normalizedDsn.toLowerCase();
  if (PLACEHOLDER_MARKERS.some((marker) => lowerDsn.includes(marker))) return undefined;

  return /^https?:\/\//i.test(normalizedDsn) ? normalizedDsn : undefined;
}
