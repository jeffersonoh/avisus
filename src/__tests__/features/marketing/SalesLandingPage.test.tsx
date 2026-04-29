import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { track } from "@vercel/analytics";

import HomePage from "@/app/page";
import { metadata } from "@/app/layout";
import {
  MARKETING_CONTENT,
  MARKETING_EVENTS,
  MARKETING_FAQS,
  MARKETING_LINKS,
  PUBLIC_PLAN_CARDS,
} from "@/features/marketing/content";
import { PublicPlanComparison } from "@/features/marketing/PublicPlanComparison";
import { SalesLandingPage } from "@/features/marketing/SalesLandingPage";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

vi.mock("next/font/google", () => ({
  Montserrat: () => ({ variable: "--font-body" }),
}));

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

const originalIntersectionObserver = globalThis.IntersectionObserver;

function installIntersectionObserverMock() {
  let callback: IntersectionObserverCallback | undefined;
  const observe = vi.fn();
  const disconnect = vi.fn();
  const observerStub = {
    disconnect,
    observe,
    root: null,
    rootMargin: "",
    takeRecords: () => [],
    thresholds: [0.25],
    unobserve: vi.fn(),
  } satisfies IntersectionObserver;

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [0.25];

    constructor(observerCallback: IntersectionObserverCallback) {
      callback = observerCallback;
    }

    disconnect = disconnect;
    observe = observe;
    takeRecords = () => [];
    unobserve = vi.fn();
  }

  globalThis.IntersectionObserver = MockIntersectionObserver;

  return {
    disconnect,
    trigger(isIntersecting: boolean) {
      if (!callback) {
        throw new Error("IntersectionObserver mock was not initialized.");
      }

      callback([{ isIntersecting } as IntersectionObserverEntry], observerStub);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  globalThis.IntersectionObserver = originalIntersectionObserver;
});

