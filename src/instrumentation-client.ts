import * as Sentry from "@sentry/nextjs";

import { getValidSentryDsn } from "@/lib/sentry-config";
import { beforeSend } from "@/lib/sentry-filter";

const sentryDsn = getValidSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);

Sentry.init({
  dsn: sentryDsn,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  enabled: !!sentryDsn,
  beforeSend,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
