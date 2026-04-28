import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
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

type FlowStepCheck =
  | { text: string }
  | { before: string; href: string; label: string; after?: string };

const STATUS_FILTERS: Array<{ label: string; value: ReferralCouponStatusFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Inativos", value: "inactive" },
];

const FLOW_STEPS: Array<{ title: string; description: string; checks?: FlowStepCheck[] }> = [
  {
    title: "Cadastrar o cupom",
    description:
      "Use “Criar cupom” para registrar um código único, vincular a um parceiro, definir a comissão (%) e, opcionalmente, uma data de expiração.",
  },
  {
    title: "Conferir no site antes de divulgar",
    description:
      "Antes de enviar o cupom ao parceiro, confira se a tela de cadastro reconhece o código sem prometer desconto ao usuário.",
    checks: [
      {
        before: "Acesse ",
        href: "https://avisus.app/registro",
        label: "https://avisus.app/registro",
        after: " em uma janela anônima e confirme que existe o campo Cupom de parceiro.",
      },
      { text: "Teste PARCEIRO_AVISUS, letras minúsculas, cadastro sem cupom e códigos inválidos como abc ou TESTE-2026." },
      { text: "Confirme que o campo é opcional, minúsculas viram maiúsculas e códigos inválidos mostram erro." },
      {
        before: "Acesse ",
        href: "https://avisus.app/registro?ref=PARCEIRO_AVISUS",
        label: "https://avisus.app/registro?ref=PARCEIRO_AVISUS",
        after:
          " e confira se o campo vem preenchido, com mensagem de reconhecimento, e se o navegador guardou o código do parceiro (avisus_referral_code).",
      },
      { text: "Se o campo não vier preenchido, atualize a página de cadastro. Se funcionar apenas depois dessa atualização, anote o comportamento para correção." },
    ],
  },
  {
    title: "Compartilhar com o parceiro",
    description:
      "O parceiro divulga o código aos contatos dele. Cada novo usuário que se registra usando o cupom é contabilizado como um “Cadastro” atribuído ao parceiro.",
  },
  {
    title: "Acompanhar conversões pagas",
    description:
      "Quando o usuário converte e paga a primeira fatura no Stripe, o cupom soma uma “Conversão paga” e o valor comissionável é calculado automaticamente conforme a % definida no cadastro.",
  },
  {
    title: "Conciliar e repassar a comissão",
    description:
      "Use “Exportar comissões CSV” para baixar todas as conversões pagas elegíveis. O CSV é a base para a conciliação financeira e o repasse ao parceiro.",
  },
  {
    title: "Manter ou pausar campanhas",
    description:
      "Edite os dados pelo botão “Editar” em cada linha. Para pausar temporariamente uma campanha sem perder o histórico, use o botão Ativar/Desativar — cupons inativos param de aceitar novos cadastros.",
  },
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

const inlineLinkStyle = {
  color: "var(--accent-light)",
  fontWeight: 800,
  textDecoration: "underline",
  textDecorationThickness: 1,
  textUnderlineOffset: 3,
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

      <details
        className="group rounded-[24px] border"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          boxShadow: "var(--card-shadow)",
          overflow: "hidden",
        }}
      >
        <summary
          className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4"
          style={{ listStyle: "none" }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "color-mix(in srgb, var(--accent-light) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent-light) 25%, var(--border))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AppIcon name="info" size={16} stroke="var(--accent-light)" />
            </div>
            <div>
              <div style={{ ...eyebrowStyle, marginBottom: 2 }}>Como funciona</div>
              <div style={{ color: "var(--text-1)", fontSize: 14, fontWeight: 800, fontFamily: "var(--font-display)" }}>
                Como criar, acompanhar e conferir cupons
              </div>
            </div>
          </div>
          <span
            aria-hidden
            className="transition-transform group-open:rotate-180"
            style={{ color: "var(--text-3)", display: "inline-flex" }}
          >
            <AppIcon name="chevronDown" size={18} stroke="currentColor" />
          </span>
        </summary>
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "20px 24px 24px",
            background: "color-mix(in srgb, var(--accent-light) 3%, var(--card))",
          }}
        >
          <ol
            style={{
              display: "grid",
              gap: 14,
              listStyle: "none",
              padding: 0,
              margin: 0,
              counterReset: "flow-step",
            }}
          >
            {FLOW_STEPS.map((step, idx) => (
              <li
                key={step.title}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {idx + 1}
                </div>
                <div>
                  <div
                    style={{
                      color: "var(--text-1)",
                      fontSize: 14,
                      fontWeight: 800,
                      marginBottom: 4,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      color: "var(--text-2)",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {step.description}
                  </div>
                  {step.checks ? (
                    <ul
                      style={{
                        margin: "10px 0 0",
                        paddingLeft: 18,
                        color: "var(--text-2)",
                        fontSize: 13,
                        lineHeight: 1.65,
                      }}
                    >
                      {step.checks.map((check) => (
                        <li key={"text" in check ? check.text : check.href} style={{ paddingLeft: 4, marginBottom: 6 }}>
                          {"text" in check ? (
                            check.text
                          ) : (
                            <>
                              {check.before}
                              <a
                                href={check.href}
                                target="_blank"
                                rel="noreferrer"
                                style={inlineLinkStyle}
                              >
                                {check.label}
                              </a>
                              {check.after}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              borderRadius: 12,
              background: "color-mix(in srgb, var(--info) 8%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--info) 20%, var(--border))",
              color: "var(--text-2)",
              fontSize: 12,
              lineHeight: 1.6,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <AppIcon name="info" size={14} stroke="var(--accent-light)" />
            <span>
              As comissões só são contabilizadas após o pagamento confirmado pelo Stripe. Cancelamentos
              ou reembolsos posteriores não geram débito automático — verifique no CSV antes de
              repassar.
            </span>
          </div>
        </div>
      </details>

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
