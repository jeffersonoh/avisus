"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import type { ReferralActionResult, ReferralCouponDetail } from "@/features/referrals/actions";
import { referralCouponAdminSchema, type ReferralCouponAdminInput } from "@/features/referrals/schemas";

export type SubmitReferralCouponAction = (input: ReferralCouponAdminInput) => Promise<ReferralActionResult>;

type ReferralCouponFormProps = {
  mode: "create" | "edit";
  coupon?: ReferralCouponDetail;
  submitAction: SubmitReferralCouponAction;
  successRedirectPath?: string;
};

type FormState = {
  code: string;
  partnerName: string;
  partnerEmail: string;
  commissionRatePct: string;
  expiresAt: string;
  isActive: boolean;
  notes: string;
};

const inputStyle = {
  background: "var(--margin-block-bg)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxSizing: "border-box" as const,
  color: "var(--text-1)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  outline: "none",
  padding: "12px 14px",
  width: "100%",
};

const labelStyle = {
  color: "var(--text-3)",
  display: "block",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.06em",
  marginBottom: 6,
  textTransform: "uppercase" as const,
};

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toInitialState(coupon?: ReferralCouponDetail): FormState {
  return {
    code: coupon?.code ?? "",
    partnerName: coupon?.partnerName ?? "",
    partnerEmail: coupon?.partnerEmail ?? "",
    commissionRatePct: coupon ? String(coupon.commissionRatePct) : "10",
    expiresAt: toDatetimeLocal(coupon?.expiresAt),
    isActive: coupon?.isActive ?? true,
    notes: coupon?.notes ?? "",
  };
}

function mapFormStateToInput(form: FormState): ReferralCouponAdminInput | { error: string } {
  const commission = Number(form.commissionRatePct);
  let expiresAt: string | null = null;

  if (form.expiresAt) {
    const expiresAtDate = new Date(form.expiresAt);
    if (Number.isNaN(expiresAtDate.getTime())) {
      return { error: "Data de expiração inválida." };
    }

    expiresAt = expiresAtDate.toISOString();
  }

  const parsed = referralCouponAdminSchema.safeParse({
    code: form.code,
    partnerName: form.partnerName,
    partnerEmail: form.partnerEmail,
    commissionRatePct: commission,
    expiresAt,
    isActive: form.isActive,
    notes: form.notes,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return parsed.data;
}

export function ReferralCouponForm({
  mode,
  coupon,
  submitAction,
  successRedirectPath = "/admin/cupons",
}: ReferralCouponFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toInitialState(coupon));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const input = mapFormStateToInput(form);
    if ("error" in input) {
      setError(input.error);
      return;
    }

    setIsPending(true);
    const result = await submitAction(input);
    setIsPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(mode === "create" ? "Cupom criado com sucesso." : "Cupom atualizado com sucesso.");
    router.push(successRedirectPath);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-[24px] border p-5 md:p-6"
      style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--card-shadow)" }}
    >
      <div>
        <div style={{ color: "var(--accent-light)", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {mode === "create" ? "Novo cupom" : "Editar cupom"}
        </div>
        <h2 style={{ color: "var(--text-1)", fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, margin: "6px 0 0" }}>
          Dados comerciais do parceiro
        </h2>
      </div>

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

      {success ? (
        <div
          role="status"
          className="rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{
            background: "color-mix(in srgb, var(--success) 8%, var(--card))",
            borderColor: "color-mix(in srgb, var(--success) 22%, var(--border))",
            color: "var(--success)",
          }}
        >
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="referral-code" style={labelStyle}>Código</label>
          <input
            id="referral-code"
            name="code"
            value={form.code}
            onChange={(event) => updateField("code", event.target.value.toUpperCase())}
            placeholder="PARCEIRO_2026"
            required
            style={{ ...inputStyle, fontFamily: "var(--font-mono)", textTransform: "uppercase" as const }}
          />
        </div>

        <div>
          <label htmlFor="partner-name" style={labelStyle}>Parceiro</label>
          <input
            id="partner-name"
            name="partnerName"
            value={form.partnerName}
            onChange={(event) => updateField("partnerName", event.target.value)}
            placeholder="Nome do parceiro"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="partner-email" style={labelStyle}>E-mail do parceiro</label>
          <input
            id="partner-email"
            name="partnerEmail"
            type="email"
            value={form.partnerEmail}
            onChange={(event) => updateField("partnerEmail", event.target.value)}
            placeholder="parceiro@exemplo.com"
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="commission-rate" style={labelStyle}>Comissão (%)</label>
          <input
            id="commission-rate"
            name="commissionRatePct"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.commissionRatePct}
            onChange={(event) => updateField("commissionRatePct", event.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="expires-at" style={labelStyle}>Expiração</label>
          <input
            id="expires-at"
            name="expiresAt"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) => updateField("expiresAt", event.target.value)}
            style={inputStyle}
          />
        </div>

        <div className="flex items-end">
          <label
            htmlFor="coupon-active"
            className="flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3"
            style={{ background: "var(--margin-block-bg)", borderColor: "var(--border)", color: "var(--text-1)", cursor: "pointer" }}
          >
            <span>
              <span className="block text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Ativo</span>
              <span className="text-sm font-bold">Disponível para atribuição</span>
            </span>
            <input
              id="coupon-active"
              name="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
              className="size-5 accent-[var(--accent)]"
            />
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="coupon-notes" style={labelStyle}>Observações</label>
        <textarea
          id="coupon-notes"
          name="notes"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={4}
          placeholder="Acordo comercial, canal de divulgação ou observações internas."
          style={{ ...inputStyle, resize: "vertical" as const }}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin/cupons")}
          className="inline-flex w-full items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold md:w-auto"
          style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-2)", cursor: "pointer" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold md:w-auto"
          style={{
            background: isPending ? "var(--margin-block-bg)" : "var(--accent)",
            color: isPending ? "var(--text-3)" : "#fff",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          <AppIcon name="check" size={15} stroke="currentColor" />
          {isPending ? "Salvando..." : mode === "create" ? "Criar cupom" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
