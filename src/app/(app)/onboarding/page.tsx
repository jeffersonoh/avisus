export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-16 text-text-1">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-light">Avisus</p>
        <h1 className="mt-3 text-2xl font-bold text-accent-dark">Onboarding</h1>
        <p className="mt-4 text-base leading-relaxed text-text-2">
          O assistente de onboarding em três passos será implementado na tarefa T-037. Por enquanto,
          você já pode ir ao painel.
        </p>
        <a
          href="/dashboard"
          className="mt-8 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
        >
          Ir para o dashboard
        </a>
      </section>
    </main>
  );
}
