"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { type AuthFormState, requestPasswordReset } from "@/lib/auth/actions";
import { PasswordResetRequestSchema } from "@/lib/auth/schemas";

const initialState: AuthFormState | null = null;

export function PasswordResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);
  const [clientErrors, setClientErrors] = useState<Partial<Record<"email", string>>>({});

  function validateClient(formData: FormData) {
    const parsed = PasswordResetRequestSchema.safeParse({
      email: String(formData.get("email") ?? ""),
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<"email", string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email") {
          fieldErrors[key] = issue.message;
        }
      }
      setClientErrors(fieldErrors);
      return false;
    }
    setClientErrors({});
    return true;
  }

  return (
    <div className="space-y-7">
      <form
        className="space-y-5"
        action={formAction}
        noValidate
        onSubmit={(e) => {
          if (!validateClient(new FormData(e.currentTarget))) {
            e.preventDefault();
          }
        }}
      >
        <div>
          <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-text-2">
            E-mail da conta
          </label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(clientErrors.email || state?.fieldErrors?.email)}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-text-1 outline-none ring-accent-light/40 transition focus:ring-2"
          />
          {(clientErrors.email || state?.fieldErrors?.email) && (
            <p className="mt-1.5 text-sm text-danger" role="alert">
              {clientErrors.email ?? state?.fieldErrors?.email}
            </p>
          )}
        </div>

        {state?.error ? (
          <p className="rounded-xl border border-danger/40 bg-card px-4 py-3 text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}

        {state?.info ? (
          <p className="rounded-xl border border-info/40 bg-card px-4 py-3 text-sm text-text-2" role="status">
            {state.info}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Enviando…" : "Enviar link"}
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-text-2">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-semibold text-accent-light underline-offset-2 hover:underline">
          Voltar para login
        </Link>
      </p>
    </div>
  );
}
