"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { APP_MAIN_NAV, isNavActive, type AppMainNavItem } from "@/lib/app-nav";

type MobileNavEntry =
  | { kind: "single"; item: AppMainNavItem }
  | { kind: "group"; key: string; label: string; menuLabel: string; items: readonly [AppMainNavItem, AppMainNavItem] };

function getNavItem(href: string): AppMainNavItem {
  const item = APP_MAIN_NAV.find((navItem) => navItem.href === href);
  if (!item) {
    throw new Error(`Navigation item not found: ${href}`);
  }
  return item;
}

const MOBILE_NAV: readonly MobileNavEntry[] = [
  { kind: "single", item: getNavItem("/dashboard") },
  { kind: "single", item: getNavItem("/interesses") },
  {
    kind: "group",
    key: "alerts-lives",
    label: "Avisos",
    menuLabel: "Alertas e Lives",
    items: [getNavItem("/alertas"), getNavItem("/favoritos")],
  },
  { kind: "single", item: getNavItem("/perfil") },
];

export function BottomNav() {
  const pathname = usePathname();
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);

  useEffect(() => {
    setOpenGroupKey(null);
  }, [pathname]);

  useEffect(() => {
    if (!openGroupKey) {
      return undefined;
    }

    function closeOpenMenu() {
      setOpenGroupKey(null);
    }

    window.addEventListener("scroll", closeOpenMenu, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", closeOpenMenu, { capture: true });
  }, [openGroupKey]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 overflow-x-hidden border-t border-border bg-card/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md md:hidden"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto grid w-full max-w-lg min-w-0 grid-cols-4 items-stretch overflow-x-hidden px-0.5">
        {MOBILE_NAV.map((entry) => {
          if (entry.kind === "group") {
            const groupActive = entry.items.some((item) => isNavActive(pathname, item.href));
            const open = openGroupKey === entry.key;
            return (
              <li key={entry.key} className="relative flex min-w-0 flex-1 justify-center">
                {open ? <BottomNavGroupMenu entry={entry} pathname={pathname} /> : null}
                <button
                  type="button"
                  aria-controls={`${entry.key}-menu`}
                  aria-expanded={open}
                  aria-haspopup="menu"
                  className={`flex min-w-0 w-full flex-col items-center gap-[2px] rounded-lg px-0.5 py-1.5 text-[10px] font-semibold leading-none transition ${
                    groupActive || open ? "text-accent" : "text-text-3 hover:text-text-2"
                  }`}
                  onClick={() => setOpenGroupKey(open ? null : entry.key)}
                >
                  <span
                    className={`mb-0.5 h-0.5 w-5 rounded-full ${groupActive || open ? "bg-accent" : "bg-transparent"}`}
                    aria-hidden
                  />
                  <IconBell className={groupActive || open ? "text-accent" : "text-text-3"} />
                  <span className="truncate">{entry.label}</span>
                </button>
              </li>
            );
          }

          const active = isNavActive(pathname, entry.item.href);
          return (
            <li key={entry.item.href} className="flex min-w-0 flex-1 justify-center">
              <BottomNavLink item={entry.item} active={active} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function BottomNavGroupMenu({
  entry,
  pathname,
}: {
  entry: Extract<MobileNavEntry, { kind: "group" }>;
  pathname: string;
}) {
  return (
    <div
      id={`${entry.key}-menu`}
      role="menu"
      aria-label={entry.menuLabel}
      className="absolute bottom-full left-1/2 mb-2 grid w-[min(8.75rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] -translate-x-1/2 gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-lg"
    >
      {entry.items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          role="menuitem"
          className={`flex min-w-0 items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold transition ${
            isNavActive(pathname, item.href) ? "bg-[var(--nav-active)] text-accent" : "text-text-2 hover:bg-[var(--nav-active)]"
          }`}
        >
          <NavGlyph href={item.href} active={isNavActive(pathname, item.href)} />
          <span className="truncate">{item.shortLabel}</span>
        </Link>
      ))}
    </div>
  );
}

function BottomNavLink({
  item,
  active,
}: {
  item: AppMainNavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`flex min-w-0 w-full flex-col items-center gap-[2px] rounded-lg px-0.5 py-1.5 text-[10px] font-semibold leading-none transition ${
        active ? "text-accent" : "text-text-3 hover:text-text-2"
      }`}
    >
      <span
        className={`mb-0.5 h-0.5 w-5 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
        aria-hidden
      />
      <BottomNavContent href={item.href} label={item.shortLabel} active={active} />
    </Link>
  );
}

function BottomNavContent({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  return (
    <>
      {pending ? (
        <span
          aria-hidden
          className={active ? "text-accent" : "text-text-3"}
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px solid color-mix(in srgb, currentColor 30%, transparent)",
            borderTopColor: "currentColor",
            animation: "navPendingSpin 0.7s linear infinite",
            display: "inline-block",
          }}
        />
      ) : (
        <NavGlyph href={href} active={active} />
      )}
      <span className="truncate">{pending ? "Processando…" : label}</span>
    </>
  );
}

function NavGlyph({ href, active }: { href: string; active: boolean }) {
  const cls = active ? "text-accent" : "text-text-3";
  switch (href) {
    case "/dashboard":
      return <IconHome className={cls} />;
    case "/interesses":
      return <IconSearch className={cls} />;
    case "/alertas":
      return <IconBell className={cls} />;
    case "/favoritos":
      return <IconVideo className={cls} />;
    case "/perfil":
      return <IconUser className={cls} />;
    default:
      return null;
  }
}

function IconHome({ className }: { className: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function IconSearch({ className }: { className: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconBell({ className }: { className: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconVideo({ className }: { className: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="7" width="13" height="10" rx="2" />
      <path d="m21 9-5 3 5 3V9z" />
    </svg>
  );
}

function IconUser({ className }: { className: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
