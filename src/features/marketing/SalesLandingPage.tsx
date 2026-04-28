import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";

import {
  MARKETING_CONTENT,
  MARKETING_FAQS,
  MARKETING_FEATURES,
  MARKETING_FINAL_CTA,
  MARKETING_HERO,
  MARKETING_LINKS,
  type MarketingLink,
  MARKETING_TESTIMONIALS,
} from "./content";
import { MarketingAnalytics } from "./MarketingAnalytics";
import { MarketingLogo } from "./MarketingLogo";
import { MarketingThemeToggle } from "./MarketingThemeToggle";
import { PublicPlanComparison } from "./PublicPlanComparison";

const sectionTitleStyle = {
  color: "var(--text-1)",
  fontFamily: "var(--font-display)",
  fontSize: "clamp(26px, 4vw, 40px)",
  fontWeight: 900,
  letterSpacing: "-0.04em",
  lineHeight: 1.12,
  margin: 0,
};

const sectionEyebrowStyle = {
  color: "var(--accent-light)",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.08em",
  marginBottom: 8,
  textTransform: "uppercase" as const,
};

function MarketingCtaLink({ link, variant = "primary" }: { link: MarketingLink; variant?: "primary" | "secondary" }) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={link.href}
      data-marketing-event={link.event}
      data-marketing-href={link.href}
      className={isPrimary ? "marketing-cta-primary" : "marketing-cta-secondary"}
      style={{
        alignItems: "center",
        background: isPrimary ? undefined : "transparent",
        border: isPrimary ? "none" : "1px solid var(--border)",
        borderRadius: 14,
        color: isPrimary ? "#fff" : "var(--text-2)",
        display: "inline-flex",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: 800,
        gap: 8,
        justifyContent: "center",
        minHeight: 46,
        padding: "13px 20px",
        textDecoration: "none",
      }}
    >
      {link.label}
      <AppIcon name="arrowUpRight" size={14} stroke={isPrimary ? "#fff" : "var(--text-2)"} />
    </Link>
  );
}