function preventLinkNavigation(link: HTMLElement) {
  link.addEventListener("click", (event) => event.preventDefault(), { once: true });
}

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
            {plan.annualPrice ? <p>{plan.annualPrice}</p> : null}
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
    expect(screen.getByText("R$149/mês")).toBeInTheDocument();
    expect(screen.getByText("R$ 1499,00/ano")).toBeInTheDocument();
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

    expect(screen.getByLabelText("Preço STARTER R$49/mês ou R$ 499,00/ano")).toBeInTheDocument();
    expect(screen.getByText("ou R$ 499,00/ano")).toBeInTheDocument();
    expect(screen.getAllByText("(Ganha 2 meses de brinde)")).toHaveLength(2);
  });

  it("shows PRO price and accessible recommendation badge", () => {
    render(<PublicPlanComparison />);

    expect(screen.getByLabelText("Preço PRO R$149/mês ou R$ 1499,00/ano")).toBeInTheDocument();
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

describe("SalesLandingPage", () => {
  it("renders the main commercial headline", () => {
    render(<SalesLandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /pare de perder ofertas enquanto monitora marketplaces manualmente/i,
      }),
    ).toBeInTheDocument();
  });

  it("includes PRO subscription links pointing to registration with plan intent", () => {
    render(<SalesLandingPage />);

    const proLinks = screen.getAllByRole("link", { name: /Assinar PRO/ });
    expect(proLinks.length).toBeGreaterThan(0);
    for (const link of proLinks) {
      expect(link).toHaveAttribute("href", "/registro?plan=pro");
    }
  });

  it("includes a visible login link", () => {
    render(<SalesLandingPage />);

    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
  });

  it("renders feature content about scanner, margin, alerts and lives", () => {
    render(<SalesLandingPage />);

    expect(screen.getByRole("heading", { name: "Scanner de marketplaces" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Margem estimada por canal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alertas acionáveis" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monitoramento de lives" })).toBeInTheDocument();
  });

  it("renders FAQ answers about warranty, cancellation and no guaranteed profit", () => {
    render(<SalesLandingPage />);

    expect(screen.getAllByText(/garantia de 7 dias/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cancelar quando quiser/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/não garante lucro/i).length).toBeGreaterThan(0);
  });

  it("renders the complete landing with public plan comparison", () => {
    render(<SalesLandingPage />);

    expect(screen.getByRole("article", { name: "Plano FREE" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Plano STARTER" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Plano PRO" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Perguntas antes de assinar/i })).toBeInTheDocument();
  });

  it("renders all must-have sections with semantic names and logo alt text", () => {
    render(<SalesLandingPage />);

    expect(screen.getByRole("region", { name: /pare de perder ofertas enquanto monitora marketplaces manualmente/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /do monitoramento ao clique de compra/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /escolha como quer monitorar oportunidades/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /decisão mais rápida, expectativa realista/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /perguntas antes de assinar/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /assine o pro e acompanhe oportunidades/i })).toBeInTheDocument();
    expect(screen.getByAltText("Avisus")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Ações públicas" })).toBeInTheDocument();
  });

  it("communicates offer monitoring, estimated margin and action links in the hero", () => {
    render(<SalesLandingPage />);

    const hero = screen.getByRole("region", {
      name: /pare de perder ofertas enquanto monitora marketplaces manualmente/i,
    });

    expect(within(hero).getByText(/monitora oportunidades/i)).toBeInTheDocument();
    expect(within(hero).getByText(/calcula margem estimada/i)).toBeInTheDocument();
    expect(within(hero).getByText(/entrega links de ação/i)).toBeInTheDocument();
  });

  it("shows FREE, STARTER and PRO plans with prices and main limits", () => {
    render(<SalesLandingPage />);

    const freePlan = screen.getByRole("article", { name: "Plano FREE" });
    const starterPlan = screen.getByRole("article", { name: "Plano STARTER" });
    const proPlan = screen.getByRole("article", { name: "Plano PRO" });

    expect(within(freePlan).getByLabelText("Preço FREE R$0/mês")).toBeInTheDocument();
    expect(within(freePlan).getByText("5 termos de interesse")).toBeInTheDocument();
    expect(within(starterPlan).getByLabelText("Preço STARTER R$49/mês ou R$ 499,00/ano")).toBeInTheDocument();
    expect(within(starterPlan).getByText("Até 20 termos de interesse")).toBeInTheDocument();
    expect(within(proPlan).getByLabelText("Preço PRO R$149/mês ou R$ 1499,00/ano")).toBeInTheDocument();
    expect(within(proPlan).getByText("Termos de interesse ilimitados")).toBeInTheDocument();
  });

  it("keeps public CTA destinations for FREE, STARTER, PRO and login", () => {
    render(<SalesLandingPage />);

    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: /Começar grátis/ }).at(0)).toHaveAttribute("href", "/registro");
    expect(screen.getByRole("link", { name: /Assinar STARTER/ })).toHaveAttribute("href", "/registro?plan=starter");

    for (const proLink of screen.getAllByRole("link", { name: /Assinar PRO/ })) {
      expect(proLink).toHaveAttribute("href", "/registro?plan=pro");
    }
  });

  it("tracks PRO CTA click with the hero analytics event", async () => {
    const user = userEvent.setup();
    render(<SalesLandingPage />);

    const proLink = screen.getAllByRole("link", { name: /Assinar PRO/ }).at(0);
    if (!proLink) {
      throw new Error("Expected at least one PRO CTA link.");
    }

    preventLinkNavigation(proLink);
    await user.click(proLink);

    expect(track).toHaveBeenCalledWith(MARKETING_EVENTS.hero_assinar_pro_click, {
      href: "/registro?plan=pro",
      source: "marketing_home",
    });
  });

  it("tracks login click with the header analytics event", async () => {
    const user = userEvent.setup();
    render(<SalesLandingPage />);

    const loginLink = screen.getByRole("link", { name: "Entrar" });
    preventLinkNavigation(loginLink);

    await user.click(loginLink);

    expect(track).toHaveBeenCalledWith(MARKETING_EVENTS.header_login_click, {
      href: "/login",
      source: "marketing_home",
    });
  });

  it("tracks plan and final CTA clicks with expected analytics events", async () => {
    const user = userEvent.setup();
    render(<SalesLandingPage />);

    const freeLink = within(screen.getByRole("article", { name: "Plano FREE" })).getByRole("link", {
      name: /Começar grátis/,
    });
    const starterLink = screen.getByRole("link", { name: /Assinar STARTER/ });
    const proPlanLink = within(screen.getByRole("article", { name: "Plano PRO" })).getByRole("link", {
      name: /Assinar PRO/,
    });
    const finalCta = screen.getByRole("region", { name: /assine o pro e acompanhe oportunidades/i });
    const finalProLink = within(finalCta).getByRole("link", { name: /Assinar PRO/ });

    preventLinkNavigation(freeLink);
    preventLinkNavigation(starterLink);
    preventLinkNavigation(proPlanLink);
    preventLinkNavigation(finalProLink);

    await user.click(freeLink);
    await user.click(starterLink);
    await user.click(proPlanLink);
    await user.click(finalProLink);

    expect(track).toHaveBeenCalledWith(MARKETING_EVENTS.plan_free_click, {
      href: "/registro",
      plan: "free",
      source: "marketing_home",
    });
    expect(track).toHaveBeenCalledWith(MARKETING_EVENTS.plan_starter_click, {
      href: "/registro?plan=starter",
      plan: "starter",
      source: "marketing_home",
    });
    expect(track).toHaveBeenCalledWith(MARKETING_EVENTS.plan_pro_click, {
      href: "/registro?plan=pro",
      plan: "pro",
      source: "marketing_home",
    });
    expect(track).toHaveBeenCalledWith(MARKETING_EVENTS.final_assinar_pro_click, {
      href: "/registro?plan=pro",
      source: "marketing_home",
    });
  });

  it("tracks plans section view only once per page load", () => {
    const observerMock = installIntersectionObserverMock();
    render(<SalesLandingPage />);

    observerMock.trigger(true);
    observerMock.trigger(true);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(MARKETING_EVENTS.plans_section_view, {
      source: "marketing_home",
    });
    expect(observerMock.disconnect).toHaveBeenCalled();
  });

  it("keeps links navigable when analytics tracking is unavailable", async () => {
    vi.mocked(track).mockImplementation(() => {
      throw new Error("Analytics unavailable");
    });

    const user = userEvent.setup();
    render(<SalesLandingPage />);

    const loginLink = screen.getByRole("link", { name: "Entrar" });
    preventLinkNavigation(loginLink);

    await user.click(loginLink);

    expect(loginLink).toHaveAttribute("href", "/login");
    const freeLink = screen.getAllByRole("link", { name: /Começar grátis/ }).at(0);
    if (!freeLink) {
      throw new Error("Expected at least one free registration link.");
    }

    expect(freeLink).toHaveAttribute("href", "/registro");
  });
});

describe("HomePage", () => {
  it("renders the commercial landing headline on the public route", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /pare de perder ofertas enquanto monitora marketplaces manualmente/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders without props, session or external data", () => {
    expect(() => render(<HomePage />)).not.toThrow();
  });

  it("defines sales metadata for Brazilian resellers", () => {
    expect(metadata.title).toBe("Avisus | Inteligência de preços para revendedores");
    expect(metadata.description).toMatch(/margem estimada/i);
    expect(metadata.description).toMatch(/revender/i);
    expect(metadata.openGraph).toMatchObject({
      locale: "pt_BR",
      siteName: "Avisus",
      type: "website",
    });
  });
});
