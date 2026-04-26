import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

function hasRealEnvValue(value: string | undefined): value is string {
  if (!value) return false;

  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue.length > 0 && !normalizedValue.includes("replace_with") && !normalizedValue.startsWith("your_");
}

const shouldUploadSentrySourcemaps =
  hasRealEnvValue(process.env.SENTRY_ORG) &&
  hasRealEnvValue(process.env.SENTRY_PROJECT) &&
  hasRealEnvValue(process.env.SENTRY_AUTH_TOKEN);

export default shouldUploadSentrySourcemaps
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
      webpack: {
        treeshake: {
          removeDebugLogging: true,
        },
        automaticVercelMonitors: false,
      },
    })
  : nextConfig;
