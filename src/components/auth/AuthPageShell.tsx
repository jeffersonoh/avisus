import type { ReactNode } from "react";

type AuthPageShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthPageShell({ children, title, subtitle }: AuthPageShellProps) {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-bg font-body text-text-1">
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
          Recupere o acesso
          <br />
          com segurança.
        </h1>
        <p className="max-w-[380px] text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          Proteja sua conta e volte a monitorar oportunidades, alertas e margens no Avisus.
        </p>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto p-6">
        <div className="w-full max-w-[420px]" style={{ animation: "authFadeIn 0.4s ease" }}>
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
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-text-3">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}
