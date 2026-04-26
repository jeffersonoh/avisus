import { headers } from "next/headers";

/**
 * Origem absoluta do app (para redirect OAuth).
 * Preferimos headers da requisição; use NEXT_PUBLIC_SITE_URL se não houver host (ex.: scripts).
 */
export async function getAppOrigin(): Promise<string> {
  const h = await headers();
  const forwardedHost = h.get("x-forwarded-host");
  const forwardedProto = h.get("x-forwarded-proto");
  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = h.get("host");
  if (host) {
    const proto = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${proto}://${host}`;
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  return "http://localhost:3000";
}
