export default function DashboardPage() {
  return (
    <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-light">Dashboard</p>
      <h1 className="mt-3 text-3xl font-bold text-accent-dark sm:text-4xl">Área autenticada</h1>
      <p className="mt-4 text-base leading-relaxed text-text-2">
        Esta rota está protegida por middleware e validação de sessão no layout.
      </p>
    </section>
  );
}
