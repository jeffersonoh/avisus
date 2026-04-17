"use client";

import Link from "next/link";

const SUPPORT_HREF =
  "mailto:suporte@avisus.app?subject=" + encodeURIComponent("Avisus — erro no aplicativo");

export interface AppRouteErrorPanelProps {
  /** Rótulo curto da área (ex.: "Dashboard") para contextualizar a mensagem. */
  contextLabel: string;
  error: Error & { digest?: string };
  reset: () => void;
}

export function AppRouteErrorPanel({ contextLabel, error, reset }: AppRouteErrorPanelProps) {
  return (
    <section
      role="alert"
      className="rounded-3xl border border-danger/40 bg-card p-8 shadow-sm"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-danger">Algo deu errado</p>
      <h1 className="mt-3 text-2xl font-bold text-accent-dark">Falha ao abrir {contextLabel}</h1>
      <p className="mt-4 text-base leading-relaxed text-text-2">
        Tente novamente em instantes. Se o problema continuar, fale com o suporte informando o código abaixo
        (não envie dados sensíveis por e-mail).
      </p>
      <p className="mt-3 font-mono text-sm text-text-3">
        Referência: {typeof error.digest === "string" && error.digest.length > 0 ? error.digest : "sem-código"}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
        >
          Tentar novamente
        </button>
        <Link
          href={SUPPORT_HREF}
          className="inline-flex justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-accent-dark transition hover:border-accent-light hover:text-accent"
        >
          Falar com o suporte
        </Link>
      </div>
    </section>
  );
}
