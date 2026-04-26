import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";

export function EmailConfirmedContent() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 font-body text-text-1"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          top: -150,
          right: -120,
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand-teal) 14%, transparent), transparent 70%)",
          animation: "floatOrb 12s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          bottom: -100,
          left: -80,
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand-purple) 10%, transparent), transparent 70%)",
          animation: "floatOrb 15s ease-in-out infinite 2s",
        }}
      />

      <section
        aria-labelledby="email-confirmed-title"
        className="relative z-10 w-full max-w-[520px]"
        style={{
          animation: "authFadeIn 0.4s ease",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          boxShadow: "var(--card-shadow)",
          padding: "32px 26px",
        }}
      >
        <div className="mb-7 flex justify-center">
          <picture>
            <source srcSet="/assets/logo-dark-new.png" media="(prefers-color-scheme: dark)" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo-light-new.png"
              alt="Avisus"
              style={{ height: 120, objectFit: "contain", display: "block" }}
            />
          </picture>
        </div>

        <div
          className="mb-4 inline-flex items-center gap-2"
          style={{
            padding: "7px 11px",
            borderRadius: 999,
            background: "color-mix(in srgb, var(--success) 14%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--success) 34%, var(--border))",
            color: "var(--accent-dark)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <AppIcon name="check" size={13} stroke="var(--accent-light)" />
          Cadastro confirmado
        </div>

        <h1
          id="email-confirmed-title"
          className="mb-3 text-[clamp(26px,6vw,34px)] font-extrabold leading-tight tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}
        >
          Sua conta Avisus está ativa
        </h1>

        <p className="mb-6 text-sm leading-relaxed text-text-2">
          Seu e-mail foi confirmado com sucesso. Agora você pode configurar seus interesses e
          começar a receber oportunidades de compra com margem para revenda.
        </p>

        <div
          className="mb-7 grid gap-3"
          style={{
            padding: 16,
            borderRadius: 18,
            background: "var(--margin-block-bg)",
            border: "1px solid var(--border)",
          }}
        >
          {[
            "Defina os produtos que quer monitorar.",
            "Receba alertas quando surgirem oportunidades.",
            "Compare margem antes de decidir comprar.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm text-text-2">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--accent-light) 14%, transparent)" }}
              >
                <AppIcon name="check" size={12} stroke="var(--accent-light)" />
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Link
            href="/onboarding"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-accent-dark sm:w-auto"
            style={{ background: "var(--accent)" }}
          >
            Continuar configuração
            <AppIcon name="arrowUpRight" size={14} stroke="#fff" />
          </Link>
        </div>
      </section>
    </main>
  );
}
