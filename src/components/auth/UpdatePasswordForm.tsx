"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { type AuthFormState, updatePassword } from "@/lib/auth/actions";
import { UpdatePasswordSchema } from "@/lib/auth/schemas";

const initialState: AuthFormState | null = null;

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<"password" | "confirmPassword", string>>
  >({});

  function validateClient(formData: FormData) {
    const parsed = UpdatePasswordSchema.safeParse({
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<"password" | "confirmPassword", string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "password" || key === "confirmPassword") {
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
        <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-text-2">
          Nova senha
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(clientErrors.password || state?.fieldErrors?.password)}
          className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-text-1 outline-none ring-accent-light/40 transition focus:ring-2"
        />
        <p className="mt-1 text-xs text-text-3">Use pelo menos 8 caracteres.</p>
        {(clientErrors.password || state?.fieldErrors?.password) && (
          <p className="mt-1.5 text-sm text-danger" role="alert">
            {clientErrors.password ?? state?.fieldErrors?.password}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-text-2">
          Confirmar nova senha
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(clientErrors.confirmPassword || state?.fieldErrors?.confirmPassword)}
          className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-text-1 outline-none ring-accent-light/40 transition focus:ring-2"
        />
        {(clientErrors.confirmPassword || state?.fieldErrors?.confirmPassword) && (
          <p className="mt-1.5 text-sm text-danger" role="alert">
            {clientErrors.confirmPassword ?? state?.fieldErrors?.confirmPassword}
          </p>
        )}
      </div>

      {state?.error ? (
        <p className="rounded-xl border border-danger/40 bg-card px-4 py-3 text-sm text-danger" role="alert">
          {state.error}{" "}
          <Link href="/esqueci-senha" className="font-semibold underline-offset-2 hover:underline">
            Solicitar novo link
          </Link>
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Salvando…" : "Redefinir senha"}
        </button>
      </div>
    </form>
  );
}
