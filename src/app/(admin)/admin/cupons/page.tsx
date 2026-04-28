import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import { StatCard } from "@/components/StatCard";
import {
  listReferralCoupons,
  toggleReferralCouponAction,
  type ReferralCouponListItem,
} from "@/features/referrals/actions";
import { formatReferralCurrency } from "@/features/referrals/admin/formatters";
import { ReferralCouponTable } from "@/features/referrals/admin/ReferralCouponTable";
import type { ReferralCouponStatusFilter } from "@/features/referrals/schemas";
import { requireAdmin } from "@/lib/auth/admin";

type AdminCouponsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_FILTERS: Array<{ label: string; value: ReferralCouponStatusFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Inativos", value: "inactive" },
];

async function toggleCoupon(id: string, isActive: boolean) {
  "use server";

  return toggleReferralCouponAction(id, isActive);
}

function parseStatusFilter(raw: string | string[] | undefined): ReferralCouponStatusFilter {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function getTotals(coupons: ReferralCouponListItem[]) {
  return coupons.reduce(
    (totals, coupon) => ({
      signupCount: totals.signupCount + coupon.signupCount,
      paidConversionCount: totals.paidConversionCount + coupon.paidConversionCount,
      commissionAmount: totals.commissionAmount + coupon.commissionAmount,
    }),
    { signupCount: 0, paidConversionCount: 0, commissionAmount: 0 },
  );
}

export default async function AdminCouponsPage({ searchParams }: AdminCouponsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const status = parseStatusFilter(params.status);
  const result = await listReferralCoupons({ status, limit: 50 });
  const coupons = result.ok ? result.items : [];
  const totals = getTotals(coupons);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div style={{ color: "var(--accent-light)", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Cupons de referência
          </div>
          <h1 style={{ color: "var(--text-1)", fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, margin: "6px 0 0" }}>
            Gestão de cupons
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.6, margin: "8px 0 0" }}>
            Operação administrativa de parceiros, status, comissão e conversões pagas.
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard label="Cadastros" value={totals.signupCount} sub="Registros atribuídos" iconName="user" progress={Math.max(8, Math.min(100, totals.signupCount * 8))} />
        <StatCard label="Conversões pagas" value={totals.paidConversionCount} sub="Primeiros pagamentos" iconName="check" progress={Math.max(8, Math.min(100, totals.paidConversionCount * 12))} />
        <StatCard label="Valor comissionável" value={formatReferralCurrency(totals.commissionAmount)} sub="Comissão estimada" iconName="percent" progress={Math.max(8, Math.min(100, totals.commissionAmount / 10))} />
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filtros de status">
        {STATUS_FILTERS.map((filter) => {
          const active = filter.value === status;
          const href = filter.value === "all" ? "/admin/cupons" : `/admin/cupons?status=${filter.value}`;

          return (
            <Link
              key={filter.value}
              href={href}
              className="rounded-xl border px-4 py-2 text-sm font-extrabold"
              style={{
                background: active ? "var(--nav-active)" : "var(--card)",
                borderColor: active ? "color-mix(in srgb, var(--accent-light) 35%, var(--border))" : "var(--border)",
                color: active ? "var(--accent-light)" : "var(--text-2)",
                textDecoration: "none",
              }}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {!result.ok ? (
        <div
          role="alert"
          className="rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{
            background: "color-mix(in srgb, var(--danger) 8%, var(--card))",
            borderColor: "color-mix(in srgb, var(--danger) 30%, var(--border))",
            color: "var(--danger)",
          }}
        >
          {result.error}
        </div>
      ) : null}

      <ReferralCouponTable coupons={coupons} toggleAction={toggleCoupon} />
    </div>
  );
}
