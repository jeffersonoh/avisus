"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { AppIcon } from "@/components/AppIcon";
import { useUnreadAlertsCount } from "@/features/notifications/UnreadAlertsProvider";
import { isNavActive } from "@/lib/app-nav";
import type { Plan } from "@/lib/plan-limits";

import { AccountMenu } from "./AccountMenu";
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

type NavIconName = (typeof DESKTOP_NAV)[number]["icon"];

function NavLinkContent({
  icon,
  label,
  active,
}: {
  icon: NavIconName;
  label: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  const color = active ? "var(--accent-light)" : "var(--text-3)";
  return (
    <>
      {pending ? (
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: `2px solid color-mix(in srgb, ${color} 30%, transparent)`,
            borderTopColor: color,
            animation: "navPendingSpin 0.7s linear infinite",
            display: "inline-block",
          }}
        />
      ) : (
        <AppIcon name={icon} size={14} stroke={color} />
      )}
      <span>{pending ? "Processando…" : label}</span>
    </>
  );
}

export function AppHeader({ plan, userLabel, userEmail = "" }: AppHeaderProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const planColor = PLAN_COLOR[plan];
  const planLabel = PLAN_LABEL[plan];

  const unreadAlerts = useUnreadAlertsCount();

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
              const showBadge = item.href === "/alertas" && unreadAlerts > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className="flex items-center gap-[5px] rounded-[10px] px-3.5 py-[7px] text-[13px] font-medium transition"
                  style={{
                    background: active ? "var(--nav-active)" : "transparent",
                    color: active ? "var(--accent-light)" : "var(--text-3)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <NavLinkContent icon={item.icon} label={item.label} active={active} />
                  {showBadge && (
                    <span
                      aria-label={`${unreadAlerts} alerta${unreadAlerts !== 1 ? "s" : ""} não lido${unreadAlerts !== 1 ? "s" : ""}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 18,
                        height: 18,
                        padding: "0 6px",
                        borderRadius: 9,
                        background: "var(--danger)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 800,
                        lineHeight: 1,
                        marginLeft: 2,
                      }}
                    >
                      {unreadAlerts > 99 ? "99+" : unreadAlerts}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: plan badge + theme toggle + profile + logout */}
        <div className="flex shrink-0 items-center gap-2.5">
          {plan === "pro" ? (
            <Link
              href="/planos"
              aria-label="Gerenciar plano PRO"
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
                textDecoration: "none",
              }}
            >
              {planLabel}
            </Link>
          ) : (
            <Link
              href="/planos"
              aria-label={`Fazer upgrade — plano atual: ${planLabel}`}
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
              Upgrade <AppIcon name="arrowUpRight" size={10} stroke={planColor} />
            </Link>
          )}

          <ThemeToggle />

          <AccountMenu plan={plan} userLabel={userLabel} userEmail={userEmail} />
        </div>
      </div>
    </header>
  );
}
