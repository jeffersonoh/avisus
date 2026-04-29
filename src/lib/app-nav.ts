/** Rotas principais do shell autenticado (mobile + desktop). */
export interface AppMainNavItem {
  href: string;
  label: string;
  shortLabel: string;
}

export const APP_MAIN_NAV: readonly AppMainNavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Início" },
  { href: "/interesses", label: "Interesses", shortLabel: "Interesses" },
  { href: "/alertas", label: "Alertas", shortLabel: "Alertas" },
  { href: "/favoritos", label: "Lives", shortLabel: "Lives" },
  { href: "/perfil", label: "Perfil", shortLabel: "Conta" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
