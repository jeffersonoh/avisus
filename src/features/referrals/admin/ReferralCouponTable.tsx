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
        className="flex flex-col items-start gap-4 rounded-[24px] border p-6 md:flex-row md:items-center md:justify-between"
        style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--card-shadow)" }}
      >
        <div>
          <h2 style={{ color: "var(--text-1)", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, margin: 0 }}>
            Nenhum cupom encontrado
          </h2>
          <p style={{ color: "var(--text-3)", fontSize: 14, margin: "6px 0 0" }}>
            Crie o primeiro cupom para começar a atribuir cadastros a parceiros.
          </p>
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
        <table className="min-w-[980px] w-full border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-3)" }}>
              <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Cupom</th>
              <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Parceiro</th>
              <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Comissão</th>
              <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Expiração</th>
              <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Cadastros</th>
              <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Conversões pagas</th>
              <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Valor comissionável</th>
              <th className="px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => {
              const expired = isExpired(coupon.expiresAt);
              const pending = pendingId === coupon.id;

              return (
                <tr key={coupon.id} style={{ borderBottom: "1px solid var(--border)" }}>
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
                  </td>
                  <td className="px-4 py-4 align-top font-mono text-sm font-bold" style={{ color: "var(--text-2)" }}>
                    {coupon.commissionRatePct}%
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-semibold" style={{ color: expired ? "var(--danger)" : "var(--text-2)" }}>
                      {formatDate(coupon.expiresAt)}
                    </div>
                    {expired ? <div className="text-xs" style={{ color: "var(--danger)" }}>Expirado</div> : null}
                  </td>
                  <td className="px-4 py-4 align-top font-mono text-sm font-bold" style={{ color: "var(--text-1)" }}>
                    {coupon.signupCount}
                  </td>
                  <td className="px-4 py-4 align-top font-mono text-sm font-bold" style={{ color: "var(--text-1)" }}>
                    {coupon.paidConversionCount}
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
                        className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-extrabold"
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
