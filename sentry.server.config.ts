import * as Sentry from "@sentry/nextjs";

import { beforeSend } from "@/lib/sentry-filter";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  enabled: !!process.env.SENTRY_DSN,
  beforeSend,
});
