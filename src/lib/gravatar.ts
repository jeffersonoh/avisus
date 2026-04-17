"use client";

import { useEffect, useState } from "react";

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function useGravatar(email: string, size = 128): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!email || !email.trim().includes("@")) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    sha256(email.trim().toLowerCase()).then((hash) => {
      if (!cancelled) setUrl(`https://gravatar.com/avatar/${hash}?s=${size}&d=404`);
    });
    return () => {
      cancelled = true;
    };
  }, [email, size]);

  return url;
}
