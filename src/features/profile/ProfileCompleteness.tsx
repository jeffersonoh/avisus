"use client";

import { useCompleteness, type ProfileAlertChannel } from "./hooks";

type ProfileCompletenessProps = {
  name: string;
  email: string;
  uf: string;
  city: string;
  alertChannels: ProfileAlertChannel[];
};

export function ProfileCompleteness({ name, email, uf, city, alertChannels }: ProfileCompletenessProps) {
  const { percent, completed, total, missing } = useCompleteness({
    name,
    email,
    uf,
    city,
    alertChannels,
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-1">Completude do perfil</h2>
        <span className="text-sm font-bold text-accent-dark">{percent}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-text-3/20">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-text-3">
        {completed} de {total} campos essenciais preenchidos.
      </p>

      {missing.length > 0 ? (
        <p className="mt-1 text-xs text-text-3">Faltando: {missing.join(", ")}.</p>
      ) : (
        <p className="mt-1 text-xs font-medium text-success">Perfil essencial completo.</p>
      )}
    </section>
  );
}
