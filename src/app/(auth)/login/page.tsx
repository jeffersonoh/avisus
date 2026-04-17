import { LoginForm } from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const urlError = params.error === "oauth";

  return (
    <main className="min-h-screen bg-bg px-6 py-16 text-text-1">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-light">Avisus</p>
        <h1 className="mt-3 text-2xl font-bold text-accent-dark sm:text-3xl">Entrar</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-2">
          Acesse sua conta para acompanhar oportunidades e alertas.
        </p>
        <div className="mt-8">
          <LoginForm urlError={urlError} />
        </div>
      </section>
    </main>
  );
}
