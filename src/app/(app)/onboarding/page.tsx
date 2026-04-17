import Link from "next/link";

export default function OnboardingPage() {
  return (
    <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-light">Avisus</p>
      <h1 className="mt-3 text-2xl font-bold text-accent-dark">Onboarding</h1>
      <p className="mt-4 text-base leading-relaxed text-text-2">
        O assistente de onboarding em três passos será implementado na tarefa T-037. Por enquanto, você já pode ir ao
        painel.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
      >
        Ir para o dashboard
      </Link>
    </section>
  );
}
