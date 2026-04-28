import { cookies } from "next/headers";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { readReferralCookie } from "@/features/referrals/cookies";

export default async function RegistroPage() {
  const initialReferralCode = readReferralCookie(await cookies());

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
          Comece grátis e
          <br />
          encontre ofertas
          <br />
          <span style={{ color: "var(--brand-lime)" }}>incríveis</span> hoje.
        </h1>
        <p
          className="mb-9 max-w-[380px] text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Crie sua conta em segundos e comece a monitorar preços, receber alertas e
          analisar margens de revenda.
        </p>

        {/* Benefits list */}
        <div className="mb-9 flex flex-col gap-3">
          {[
            "5 termos de busca no plano gratuito",
            "Alertas em tempo real no Telegram",
            "Análise de margem por canal de revenda",
            "Sem cartão de crédito para começar",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: "var(--brand-lime)", color: "var(--brand-navy)" }}
              >
                ✓
              </div>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              {["AM", "JR", "CS"].map((initials) => (
                <div
                  key={initials}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--brand-teal), var(--brand-navy))",
                    borderColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
              +347 revendedores ativos
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            82% dos usuários fazem upgrade nos primeiros 30 dias.
          </p>
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
              Crie sua conta
            </h2>
            <p className="mt-1.5 text-sm text-text-3">
              Comece grátis e encontre ofertas incríveis
            </p>
          </div>

          <RegisterForm initialReferralCode={initialReferralCode} />

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
