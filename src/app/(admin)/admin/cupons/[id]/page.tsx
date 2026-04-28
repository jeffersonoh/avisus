import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import { StatCard } from "@/components/StatCard";
import {
  getReferralCouponDetails,
  updateReferralCouponAction,
  type ReferralCouponConversionItem,
} from "@/features/referrals/actions";
import { ReferralCouponForm } from "@/features/referrals/admin/ReferralCouponForm";
import { formatReferralCurrency } from "@/features/referrals/admin/formatters";
import type { ReferralCouponAdminInput } from "@/features/referrals/schemas";
import { requireAdmin } from "@/lib/auth/admin";

type EditReferralCouponPageProps = {
  params: Promise<{ id: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function formatDate(value: string | null): string {
  if (!value) {
    return "Sem registro";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data inválida" : dateFormatter.format(date);
}

function ConversionList({ conversions }: { conversions: ReferralCouponConversionItem[] }) {
  if (conversions.length === 0) {
    return (
      <div
        className="rounded-[20px] border p-5 text-sm"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text-3)" }}
      >
        Ainda não há cadastros atribuídos a este cupom.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[20px] border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <table className="min-w-[720px] w-full border-collapse text-left">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-3)" }}>
            <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Usuário</th>
            <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Plano</th>
            <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Cadastro</th>
            <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Primeiro pagamento</th>
            <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest">Comissão</th>
          </tr>
        </thead>
        <tbody>
          {conversions.map((conversion) => (
            <tr key={conversion.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-2)" }}>{conversion.userId}</td>
              <td className="px-4 py-3 text-sm font-bold uppercase" style={{ color: "var(--text-1)" }}>{conversion.planSelected}</td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--text-2)" }}>{formatDate(conversion.signupDate)}</td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--text-2)" }}>{formatDate(conversion.firstPaidDate)}</td>
              <td className="px-4 py-3 font-mono text-sm font-extrabold" style={{ color: "var(--accent-light)" }}>
                {formatReferralCurrency(conversion.commissionAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function EditReferralCouponPage({ params }: EditReferralCouponPageProps) {
  await requireAdmin();

  const { id } = await params;
  const result = await getReferralCouponDetails(id);

  if (!result.ok) {
    return (
      <div
        role="alert"
        className="rounded-[24px] border p-6"
        style={{
          background: "color-mix(in srgb, var(--danger) 8%, var(--card))",
          borderColor: "color-mix(in srgb, var(--danger) 30%, var(--border))",
          color: "var(--danger)",
        }}
      >
        {result.error}
      </div>
    );
  }

  const coupon = result.coupon;

  async function updateCoupon(input: ReferralCouponAdminInput) {
    "use server";

    return updateReferralCouponAction(id, input);
  }

  return (
    <div className="space-y-5">
      <Link
        href="/admin/cupons"
        className="inline-flex items-center gap-2 text-sm font-bold"
        style={{ color: "var(--text-3)", textDecoration: "none" }}
      >
        <AppIcon name="arrow-left" size={14} stroke="currentColor" />
        Voltar para cupons
      </Link>

      <div>
        <div style={{ color: "var(--accent-light)", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Detalhe do cupom
        </div>
        <h1 style={{ color: "var(--text-1)", fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, margin: "6px 0 0" }}>
          {coupon.code}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard label="Cadastros" value={coupon.signupCount} sub="Registros atribuídos" iconName="user" progress={Math.max(8, Math.min(100, coupon.signupCount * 8))} />
        <StatCard label="Conversões pagas" value={coupon.paidConversionCount} sub="Primeiros pagamentos" iconName="check" progress={Math.max(8, Math.min(100, coupon.paidConversionCount * 12))} />
        <StatCard label="Valor comissionável" value={formatReferralCurrency(coupon.commissionAmount)} sub="Comissão estimada" iconName="percent" progress={Math.max(8, Math.min(100, coupon.commissionAmount / 10))} />
      </div>

      <ReferralCouponForm mode="edit" coupon={coupon} submitAction={updateCoupon} />

      <section className="space-y-3" aria-label="Histórico de conversões">
        <h2 style={{ color: "var(--text-1)", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, margin: 0 }}>
          Histórico de conversões
        </h2>
        <ConversionList conversions={coupon.conversions} />
      </section>
    </div>
  );
}
