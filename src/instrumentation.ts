import * as Sentry from "@sentry/nextjs";

import { beforeSend } from "@/lib/sentry-filter";

const baseOptions = {
  tracesSampleRate: 0.1,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  beforeSend,
};

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      ...baseOptions,
      dsn: process.env.SENTRY_DSN,
      enabled: !!process.env.SENTRY_DSN,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      ...baseOptions,
      dsn: process.env.SENTRY_DSN,
      enabled: !!process.env.SENTRY_DSN,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
