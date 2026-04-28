"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "avisus-theme";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    /* storage indisponível */
  }
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function applyTheme(value: Theme) {
  document.documentElement.classList.toggle("dark", value === "dark");
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage indisponível */
  }
}

export function MarketingThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  function handleToggle() {
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
      style={{
        alignItems: "center",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        color: isDark ? "var(--brand-lime)" : "var(--accent)",
        cursor: "pointer",
        display: "inline-flex",
        height: 38,
        justifyContent: "center",
        transition: "background 180ms ease, color 180ms ease, transform 180ms ease",
        width: 38,
      }}
    >
      {mounted && isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
