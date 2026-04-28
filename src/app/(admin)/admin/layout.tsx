import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import { requireAdmin } from "@/lib/auth/admin";

const ADMIN_NAV = [{ href: "/admin/cupons", label: "Cupons", icon: "tag" as const }];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>
      <header
        className="border-b"
        style={{
          background: "var(--glass)",
          borderColor: "var(--border)",
          backdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <Link
              href="/dashboard"
              style={{
                color: "var(--text-3)",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Voltar ao produto
            </Link>
            <h1
              style={{
                color: "var(--text-1)",
                fontFamily: "var(--font-display)",
                fontSize: 24,
                fontWeight: 800,
                margin: "6px 0 0",
              }}
            >
              Administração da Plataforma
            </h1>
          </div>

          <nav aria-label="Administração" className="flex flex-wrap gap-2">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  alignItems: "center",
                  background: "var(--nav-active)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--accent-light)",
                  display: "inline-flex",
                  fontSize: 13,
                  fontWeight: 800,
                  gap: 6,
                  padding: "9px 12px",
                  textDecoration: "none",
                }}
              >
                <AppIcon name={item.icon} size={14} stroke="var(--accent-light)" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
