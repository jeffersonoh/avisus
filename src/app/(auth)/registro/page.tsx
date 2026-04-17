import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegistroPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-16 text-text-1">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-light">Avisus</p>
        <h1 className="mt-3 text-2xl font-bold text-accent-dark sm:text-3xl">Criar conta</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-2">
          Cadastre-se para começar a monitorar preços e margens.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
