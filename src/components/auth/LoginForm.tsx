"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  type AuthFormState,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/auth/actions";
import { LoginSchema } from "@/lib/auth/schemas";

const initialState: AuthFormState | null = null;

export function LoginForm({ urlError }: { urlError?: boolean }) {
  const [state, formAction, pending] = useActionState(signInWithEmail, initialState);
  const [clientErrors, setClientErrors] = useState<Partial<Record<"email" | "password", string>>>(
    {},
  );

  function validateClient(formData: FormData) {
    const parsed = LoginSchema.safeParse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<"email" | "password", string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password") {
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
    <div className="space-y-8">
      {urlError ? (
        <p className="rounded-xl border border-danger/40 bg-card px-4 py-3 text-sm text-danger" role="alert">
          Não foi possível entrar com o Google. Tente de novo ou use e-mail e senha.
        </p>
      ) : null}

      <form
        className="space-y-5"
        action={formAction}
        onSubmit={(e) => {
          if (!validateClient(new FormData(e.currentTarget))) {
            e.preventDefault();
          }
        }}
      >
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-text-2">
            E-mail
          </label>
          <input
            id="login-email"
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
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-text-2">
            Senha
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            aria-invalid={Boolean(clientErrors.password || state?.fieldErrors?.password)}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-text-1 outline-none ring-accent-light/40 transition focus:ring-2"
          />
          {(clientErrors.password || state?.fieldErrors?.password) && (
            <p className="mt-1.5 text-sm text-danger" role="alert">
              {clientErrors.password ?? state?.fieldErrors?.password}
            </p>
          )}
        </div>

        {state?.error ? (
          <p className="rounded-xl border border-danger/40 bg-card px-4 py-3 text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-border" />
        </div>
        <p className="relative flex justify-center text-xs uppercase tracking-wide text-text-3">
          <span className="bg-card px-3">ou</span>
        </p>
      </div>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-text-1 shadow-sm transition hover:border-accent-light hover:bg-bg"
        >
          <GoogleGlyph />
          Continuar com Google
        </button>
      </form>

      <p className="text-center text-sm text-text-2">
        Não tem conta?{" "}
        <Link href="/registro" className="font-semibold text-accent-light underline-offset-2 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
