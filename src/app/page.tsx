export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-16 text-text-1">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-light">
          Avisus
        </p>
        <h1 className="mt-3 text-3xl font-bold text-accent-dark sm:text-4xl">
          Base Next.js pronta para evoluir o MVP
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-2">
          Esta etapa inicializa o App Router com TypeScript strict, Tailwind e os
          tokens essenciais do design system para guiar a migracao do prototipo.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-accent px-4 py-2 font-semibold text-white">
            Next.js 15
          </span>
          <span className="rounded-full bg-info px-4 py-2 font-semibold text-white">
            TypeScript strict
          </span>
          <span className="rounded-full bg-success px-4 py-2 font-semibold text-accent-dark">
            Tailwind configurado
          </span>
        </div>
      </section>
    </main>
  );
}
