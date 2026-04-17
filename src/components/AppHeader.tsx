"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/lib/auth/sign-out";
import { APP_MAIN_NAV, isNavActive } from "@/lib/app-nav";
import type { Plan } from "@/lib/plan-limits";

import { ThemeToggle } from "./theme/ThemeToggle";

export interface AppHeaderProps {
  plan: Plan;
  userLabel: string;
}

export function AppHeader({ plan, userLabel }: AppHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPro = plan === "pro";
  const planCtaLabel = isPro ? "Planos" : "Upgrade";
  const planCtaHighlight = !isPro;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[35] cursor-default bg-text-1/20 dark:bg-black/40"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="relative z-[45] mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 md:h-16 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Link
            href="/dashboard"
            className="shrink-0 font-display text-lg font-bold tracking-tight text-accent-dark dark:text-text-1"
          >
            Avisus
          </Link>
          <nav className="hidden min-w-0 items-center gap-1 md:flex" aria-label="Principal">
            {APP_MAIN_NAV.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-bg text-accent-light"
                      : "text-text-3 hover:bg-bg hover:text-text-1"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <Link
            href="/planos"
            className={`hidden rounded-lg px-3 py-2 text-sm font-semibold transition sm:inline-flex ${
              planCtaHighlight
                ? "border border-warning/35 bg-warning/10 text-warning hover:bg-warning/15"
                : "border border-border bg-bg text-text-2 hover:border-accent-light hover:text-text-1"
            }`}
          >
            {planCtaLabel}
          </Link>

          <ThemeToggle />

          <div className="relative">
            <button
              type="button"
              className="flex max-w-[10rem] items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5 text-left text-sm font-medium text-text-1 transition hover:border-accent-light"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="truncate">{userLabel}</span>
              <ChevronIcon open={menuOpen} />
            </button>
            {menuOpen ? (
              <div
                className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-border bg-card py-1 shadow-lg"
                role="menu"
              >
                <Link
                  href="/perfil"
                  role="menuitem"
                  className="block px-4 py-2.5 text-sm text-text-1 hover:bg-bg"
                  onClick={() => setMenuOpen(false)}
                >
                  Meu perfil
                </Link>
                <Link
                  href="/planos"
                  role="menuitem"
                  className="block px-4 py-2.5 text-sm text-text-1 hover:bg-bg sm:hidden"
                  onClick={() => setMenuOpen(false)}
                >
                  {planCtaLabel}
                </Link>
                <div className="my-1 border-t border-border" />
                <form action={signOut}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-bg"
                  >
                    Sair
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 text-text-3 transition ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
