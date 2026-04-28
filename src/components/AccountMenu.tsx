"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { AppIcon } from "@/components/AppIcon";
import { signOut } from "@/lib/auth/sign-out";
import { isNavActive } from "@/lib/app-nav";
import { useGravatar } from "@/lib/gravatar";
import type { Plan } from "@/lib/plan-limits";

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

type AccountMenuProps = {
  plan: Plan;
  userLabel: string;
  userEmail?: string;
  isAdmin?: boolean;
};

type MenuItem = {
  href: string;
  label: string;
  icon: "user" | "percent" | "sparkles" | "zap" | "crown" | "tag";
  description?: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function AccountMenu({ plan, userLabel, userEmail = "", isAdmin = false }: AccountMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [navPending, startNavTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const planColor = PLAN_COLOR[plan];
  const planLabel = PLAN_LABEL[plan];
  const isProfileActive = isNavActive(pathname, "/perfil");
  const initials = getInitials(userLabel);

  const gravatarUrl = useGravatar(userEmail, 64);
  const [gravatarOk, setGravatarOk] = useState(false);
  useEffect(() => {
    if (!gravatarUrl) {
      setGravatarOk(false);
      return;
    }
    setGravatarOk(false);
    const img = new Image();
    img.onload = () => setGravatarOk(true);
    img.onerror = () => setGravatarOk(false);
    img.src = gravatarUrl;
  }, [gravatarUrl]);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      startNavTransition(() => router.push(href));
    },
    [router],
  );

  const shortcuts: MenuItem[] = [
    { href: "/perfil", label: "Meu perfil", icon: "user", description: "Dados pessoais e canais" },
    {
      href: "/perfil/margem",
      label: "Margem de revenda",
      icon: "percent",
      description: "Simulação e taxas por marketplace",
    },
    {
      href: "/planos",
      label: plan === "pro" ? "Gerenciar plano" : "Fazer upgrade",
      icon: plan === "pro" ? "crown" : plan === "starter" ? "zap" : "sparkles",
      description: `Plano atual: ${planLabel}`,
    },
    ...(isAdmin
      ? [
          {
            href: "/admin/cupons",
            label: "Cupons",
            icon: "tag" as const,
            description: "Área administrativa de cupons",
          },
        ]
      : []),
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-[7px] rounded-full transition"
        style={{
          padding: "4px 10px 4px 4px",
          background: isProfileActive || open ? "var(--nav-active)" : "transparent",
          cursor: "pointer",
          border: "none",
        }}
        title="Conta"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold overflow-hidden"
          style={{
            background: gravatarOk
              ? "none"
              : isProfileActive || open
                ? "linear-gradient(135deg, var(--accent-light), var(--accent))"
                : "linear-gradient(135deg, color-mix(in srgb, var(--accent-light) 32%, transparent), color-mix(in srgb, var(--warning) 24%, transparent))",
            border:
              isProfileActive || open
                ? "2px solid var(--accent-light)"
                : "1px solid var(--border)",
            color: isProfileActive || open ? "#fff" : "var(--accent-dark)",
          }}
        >
          {navPending ? (
            <span
              aria-hidden
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid color-mix(in srgb, var(--accent-light) 30%, transparent)",
                borderTopColor: "var(--accent-light)",
                animation: "navPendingSpin 0.7s linear infinite",
                display: "inline-block",
              }}
            />
          ) : gravatarOk && gravatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gravatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            initials || <AppIcon name="user" size={15} />
          )}
        </div>
        <span
          className="hidden text-[13px] md:inline"
          style={{
            fontWeight: isProfileActive || open || navPending ? 700 : 500,
            color:
              isProfileActive || open || navPending ? "var(--accent-light)" : "var(--text-3)",
          }}
        >
          {navPending ? "Processando…" : "Conta"}
        </span>
        <AppIcon
          name="chevronDown"
          size={12}
          stroke={isProfileActive || open ? "var(--accent-light)" : "var(--text-3)"}
          className="hidden md:inline"
          style={{
            transition: "transform 0.18s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          id={menuId}
          ref={panelRef}
          role="menu"
          aria-label="Menu da conta"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 288,
            background: "var(--card)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            boxShadow:
              "0 16px 48px color-mix(in srgb, var(--text-1) 16%, transparent), 0 4px 12px color-mix(in srgb, var(--text-1) 8%, transparent)",
            overflow: "hidden",
            zIndex: 60,
            animation: "accountMenuIn 0.14s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent-light) 10%, var(--card)), color-mix(in srgb, var(--warning) 6%, var(--card)))",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: gravatarOk
                  ? "none"
                  : "linear-gradient(135deg, var(--accent-light), var(--accent))",
                border: "1.5px solid var(--accent-light)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {gravatarOk && gravatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gravatarUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                initials || <AppIcon name="user" size={18} stroke="#fff" />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-1)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={userLabel}
              >
                {userLabel || "Conta"}
              </div>
              {userEmail && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: 2,
                  }}
                  title={userEmail}
                >
                  {userEmail}
                </div>
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  marginTop: 6,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: `color-mix(in srgb, ${planColor} 14%, var(--card))`,
                  border: `1px solid color-mix(in srgb, ${planColor} 30%, var(--border))`,
                  color: planColor,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                }}
              >
                {planLabel}
              </span>
            </div>
          </div>

          {/* Items */}
          <div style={{ padding: 6 }}>
            {shortcuts.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <button
                  key={item.href}
                  type="button"
                  role="menuitem"
                  onClick={() => navigateTo(item.href)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: active ? "var(--nav-active)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-body)",
                    transition: "background 0.14s ease",
                  }}
                  onMouseEnter={(event) => {
                    if (!active) {
                      event.currentTarget.style.background =
                        "color-mix(in srgb, var(--accent-light) 6%, transparent)";
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!active) {
                      event.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: active
                        ? "color-mix(in srgb, var(--accent-light) 18%, var(--card))"
                        : "var(--margin-block-bg)",
                      flexShrink: 0,
                    }}
                  >
                    <AppIcon
                      name={item.icon}
                      size={15}
                      stroke={active ? "var(--accent-light)" : "var(--text-2)"}
                    />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: active ? "var(--accent-light)" : "var(--text-1)",
                      }}
                    >
                      {item.label}
                    </span>
                    {item.description && (
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          color: "var(--text-3)",
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.description}
                      </span>
                    )}
                  </span>
                  <AppIcon name="chevron-right" size={14} stroke="var(--text-3)" />
                </button>
              );
            })}
          </div>

          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "2px 12px",
            }}
          />

          {/* Sign out */}
          <form action={signOut} style={{ padding: 6 }}>
            <button
              type="submit"
              role="menuitem"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-body)",
                color: "var(--text-2)",
                transition: "background 0.14s ease, color 0.14s ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background =
                  "color-mix(in srgb, var(--danger) 10%, transparent)";
                event.currentTarget.style.color = "var(--danger)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "transparent";
                event.currentTarget.style.color = "var(--text-2)";
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--margin-block-bg)",
                  flexShrink: 0,
                }}
              >
                <AppIcon name="log-out" size={15} stroke="currentColor" />
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Sair da conta
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
