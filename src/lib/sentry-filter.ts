import type { Event } from "@sentry/nextjs";

const PII_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b\d{2}[\s.-]?\d{4,5}[\s.-]?\d{4}\b/g,
  /\b(Bearer|token|secret|password|key)\s*[=:]\s*\S+/gi,
];

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    let out = value;
    for (const pattern of PII_PATTERNS) out = out.replace(pattern, "[REDACTED]");
    return out;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, redact(v)]),
    );
  }
  return value;
}

const SENSITIVE_KEYS = new Set([
  "email",
  "phone",
  "password",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
  "body",
]);

function stripSensitiveHeaders(obj: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k.toLowerCase()) ? "[REDACTED]" : String(redact(v) ?? ""),
    ]),
  );
}

export function beforeSend<TEvent extends Event>(event: TEvent): TEvent | null {
  if (event.request) {
    event.request = {
      ...event.request,
      data: undefined,
      cookies: undefined,
      headers: event.request.headers
        ? stripSensitiveHeaders(event.request.headers as Record<string, unknown>)
        : undefined,
    };
  }

  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      message: breadcrumb.message ? String(redact(breadcrumb.message)) : breadcrumb.message,
      data: breadcrumb.data ? (redact(breadcrumb.data) as Record<string, unknown>) : breadcrumb.data,
    }));
  }

  if (event.user) {
    event.user = { id: event.user.id };
  }

  return event;
}
