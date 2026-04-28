import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <section
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 24,
        boxShadow: "var(--card-shadow)",
        padding: "28px 24px",
      }}
    >
      <div
        style={{
          color: "var(--accent-light)",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.08em",
          marginBottom: 8,
          textTransform: "uppercase" as const,
        }}
      >
        Base administrativa
      </div>
      <h2
        style={{
          color: "var(--text-1)",
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 800,
          margin: "0 0 8px",
        }}
      >
        Gestão de cupons de referência
      </h2>
      <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.6, margin: "0 0 18px" }}>
        A área de cupons será usada para administrar parceiros, códigos e atribuições comerciais sem expor dados administrativos ao app cliente.
      </p>
      <Link
        href="/admin/cupons"
        style={{
          alignItems: "center",
          background: "var(--accent)",
          borderRadius: 12,
          color: "#fff",
          display: "inline-flex",
          fontSize: 14,
          fontWeight: 800,
          gap: 8,
          padding: "11px 14px",
          textDecoration: "none",
        }}
      >
        <AppIcon name="tag" size={15} stroke="currentColor" />
        Acessar cupons
      </Link>
    </section>
  );
}
