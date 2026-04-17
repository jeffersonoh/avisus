"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppIcon } from "@/components/AppIcon";
import { signOut } from "@/lib/auth/sign-out";
import { isNavActive } from "@/lib/app-nav";
import { useGravatar } from "@/lib/gravatar";
import type { Plan } from "@/lib/plan-limits";

import { useTheme } from "./theme/ThemeProvider";
import { ThemeToggle } from "./theme/ThemeToggle";

export interface AppHeaderProps {
  plan: Plan;
  userLabel: string;
  userEmail?: string;
}

const PLAN_COLOR: Record<Plan, string> = {
  free: "#7B42C9",
  starter: "#D4A017",
  pro: "#2E8B57",
};

const PLAN_LABEL: Record<Plan, string> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
};

const DESKTOP_NAV = [
  { href: "/dashboard", label: "Oportunidades", icon: "grid" as const },
  { href: "/interesses", label: "Interesses", icon: "star" as const },
  { href: "/alertas", label: "Alertas", icon: "bell" as const },
  { href: "/favoritos", label: "Favoritos", icon: "heart" as const },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function AppHeader({ plan, userLabel, userEmail = "" }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const planColor = PLAN_COLOR[plan];
  const planLabel = PLAN_LABEL[plan];
  const isProfileActive = isNavActive(pathname, "/perfil");
  const initials = getInitials(userLabel);

  const gravatarUrl = useGravatar(userEmail, 64);
  const [gravatarOk, setGravatarOk] = useState(false);
  useEffect(() => {
    if (!gravatarUrl) { setGravatarOk(false); return; }
    setGravatarOk(false);
    const img = new Image();
    img.onload = () => setGravatarOk(true);
    img.onerror = () => setGravatarOk(false);
    img.src = gravatarUrl;
  }, [gravatarUrl]);

  return (
    <header
      className="sticky top-0 z-40 border-b border-border"
      style={{
        background: "var(--glass)",
        backdropFilter: "blur(20px) saturate(180%)",
        height: 56,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 md:px-6">
        {/* Left: logo + nav */}
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <Link href="/dashboard" className="shrink-0 flex items-center" aria-label="Avisus">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme === "dark" ? "/assets/logo-dark-new.png" : "/assets/logo-light-new.png"}
              alt="Avisus"
              style={{ height: "clamp(74px, 11.9vw, 95px)", width: "auto", objectFit: "contain", display: "block" }}
            />
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Principal">
            {DESKTOP_NAV.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-[5px] rounded-[10px] px-3.5 py-[7px] text-[13px] font-medium transition"
                  style={{
                    background: active ? "var(--nav-active)" : "transparent",
                    color: active ? "var(--accent-light)" : "var(--text-3)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <AppIcon
                    name={item.icon}
                    size={14}
                    stroke={active ? "var(--accent-light)" : "var(--text-3)"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: plan badge + theme toggle + profile + logout */}
        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/planos"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 8,
              background: `color-mix(in srgb, ${planColor} 12%, var(--card))`,
              border: `1px solid color-mix(in srgb, ${planColor} 30%, var(--border))`,
              fontSize: 11,
              fontWeight: 800,
              color: planColor,
              letterSpacing: "0.06em",
              animation: isNavActive(pathname, "/planos") ? "none" : "subtlePulse 3s ease-in-out infinite",
              textDecoration: "none",
            }}
          >
            {planLabel} <AppIcon name="arrowUpRight" size={10} stroke={planColor} />
          </Link>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => router.push("/perfil")}
            title="Meu Perfil"
            className="flex items-center gap-[7px] rounded-full transition"
            style={{
              padding: "4px 10px 4px 4px",
              background: isProfileActive ? "var(--nav-active)" : "transparent",
            }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold overflow-hidden"
              style={{
                background: gravatarOk
                  ? "none"
                  : isProfileActive
                    ? "linear-gradient(135deg, var(--accent-light), var(--accent))"
                    : "linear-gradient(135deg, color-mix(in srgb, var(--accent-light) 32%, transparent), color-mix(in srgb, var(--warning) 24%, transparent))",
                border: isProfileActive
                  ? "2px solid var(--accent-light)"
                  : "1px solid var(--border)",
                color: isProfileActive ? "#fff" : "var(--accent-dark)",
              }}
            >
              {gravatarOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gravatarUrl!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                initials || <AppIcon name="user" size={15} />
              )}
            </div>
            <span
              className="hidden text-[13px] md:inline"
              style={{
                fontWeight: isProfileActive ? 700 : 500,
                color: isProfileActive ? "var(--accent-light)" : "var(--text-3)",
              }}
            >
              Perfil
            </span>
          </button>

          <form action={signOut}>
            <button
              type="submit"
              title="Sair"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-border bg-card transition hover:border-danger/50 hover:text-danger"
              style={{ color: "var(--text-3)" }}
            >
              <AppIcon name="log-out" size={15} stroke="currentColor" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
