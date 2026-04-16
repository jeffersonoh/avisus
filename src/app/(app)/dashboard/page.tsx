export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-16 text-text-1">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-light">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold text-accent-dark sm:text-4xl">
          Area autenticada
        </h1>
        <p className="mt-4 text-base leading-relaxed text-text-2">
          Esta rota esta protegida por middleware e validacao de sessao no layout.
        </p>
      </section>
    </main>
  );
}
