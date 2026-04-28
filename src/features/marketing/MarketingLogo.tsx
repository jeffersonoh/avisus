"use client";

import { useEffect, useState } from "react";

export function MarketingLogo() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributeFilter: ["class"], attributes: true });

    return () => observer.disconnect();
  }, []);

  const src = isDark ? "/assets/logo-dark-new.png" : "/assets/logo-light-new.png";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Avisus"
      style={{
        display: "block",
        height: "clamp(74px, 11.9vw, 95px)",
        objectFit: "contain",
        width: "auto",
      }}
    />
  );
}
