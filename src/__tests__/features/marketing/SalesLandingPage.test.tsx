import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  MARKETING_CONTENT,
  MARKETING_FAQS,
  MARKETING_LINKS,
  PUBLIC_PLAN_CARDS,
} from "@/features/marketing/content";
import { PublicPlanComparison } from "@/features/marketing/PublicPlanComparison";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

function MarketingContentConsumer() {
  return (
    <main>
      <h1>{MARKETING_CONTENT.hero.headline}</h1>
      <p>{MARKETING_CONTENT.hero.subheadline}</p>
      <a href={MARKETING_CONTENT.hero.primaryCta.href}>{MARKETING_CONTENT.hero.primaryCta.label}</a>
      <a href={MARKETING_LINKS.login.href}>{MARKETING_LINKS.login.label}</a>

      <section aria-label="Funcionalidades">
        {MARKETING_CONTENT.features.map((feature) => (
          <article key={feature.id}>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <section aria-label="Planos">
        {MARKETING_CONTENT.plans.map((plan) => (
          <article key={plan.id}>
            <h2>{plan.name}</h2>
            <p>{`${plan.price}${plan.period}`}</p>
            <a href={plan.cta.href}>{plan.cta.label}</a>
          </article>
        ))}
      </section>

      <section aria-label="Perguntas frequentes">
        {MARKETING_CONTENT.faqs.map((faq) => (
          <article key={faq.question}>
            <h2>{faq.question}</h2>
            <p>{faq.answer}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

describe("marketing content", () => {
  it("defines every public plan with required fields", () => {
    expect(PUBLIC_PLAN_CARDS).toHaveLength(3);

    for (const plan of PUBLIC_PLAN_CARDS) {
      expect(plan.id).toBeTruthy();
      expect(plan.name).toBeTruthy();
      expect(plan.price).toBeTruthy();
      expect(plan.features.length).toBeGreaterThan(0);
      expect(plan.cta.href).toBeTruthy();
    }
  });

  it("points PRO CTA to registration with PRO plan intent", () => {
    const proPlan = PUBLIC_PLAN_CARDS.find((plan) => plan.id === "pro");

    expect(proPlan?.cta.href).toBe("/registro?plan=pro");
  });

  it("points login entry to login route", () => {
    expect(MARKETING_LINKS.login.href).toBe("/login");
  });

  it("includes an explicit FAQ answer about no guaranteed profit", () => {
    const noProfitFaq = MARKETING_FAQS.find((faq) => /garante lucro/i.test(faq.question));

    expect(noProfitFaq?.answer).toMatch(/não garante lucro/i);
    expect(noProfitFaq?.answer).toMatch(/apoia sua decisão/i);
  });

  it("renders a simple consumer with critical marketing texts", () => {
    render(<MarketingContentConsumer />);

    expect(
      screen.getByRole("heading", {
        name: /pare de perder ofertas enquanto monitora marketplaces manualmente/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/calcula margem estimada/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: "Assinar PRO" })[0]).toHaveAttribute(
      "href",
      "/registro?plan=pro",
    );
    expect(screen.getByRole("heading", { name: "Scanner de marketplaces" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PRO" })).toBeInTheDocument();
    expect(screen.getByText("R$99/mês")).toBeInTheDocument();
    expect(screen.getByText(/não garante lucro/i)).toBeInTheDocument();
  });
});

describe("PublicPlanComparison", () => {
  it("renders FREE, STARTER and PRO public plans", () => {
    render(<PublicPlanComparison />);

    expect(screen.getByRole("article", { name: "Plano FREE" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Plano STARTER" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Plano PRO" })).toBeInTheDocument();
  });

  it("shows STARTER price as R$49/mês", () => {
    render(<PublicPlanComparison />);

    expect(screen.getByLabelText("Preço STARTER R$49/mês")).toBeInTheDocument();
  });

  it("shows PRO price and accessible recommendation badge", () => {
    render(<PublicPlanComparison />);

    expect(screen.getByLabelText("Preço PRO R$99/mês")).toBeInTheDocument();
    expect(screen.getByLabelText("Plano recomendado")).toHaveTextContent("Recomendado");
  });

  it("points PRO plan CTA to registration with PRO plan intent", () => {
    render(<PublicPlanComparison />);

    expect(screen.getByRole("link", { name: /Assinar PRO/ })).toHaveAttribute("href", "/registro?plan=pro");
  });

  it("keeps all plan links available when rendered inside a landing section", () => {
    render(
      <main>
        <PublicPlanComparison />
      </main>,
    );

    expect(screen.getByRole("link", { name: /Começar grátis/ })).toHaveAttribute("href", "/registro");
    expect(screen.getByRole("link", { name: /Assinar STARTER/ })).toHaveAttribute("href", "/registro?plan=starter");
    expect(screen.getByRole("link", { name: /Assinar PRO/ })).toHaveAttribute("href", "/registro?plan=pro");
  });

  it("renders trust messages for paid plan evaluation", () => {
    render(<PublicPlanComparison />);

    expect(screen.getByText("Garantia de 7 dias")).toBeInTheDocument();
    expect(screen.getByText("Pagamento seguro")).toBeInTheDocument();
    expect(screen.getByText("Cancele quando quiser")).toBeInTheDocument();
  });
});
