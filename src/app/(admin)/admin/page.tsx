import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      }}
    >
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
          A área de cupons é usada para administrar parceiros, códigos e atribuições comerciais.
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

      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          boxShadow: "var(--card-shadow)",
          opacity: 0.82,
          padding: "28px 24px",
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: "var(--text-3)",
            display: "flex",
            fontSize: 11,
            fontWeight: 800,
            justifyContent: "space-between",
            letterSpacing: "0.08em",
            marginBottom: 8,
            textTransform: "uppercase" as const,
          }}
        >
          <span>Próxima seção</span>
          <span
            style={{
              background: "var(--nav-active)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              color: "var(--accent-light)",
              letterSpacing: 0,
              padding: "4px 8px",
              textTransform: "none" as const,
            }}
          >
            Em breve
          </span>
        </div>
        <h2
          style={{
            alignItems: "center",
            color: "var(--text-1)",
            display: "flex",
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 800,
            gap: 8,
            margin: "0 0 8px",
          }}
        >
          <AppIcon name="user" size={20} stroke="var(--accent-light)" />
          Administração de usuários
        </h2>
        <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.6, margin: "0 0 18px" }}>
          Em uma próxima versão, esta área centralizará permissões, acessos administrativos e visão de usuários da plataforma.
        </p>
        <span
          aria-disabled="true"
          style={{
            alignItems: "center",
            background: "transparent",
            border: "1px dashed var(--border)",
            borderRadius: 12,
            color: "var(--text-3)",
            display: "inline-flex",
            fontSize: 14,
            fontWeight: 800,
            gap: 8,
            padding: "11px 14px",
          }}
        >
          <AppIcon name="clock" size={15} stroke="currentColor" />
          Aguardando implementação
        </span>
      </section>
    </div>
  );
}
