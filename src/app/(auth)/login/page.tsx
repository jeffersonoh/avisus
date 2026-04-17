import { LoginForm } from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const urlError = params.error === "oauth";
  const configError = params.error === "config";

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-bg font-body text-text-1">
      {/* Background orbs */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          top: -120,
          right: -100,
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand-teal) 12%, transparent), transparent 70%)",
          animation: "floatOrb 12s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          bottom: -80,
          left: -60,
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand-purple) 10%, transparent), transparent 70%)",
          animation: "floatOrb 15s ease-in-out infinite 2s",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          top: "40%",
          left: "30%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand-lime) 6%, transparent), transparent 70%)",
          animation: "floatOrb 18s ease-in-out infinite 4s",
        }}
      />

      {/* Left brand panel — hidden on mobile */}
      <div
        className="relative z-10 hidden flex-col justify-center overflow-hidden p-12 lg:flex lg:w-[45%]"
        style={{
          background:
            "linear-gradient(160deg, var(--brand-navy) 0%, var(--brand-navy-deep) 60%, color-mix(in srgb, var(--brand-teal) 20%, var(--brand-navy-deep)) 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/logo-dark-new.png"
          alt="Avisus"
          className="mb-8"
          style={{ height: 175, objectFit: "contain" }}
        />
        <h1
          className="mb-3 text-[clamp(22px,2.8vw,34px)] font-extrabold leading-tight text-white"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Encontre as melhores
          <br />
          oportunidades de
          <br />
          <span style={{ color: "var(--brand-lime)" }}>revenda</span> do Brasil.
        </h1>
        <p
          className="mb-9 max-w-[380px] text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Monitoramento inteligente de preços, alertas em tempo real e análise de margem
          para revendedores.
        </p>

        {/* Stats */}
        <div className="mb-9 flex gap-8">
          {[
            { value: "1.200+", label: "Produtos" },
            { value: "347", label: "Revendedores" },
            { value: "R$ 2M+", label: "Em ofertas/mês" },
          ].map((s) => (
            <div key={s.label}>
              <div
                className="text-2xl font-extrabold"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--brand-lime)",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </div>
              <div className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p
            className="mb-3 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}
          >
            &quot;Com o Avisus encontrei um PS5 abaixo do custo e faturei R$ 1.800 em um dia.&quot;
          </p>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--brand-teal), var(--brand-lime))" }}
            >
              RM
            </div>
            <div>
              <div className="text-xs font-bold text-white">Rafael M.</div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                Revendedor PRO · São Paulo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto p-6">
        <div
          className="w-full max-w-[420px]"
          style={{ animation: "authFadeIn 0.4s ease" }}
        >
          {/* Mobile logo */}
          <div className="mb-6 text-center lg:hidden">
            <picture>
              <source srcSet="/assets/logo-dark-new.png" media="(prefers-color-scheme: dark)" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo-light-new.png"
                alt="Avisus"
                style={{ height: 145, objectFit: "contain", display: "inline-block" }}
              />
            </picture>
          </div>

          <div className="mb-8 text-center">
            <h2
              className="text-[26px] font-extrabold tracking-tight text-text-1"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              Bem-vindo de volta
            </h2>
            <p className="mt-1.5 text-sm text-text-3">
              Entre para acessar suas oportunidades
            </p>
          </div>

          <LoginForm urlError={urlError} configError={configError} />

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-5">
            {["Dados seguros", "Acesso instantâneo", "Cancele quando quiser"].map((text) => (
              <span key={text} className="text-[11px] font-medium text-text-3">
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