export function SalesLandingPage() {
  return (
    <main style={{ background: "var(--bg)", color: "var(--text-1)", fontFamily: "var(--font-body)", minHeight: "100vh" }}>
      <div style={{ overflow: "hidden", position: "relative" as const }}>
        <div
          aria-hidden="true"
          style={{
            animation: "floatOrb 14s ease-in-out infinite",
            background: "radial-gradient(circle, color-mix(in srgb, var(--accent-light) 14%, transparent), transparent 68%)",
            borderRadius: "50%",
            height: 420,
            pointerEvents: "none",
            position: "absolute" as const,
            right: -150,
            top: -140,
            width: 420,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            animation: "floatOrb 18s ease-in-out infinite 2s",
            background: "radial-gradient(circle, color-mix(in srgb, var(--brand-purple) 10%, transparent), transparent 70%)",
            borderRadius: "50%",
            bottom: 420,
            height: 300,
            left: -110,
            pointerEvents: "none",
            position: "absolute" as const,
            width: 300,
          }}
        />

        <header
          style={{
            backdropFilter: "blur(14px)",
            background: "var(--glass)",
            borderBottom: "1px solid var(--border)",
            position: "sticky" as const,
            top: 0,
            zIndex: 10,
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" aria-label="Avisus home" style={{ alignItems: "center", display: "inline-flex", textDecoration: "none" }}>
              <MarketingLogo />
            </Link>

            <nav aria-label="Ações públicas" className="flex items-center gap-2">
              <MarketingThemeToggle />
              <Link
                href={MARKETING_LINKS.login.href}
                data-marketing-event={MARKETING_LINKS.login.event}
                data-marketing-href={MARKETING_LINKS.login.href}
                className="marketing-cta-secondary"
                style={{
                  borderRadius: 12,
                  color: "var(--text-2)",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "10px 14px",
                  textDecoration: "none",
                }}
              >
                {MARKETING_LINKS.login.label}
              </Link>
              <MarketingCtaLink link={MARKETING_HERO.primaryCta} />
            </nav>
          </div>
        </header>

        <section aria-labelledby="marketing-hero-title" className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div style={{ alignSelf: "center", position: "relative" as const, zIndex: 1 }}>
            <div
              style={{
                alignItems: "center",
                background: "color-mix(in srgb, var(--accent-light) 12%, var(--card))",
                border: "1px solid color-mix(in srgb, var(--accent-light) 28%, var(--border))",
                borderRadius: 999,
                color: "var(--accent-light)",
                display: "inline-flex",
                fontSize: 11,
                fontWeight: 800,
                gap: 8,
                letterSpacing: "0.08em",
                marginBottom: 18,
                padding: "6px 12px",
                textTransform: "uppercase" as const,
              }}
            >
              <span
                aria-hidden
                className="marketing-live-dot"
                style={{ background: "var(--brand-lime)", borderRadius: 999, height: 8, width: 8 }}
              />
              {MARKETING_HERO.eyebrow}
            </div>
            <h1
              id="marketing-hero-title"
              style={{
                color: "var(--text-1)",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(38px, 7vw, 72px)",
                fontWeight: 950,
                letterSpacing: "-0.06em",
                lineHeight: 0.98,
                margin: 0,
              }}
            >
              <span className="marketing-gradient-text">{MARKETING_HERO.headline}</span>
            </h1>
            <p style={{ color: "var(--text-2)", fontSize: 18, lineHeight: 1.65, margin: "22px 0 0", maxWidth: 660 }}>
              {MARKETING_HERO.subheadline}
            </p>
            <p style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.55, margin: "14px 0 0", maxWidth: 620 }}>
              {MARKETING_HERO.urgencyNote}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <MarketingCtaLink link={MARKETING_HERO.primaryCta} />
              <MarketingCtaLink link={MARKETING_HERO.secondaryCta} variant="secondary" />
            </div>
            <ul
              aria-hidden
              style={{
                color: "var(--text-3)",
                display: "flex",
                flexWrap: "wrap",
                fontSize: 12,
                fontWeight: 700,
                gap: 18,
                listStyle: "none",
                margin: "22px 0 0",
                padding: 0,
              }}
            >
              {[
                "Sem cartão para começar",
                "Cancele quando quiser",
                "Garantia de 7 dias",
              ].map((item) => (
                <li key={item} style={{ alignItems: "center", display: "inline-flex", gap: 6 }}>
                  <AppIcon name="check" size={12} stroke="var(--accent-light)" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside
            aria-label="Resumo do Avisus"
            style={{
              background: "linear-gradient(155deg, var(--brand-navy), var(--brand-navy-deep))",
              border: "1px solid color-mix(in srgb, var(--accent-light) 22%, var(--border))",
              borderRadius: 30,
              boxShadow: "0 24px 70px color-mix(in srgb, var(--accent) 22%, transparent)",
              color: "#fff",
              overflow: "hidden",
              padding: 24,
              position: "relative" as const,
            }}
          >
            <div aria-hidden="true" style={{ background: "color-mix(in srgb, var(--brand-lime) 10%, transparent)", borderRadius: "50%", height: 180, position: "absolute" as const, right: -70, top: -70, width: 180 }} />
            <div style={{ position: "relative" as const, zIndex: 1 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 18 }}>
                <span
                  aria-hidden
                  className="marketing-live-dot"
                  style={{ background: "var(--brand-lime)", borderRadius: 999, height: 10, width: 10 }}
                />
                <AppIcon name="zap" size={18} stroke="var(--brand-lime)" />
                <span style={{ color: "var(--brand-lime)", fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                  Scanner em ação
                </span>
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {[
                  { label: "Scanner PRO", value: "5min", text: "Frequência para agir antes da oferta esfriar." },
                  { label: "Margem estimada", value: "por canal", text: "Custo, frete e referência de revenda no mesmo fluxo." },
                  { label: "Alertas", value: "Web + Telegram", text: "Canais para reduzir monitoramento manual." },
                ].map((item) => (
                  <div key={item.label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 16 }}>
                    <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                      {item.label}
                    </div>
                    <div style={{ color: "var(--brand-lime)", fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 900, marginTop: 4 }}>
                      {item.value}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section aria-labelledby="funcionalidades-title" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div style={sectionEyebrowStyle}>Funcionalidades</div>
            <h2 id="funcionalidades-title" style={sectionTitleStyle}>Do monitoramento ao clique de compra</h2>
            <p style={{ color: "var(--text-3)", fontSize: 15, lineHeight: 1.65, margin: "12px auto 0" }}>
              O Avisus agrupa sinais de preço, margem e velocidade para apoiar sua decisão de compra em marketplaces e lives.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MARKETING_FEATURES.map((feature, index) => (
              <article
                key={feature.id}
                className="marketing-hover-lift"
                style={{
                  animation: "cardIn 0.35s ease both",
                  animationDelay: `${index * 35}ms`,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 22,
                  boxShadow: "var(--card-shadow)",
                  padding: 22,
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--accent-light) 22%, transparent), color-mix(in srgb, var(--brand-purple) 14%, transparent))",
                    borderRadius: 14,
                    display: "flex",
                    height: 42,
                    justifyContent: "center",
                    marginBottom: 14,
                    width: 42,
                  }}
                >
                  <AppIcon name={feature.id === "lives" ? "video" : feature.id === "alerts" ? "bell" : feature.id === "margin" ? "percent" : "sparkles"} size={18} stroke="var(--accent-light)" />
                </div>
                <h3 style={{ color: "var(--text-1)", fontSize: 17, fontWeight: 850, margin: 0 }}>{feature.title}</h3>
                <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.55, margin: "8px 0 0" }}>{feature.description}</p>
                <p style={{ color: "var(--accent-light)", fontSize: 12, fontWeight: 800, lineHeight: 1.45, margin: "12px 0 0" }}>{feature.highlight}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <PublicPlanComparison />
        </section>

        <section aria-labelledby="prova-social-title" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <div style={sectionEyebrowStyle}>Prova social</div>
              <h2 id="prova-social-title" style={sectionTitleStyle}>Decisão mais rápida, expectativa realista</h2>
              <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, margin: "12px 0 0" }}>
                Depoimentos e exemplos descrevem uso da plataforma como apoio à decisão. O Avisus não garante lucro, revenda ou disponibilidade contínua das ofertas.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {MARKETING_TESTIMONIALS.map((testimonial) => (
                <article key={testimonial.name} className="marketing-hover-lift" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 22, boxShadow: "var(--card-shadow)", padding: 20 }}>
                  <div style={{ color: "var(--accent-light)", fontSize: 28, fontWeight: 900, lineHeight: 1 }}>&quot;</div>
                  <p style={{ color: "var(--text-2)", fontSize: 13, fontStyle: "italic", lineHeight: 1.58, margin: "8px 0 16px" }}>{testimonial.quote}</p>
                  <div style={{ color: "var(--text-1)", fontSize: 13, fontWeight: 850 }}>{testimonial.name}</div>
                  <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>{testimonial.role} · {testimonial.plan}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div style={sectionEyebrowStyle}>FAQ</div>
            <h2 id="faq-title" style={sectionTitleStyle}>Perguntas antes de assinar</h2>
          </div>
          <div className="mt-8 grid gap-3">
            {MARKETING_FAQS.map((faq) => (
              <article key={faq.question} className="marketing-hover-lift" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "18px 20px" }}>
                <h3 style={{ color: "var(--text-1)", fontSize: 15, fontWeight: 850, margin: 0 }}>{faq.question}</h3>
                <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.6, margin: "8px 0 0" }}>{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="cta-final-title" className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, var(--card)), color-mix(in srgb, var(--brand-purple) 14%, var(--card)) 60%, color-mix(in srgb, var(--accent-light) 18%, var(--card)))",
              border: "1px solid color-mix(in srgb, var(--accent-light) 28%, var(--border))",
              borderRadius: 30,
              boxShadow: "0 22px 60px color-mix(in srgb, var(--accent) 18%, transparent)",
              overflow: "hidden",
              padding: "38px 28px",
              position: "relative" as const,
              textAlign: "center",
            }}
          >
            <div
              aria-hidden
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--accent-light) 26%, transparent), transparent 65%)",
                borderRadius: "50%",
                height: 280,
                left: "50%",
                pointerEvents: "none",
                position: "absolute" as const,
                top: -120,
                transform: "translateX(-50%)",
                width: 380,
              }}
            />
            <div style={{ position: "relative" as const, zIndex: 1 }}>
              <div style={sectionEyebrowStyle}>{MARKETING_FINAL_CTA.eyebrow}</div>
              <h2 id="cta-final-title" style={{ ...sectionTitleStyle, margin: "0 auto", maxWidth: 780 }}>{MARKETING_FINAL_CTA.title}</h2>
              <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, margin: "14px auto 0", maxWidth: 680 }}>
                {MARKETING_FINAL_CTA.description}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <MarketingCtaLink link={MARKETING_FINAL_CTA.primaryCta} />
                <MarketingCtaLink link={MARKETING_FINAL_CTA.secondaryCta} variant="secondary" />
              </div>
            </div>
          </div>
        </section>
        <MarketingAnalytics />
      </div>
    </main>
  );
}

export { MARKETING_CONTENT };
