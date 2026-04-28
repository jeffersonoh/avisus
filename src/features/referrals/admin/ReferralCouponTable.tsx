"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { Badge } from "@/components/Badge";
import type { ReferralActionResult, ReferralCouponListItem } from "@/features/referrals/actions";

import { formatReferralCurrency } from "./formatters";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export type ToggleReferralCouponAction = (
  id: string,
  isActive: boolean,
) => Promise<ReferralActionResult>;

type ReferralCouponTableProps = {
  coupons: ReferralCouponListItem[];
  toggleAction: ToggleReferralCouponAction;
};

const headCellStyle = {
  color: "var(--text-3)",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Sem expiração";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return dateFormatter.format(date);
}

function isExpired(value: string | null): boolean {
  return value ? new Date(value).getTime() < Date.now() : false;
}

export function ReferralCouponTable({ coupons, toggleAction }: ReferralCouponTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(coupon: ReferralCouponListItem) {
    setError(null);
    setPendingId(coupon.id);

    const result = await toggleAction(coupon.id, !coupon.isActive);

    setPendingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  if (coupons.length === 0) {
    return (
      <div
        style={{
          background: "var(--card)",
          borderRadius: 24,
          border: "1px solid color-mix(in srgb, var(--accent-light) 20%, var(--border))",
          boxShadow: "var(--card-shadow)",
          overflow: "hidden",
          animation: "cardIn 0.35s ease both",
        }}
      >
        <div style={{ height: 5, background: "var(--accent-light)" }} />
        <div className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "color-mix(in srgb, var(--accent-light) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent-light) 30%, var(--border))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AppIcon name="tag" size={20} stroke="var(--accent-light)" />
            </div>
            <div>
              <h2 style={{ color: "var(--text-1)", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, margin: 0 }}>
                Nenhum cupom encontrado
              </h2>
              <p style={{ color: "var(--text-3)", fontSize: 14, margin: "6px 0 0", lineHeight: 1.6 }}>
                Crie o primeiro cupom para começar a atribuir cadastros a parceiros.
              </p>
            </div>
          </div>
          <Link
            href="/admin/cupons/novo"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold md:w-auto"
            style={{ background: "var(--accent)", color: "#fff", textDecoration: "none" }}
          >
            <AppIcon name="plus" size={15} stroke="currentColor" />
            Criar cupom
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3" aria-label="Lista de cupons">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{
            background: "color-mix(in srgb, var(--danger) 8%, var(--card))",
            borderColor: "color-mix(in srgb, var(--danger) 30%, var(--border))",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        className="overflow-x-auto rounded-[24px] border"
        style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--card-shadow)" }}
      >
        <table className="w-full min-w-[640px] border-collapse text-left md:min-w-[980px]">
          <thead>
            <tr
              style={{
                background: "color-mix(in srgb, var(--margin-block-bg) 60%, transparent)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <th className="px-4 py-3" style={headCellStyle}>Cupom</th>
              <th className="px-4 py-3" style={headCellStyle}>Parceiro</th>
              <th className="hidden px-4 py-3 lg:table-cell" style={headCellStyle}>Comissão</th>
              <th className="hidden px-4 py-3 lg:table-cell" style={headCellStyle}>Expiração</th>
              <th className="hidden px-4 py-3 md:table-cell" style={headCellStyle}>Cadastros</th>
              <th className="hidden px-4 py-3 md:table-cell" style={headCellStyle}>Conversões pagas</th>
              <th className="px-4 py-3" style={headCellStyle}>Valor comissionável</th>
              <th className="px-4 py-3 text-right" style={headCellStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon, idx) => {
              const expired = isExpired(coupon.expiresAt);
              const pending = pendingId === coupon.id;
              const conversionRate =
                coupon.signupCount > 0
                  ? Math.round((coupon.paidConversionCount / coupon.signupCount) * 100)
                  : null;

              return (
                <tr
                  key={coupon.id}
                  className="transition-colors hover:bg-[color-mix(in_srgb,var(--accent-light)_5%,transparent)]"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    animation: "cardIn 0.35s ease both",
                    animationDelay: `${Math.min(idx, 8) * 35}ms`,
                  }}
                >
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-sm font-extrabold" style={{ color: "var(--text-1)" }}>
                        {coupon.code}
                      </span>
                      <Badge variant={coupon.isActive ? "success" : "danger"}>
                        {coupon.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{coupon.partnerName}</div>
                    <div className="text-xs" style={{ color: "var(--text-3)" }}>{coupon.partnerEmail ?? "E-mail não informado"}</div>
                    <div
                      className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs md:hidden"
                      style={{ color: "var(--text-3)" }}
                    >
                      <span>
                        <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{coupon.signupCount}</span> cad.
                      </span>
                      <span>
                        <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{coupon.paidConversionCount}</span> conv.
                      </span>
                      <span>{coupon.commissionRatePct}%</span>
                      {expired ? (
                        <span style={{ color: "var(--danger)", fontWeight: 700 }}>Expirado</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 align-top lg:table-cell">
                    <span
                      className="inline-flex items-center rounded-lg px-2 py-1 font-mono text-xs font-extrabold"
                      style={{
                        background: "color-mix(in srgb, var(--accent-light) 10%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--accent-light) 25%, var(--border))",
                        color: "var(--accent-light)",
                      }}
                    >
                      {coupon.commissionRatePct}%
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 align-top lg:table-cell">
                    <div className="text-sm font-semibold" style={{ color: expired ? "var(--danger)" : "var(--text-2)" }}>
                      {formatDate(coupon.expiresAt)}
                    </div>
                    {expired ? <div className="text-xs font-bold" style={{ color: "var(--danger)" }}>Expirado</div> : null}
                  </td>
                  <td className="hidden px-4 py-4 align-top font-mono text-sm font-bold md:table-cell" style={{ color: "var(--text-1)" }}>
                    {coupon.signupCount}
                  </td>
                  <td className="hidden px-4 py-4 align-top md:table-cell">
                    <div className="font-mono text-sm font-bold" style={{ color: "var(--text-1)" }}>
                      {coupon.paidConversionCount}
                    </div>
                    {conversionRate !== null ? (
                      <div className="text-xs" style={{ color: "var(--text-3)" }}>{conversionRate}% conv.</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top font-mono text-sm font-extrabold" style={{ color: "var(--accent-light)" }}>
                    {formatReferralCurrency(coupon.commissionAmount)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/cupons/${coupon.id}`}
                        className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-extrabold"
                        style={{ borderColor: "var(--border)", color: "var(--text-2)", textDecoration: "none" }}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleToggle(coupon)}
                        disabled={pending}
                        className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-extrabold transition-colors"
                        style={{
                          background: coupon.isActive
                            ? "color-mix(in srgb, var(--danger) 8%, transparent)"
                            : "color-mix(in srgb, var(--success) 10%, transparent)",
                          borderColor: coupon.isActive
                            ? "color-mix(in srgb, var(--danger) 30%, var(--border))"
                            : "color-mix(in srgb, var(--success) 30%, var(--border))",
                          color: coupon.isActive ? "var(--danger)" : "var(--success)",
                          cursor: pending ? "not-allowed" : "pointer",
                          opacity: pending ? 0.65 : 1,
                        }}
                      >
                        {pending ? "Atualizando..." : coupon.isActive ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
