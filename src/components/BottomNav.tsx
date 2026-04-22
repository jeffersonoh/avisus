"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { APP_MAIN_NAV, isNavActive } from "@/lib/app-nav";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md md:hidden"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {APP_MAIN_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href} className="flex min-w-0 flex-1 justify-center">
              <Link
                href={item.href}
                className={`flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-xs font-medium transition ${
                  active ? "text-accent" : "text-text-3 hover:text-text-2"
                }`}
              >
                <span
                  className={`mb-0.5 h-0.5 w-6 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
                  aria-hidden
                />
                <BottomNavContent href={item.href} label={item.shortLabel} active={active} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
            width: 22,
            height: 22,
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
      return <IconHeart className={cls} />;
    case "/perfil":
      return <IconUser className={cls} />;
    default:
      return null;
  }
}

function IconHome({ className }: { className: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function IconSearch({ className }: { className: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconBell({ className }: { className: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconHeart({ className }: { className: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconUser({ className }: { className: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
