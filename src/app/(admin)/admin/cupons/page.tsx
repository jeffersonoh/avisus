import Link from "next/link";

import { StatCard } from "@/components/StatCard";
import {
  listReferralCoupons,
  toggleReferralCouponAction,
  type ReferralCouponListItem,
} from "@/features/referrals/actions";
import { formatReferralCurrency } from "@/features/referrals/admin/formatters";
import { LinkLeadingGlyph } from "@/features/referrals/admin/LinkLeadingGlyph";
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

const eyebrowStyle = {
  color: "var(--accent-light)",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const titleStyle = {
  color: "var(--text-1)",
  fontFamily: "var(--font-display)",
  fontSize: 28,
  fontWeight: 800,
  margin: "6px 0 0",
};

const subtitleStyle = {
  color: "var(--text-3)",
  fontSize: 14,
  lineHeight: 1.6,
  margin: "8px 0 0",
};

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
      activeCount: totals.activeCount + (coupon.isActive ? 1 : 0),
    }),
    { signupCount: 0, paidConversionCount: 0, commissionAmount: 0, activeCount: 0 },
  );
}

export default async function AdminCouponsPage({ searchParams }: AdminCouponsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const status = parseStatusFilter(params.status);
  const result = await listReferralCoupons({ status, limit: 50 });
  const coupons = result.ok ? result.items : [];
  const totals = getTotals(coupons);

  const conversionRate =
    totals.signupCount > 0 ? (totals.paidConversionCount / totals.signupCount) * 100 : 0;
  const averageTicket =
    totals.paidConversionCount > 0 ? totals.commissionAmount / totals.paidConversionCount : 0;
  const activeShare =
    coupons.length > 0 ? (totals.activeCount / coupons.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div style={eyebrowStyle}>Cupons de referência</div>
          <h1 style={titleStyle}>Gestão de cupons</h1>
          <p style={subtitleStyle}>
            Operação administrativa de parceiros, status, comissão e conversões pagas.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Link
            href="/admin/api/export/commissions?status=paid"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold md:w-auto"
            style={{ borderColor: "var(--border)", color: "var(--text-2)", textDecoration: "none" }}
          >
            <LinkLeadingGlyph iconName="arrowUpRight" />
            Exportar comissões CSV
          </Link>
          <Link
            href="/admin/cupons/novo"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold md:w-auto"
            style={{ background: "var(--accent)", color: "#fff", textDecoration: "none" }}
          >
            <LinkLeadingGlyph iconName="plus" />
            Criar cupom
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cupons"
          value={coupons.length}
          sub={
            coupons.length > 0
              ? `${totals.activeCount} ${totals.activeCount === 1 ? "ativo" : "ativos"}`
              : "Nenhum criado"
          }
          iconName="tag"
          progress={Math.max(8, activeShare)}
        />
        <StatCard
          label="Cadastros"
          value={totals.signupCount}
          sub="Registros atribuídos"
          iconName="user"
        />
        <StatCard
          label="Conversões pagas"
          value={totals.paidConversionCount}
          sub={
            totals.signupCount > 0
              ? `${conversionRate.toFixed(0)}% de conversão`
              : "Aguardando cadastros"
          }
          iconName="check"
          progress={Math.max(8, conversionRate)}
          progressClassName="bg-success"
        />
        <StatCard
          label="Valor comissionável"
          value={formatReferralCurrency(totals.commissionAmount)}
          sub={
            averageTicket > 0
              ? `Ticket médio ${formatReferralCurrency(averageTicket)}`
              : "Comissão estimada"
          }
          iconName="percent"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" aria-label="Filtros de status">
          {STATUS_FILTERS.map((filter) => {
            const active = filter.value === status;
            const href = filter.value === "all" ? "/admin/cupons" : `/admin/cupons?status=${filter.value}`;

            return (
              <Link
                key={filter.value}
                href={href}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-extrabold"
                style={{
                  background: active ? "var(--nav-active)" : "var(--card)",
                  borderColor: active ? "color-mix(in srgb, var(--accent-light) 35%, var(--border))" : "var(--border)",
                  color: active ? "var(--accent-light)" : "var(--text-2)",
                  textDecoration: "none",
                }}
              >
                <LinkLeadingGlyph size={12} />
                {filter.label}
              </Link>
            );
          })}
        </div>
        <div
          aria-live="polite"
          style={{
            color: "var(--text-3)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {coupons.length} {coupons.length === 1 ? "cupom" : "cupons"}
        </div>
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
