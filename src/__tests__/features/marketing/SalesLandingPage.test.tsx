import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  MARKETING_CONTENT,
  MARKETING_FAQS,
  MARKETING_LINKS,
  PUBLIC_PLAN_CARDS,
} from "@/features/marketing/content";

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
