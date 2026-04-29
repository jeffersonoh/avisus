export type MarketingPlanId = "free" | "starter" | "pro";

export type MarketingCtaEvent =
  | "hero_assinar_pro_click"
  | "header_login_click"
  | "plan_free_click"
  | "plan_starter_click"
  | "plan_pro_click"
  | "final_assinar_pro_click"
  | "plans_section_view";

export type MarketingRequirementRef =
  | "RF-01"
  | "RF-02"
  | "RF-03"
  | "RF-04"
  | "RF-05"
  | "RF-06"
  | "RF-07"
  | "RF-08"
  | "RF-09"
  | "RF-10"
  | "RF-11"
  | "RF-12"
  | "RF-13"
  | "RF-14"
  | "RF-15"
  | "RF-16"
  | "RF-17"
  | "RF-18"
  | "RF-19";

export type MarketingLink = {
  label: string;
  href: string;
  event: MarketingCtaEvent;
};

export type MarketingFeature = {
  id: string;
  title: string;
  description: string;
  highlight: string;
  requirementRefs: MarketingRequirementRef[];
};

export type PublicPlanCard = {
  id: MarketingPlanId;
  name: string;
  price: string;
  period: string;
  subtitle: string;
  accent: string;
  featured?: boolean;
  features: string[];
  cta: MarketingLink;
  requirementRefs: MarketingRequirementRef[];
};

export type MarketingFaq = {
  question: string;
  answer: string;
  requirementRefs: MarketingRequirementRef[];
};

export type MarketingTestimonial = {
  name: string;
  role: string;
  plan: string;
  quote: string;
  requirementRefs: MarketingRequirementRef[];
};

export type MarketingTrustItem = {
  title: string;
  description: string;
  requirementRefs: MarketingRequirementRef[];
};

export type MarketingHeroContent = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  urgencyNote: string;
  primaryCta: MarketingLink;
  secondaryCta: MarketingLink;
  requirementRefs: MarketingRequirementRef[];
};

export const MARKETING_EVENTS: Record<MarketingCtaEvent, MarketingCtaEvent> = {
  hero_assinar_pro_click: "hero_assinar_pro_click",
  header_login_click: "header_login_click",
  plan_free_click: "plan_free_click",
  plan_starter_click: "plan_starter_click",
  plan_pro_click: "plan_pro_click",
  final_assinar_pro_click: "final_assinar_pro_click",
  plans_section_view: "plans_section_view",
};

export const MARKETING_LINKS = {
  login: {
    label: "Entrar",
    href: "/login",
    event: MARKETING_EVENTS.header_login_click,
  },
  startFree: {
    label: "Começar grátis",
    href: "/registro",
    event: MARKETING_EVENTS.plan_free_click,
  },
  starter: {
    label: "Assinar STARTER",
    href: "/registro?plan=starter",
    event: MARKETING_EVENTS.plan_starter_click,
  },
  heroPro: {
    label: "Assinar PRO",
    href: "/registro?plan=pro",
    event: MARKETING_EVENTS.hero_assinar_pro_click,
  },
  planPro: {
    label: "Assinar PRO",
    href: "/registro?plan=pro",
    event: MARKETING_EVENTS.plan_pro_click,
  },
  finalPro: {
    label: "Assinar PRO",
    href: "/registro?plan=pro",
    event: MARKETING_EVENTS.final_assinar_pro_click,
  },
} satisfies Record<string, MarketingLink>;

export const MARKETING_HERO: MarketingHeroContent = {
  eyebrow: "Inteligência de preços para revendedores",
  headline: "Pare de perder ofertas enquanto monitora marketplaces manualmente.",
  subheadline:
    "O Avisus monitora oportunidades, calcula margem estimada e entrega links de ação para você decidir mais rápido, sem depender de garimpo manual.",
  urgencyNote:
    "Promoções, cupons e lives mudam rápido. O Avisus ajuda você a agir com dados, sem promessa de lucro garantido.",
  primaryCta: MARKETING_LINKS.heroPro,
  secondaryCta: MARKETING_LINKS.startFree,
  requirementRefs: ["RF-01", "RF-02", "RF-03", "RF-04", "RF-19"],
};

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    id: "scanner",
    title: "Scanner de marketplaces",
    description:
      "Monitore ofertas em múltiplos canais com frequência por plano: FREE a cada 2h, STARTER a cada 30min e PRO a cada 5min.",
    highlight: "Menos abas abertas, mais sinais comparáveis.",
    requirementRefs: ["RF-05"],
  },
  {
    id: "interests",
    title: "Interesses de compra",
    description:
      "Cadastre termos que representam seu nicho: 5 no FREE, até 20 no STARTER e ilimitados no PRO.",
    highlight: "Oportunidades alinhadas ao que você realmente revende.",
    requirementRefs: ["RF-06"],
  },
  {
    id: "margin",
    title: "Margem estimada por canal",
    description:
      "Compare preço, frete, custo de aquisição, melhor margem por canal e quality badge antes de comprar.",
    highlight: "Apoio à decisão, não chute de margem.",
    requirementRefs: ["RF-07", "RF-19"],
  },
  {
    id: "dashboard",
    title: "Dashboard de oportunidades",
    description:
      "Veja oportunidades com filtros, ordenação, ações de compra e descarte para priorizar o que merece atenção.",
    highlight: "Fluxo prático para decidir rápido.",
    requirementRefs: ["RF-08"],
  },
  {
    id: "alerts",
    title: "Alertas acionáveis",
    description:
      "Receba avisos via Web, Telegram e WhatsApp conforme disponibilidade do plano e canais configurados.",
    highlight: "Menos dependência de checagem manual.",
    requirementRefs: ["RF-09"],
  },
  {
    id: "lives",
    title: "Monitoramento de lives",
    description:
      "Acompanhe perfis monitorados em Shopee e TikTok, com limites por plano para receber alertas quando entrarem ao vivo.",
    highlight: "Lives entram no radar sem ficar atualizando página.",
    requirementRefs: ["RF-10"],
  },
  {
    id: "history",
    title: "Histórico de preços",
    description:
      "Consulte janelas de 7, 30 e 90 dias conforme o plano para entender se a oferta está fora do padrão recente.",
    highlight: "Contexto antes da compra.",
    requirementRefs: ["RF-11"],
  },
  {
    id: "trends",
    title: "Tendências de preço",
    description:
      "Planos pagos destacam tendências para ajudar a separar queda real de ruído momentâneo.",
    highlight: "Sinais melhores para timing de compra.",
    requirementRefs: ["RF-12"],
  },
  {
    id: "score",
    title: "Score de oportunidade",
    description:
      "O STARTER inclui score básico e o PRO aprofunda a análise para priorizar oportunidades com mais contexto.",
    highlight: "Prioridade visual para o que parece mais relevante.",
    requirementRefs: ["RF-12"],
  },
  {
    id: "seasonality",
    title: "Sazonalidade detectada",
    description:
      "No PRO, sinais de sazonalidade ajudam a avaliar se a demanda pode variar por período ou campanha.",
    highlight: "Mais contexto para compras estratégicas.",
    requirementRefs: ["RF-12"],
  },
  {
    id: "volume",
    title: "Sugestão de volume",
    description:
      "No PRO, sugestões de volume apoiam decisões de compra sem garantir revenda, lucro ou disponibilidade da oferta.",
    highlight: "Planejamento com dados e limites claros.",
    requirementRefs: ["RF-12", "RF-19"],
  },
];

export const PUBLIC_PLAN_CARDS: PublicPlanCard[] = [
  {
    id: "free",
    name: "FREE",
    price: "R$0",
    period: "/mês",
    subtitle: "Para validar o Avisus sem compromisso.",
    accent: "#7B42C9",
    features: [
      "5 termos de interesse",
      "5 alertas por dia",
      "Scanner a cada 2h",
      "Histórico de 7 dias",
      "Alertas via Web e Telegram",
      "Lives para até 3 perfis monitorados",
    ],
    cta: MARKETING_LINKS.startFree,
    requirementRefs: ["RF-05", "RF-06", "RF-10", "RF-11", "RF-13", "RF-15"],
  },
  {
    id: "starter",
    name: "STARTER",
    price: "R$49",
    period: "/mês",
    subtitle: "Para revendedores ativos que precisam de mais frequência.",
    accent: "#D4A017",
    features: [
      "Até 20 termos de interesse",
      "Alertas ilimitados por dia",
      "Scanner a cada 30min",
      "Histórico e tendências de 30 dias",
      "Score básico de oportunidade",
      "Lives para até 15 perfis monitorados",
    ],
    cta: MARKETING_LINKS.starter,
    requirementRefs: ["RF-05", "RF-06", "RF-10", "RF-11", "RF-12", "RF-13", "RF-15"],
  },
  {
    id: "pro",
    name: "PRO",
    price: "R$99",
    period: "/mês",
    subtitle: "Para comprar com mais contexto, velocidade e estratégia.",
    accent: "#2E8B57",
    featured: true,
    features: [
      "Termos de interesse ilimitados",
      "Alertas ilimitados por dia",
      "Scanner a cada 5min",
      "Histórico e tendências de 90 dias",
      "Score inteligente, sazonalidade e sugestão de volume",
      "Lives para perfis monitorados ilimitados",
    ],
    cta: MARKETING_LINKS.planPro,
    requirementRefs: ["RF-05", "RF-06", "RF-10", "RF-11", "RF-12", "RF-13", "RF-14", "RF-15"],
  },
];

export const MARKETING_TRUST_ITEMS: MarketingTrustItem[] = [
  {
    title: "Garantia de 7 dias",
    description: "Teste os planos pagos com garantia de 7 dias para avaliar se o Avisus faz sentido no seu fluxo.",
    requirementRefs: ["RF-16"],
  },
  {
    title: "Pagamento seguro",
    description: "A contratação é processada em ambiente seguro, sem expor dados sensíveis na URL.",
    requirementRefs: ["RF-16"],
  },
  {
    title: "Cancele quando quiser",
    description: "A assinatura pode ser cancelada quando não fizer mais sentido para sua operação.",
    requirementRefs: ["RF-16"],
  },
];

export const MARKETING_TESTIMONIALS: MarketingTestimonial[] = [
  {
    name: "Rafael M.",
    role: "Revendedor de eletrônicos",
    plan: "PRO",
    quote:
      "O Avisus me ajuda a priorizar ofertas com margem estimada antes de decidir se vale comprar.",
    requirementRefs: ["RF-17", "RF-19"],
  },
  {
    name: "Camila S.",
    role: "Lojista online",
    plan: "STARTER",
    quote:
      "Com alertas mais frequentes, deixei de depender de checar marketplace manualmente o dia todo.",
    requirementRefs: ["RF-17"],
  },
  {
    name: "Andre L.",
    role: "Revendedor multicanal",
    plan: "PRO",
    quote:
      "Histórico, score e tendências deixam a decisão de compra mais organizada e menos impulsiva.",
    requirementRefs: ["RF-17", "RF-19"],
  },
];

export const MARKETING_FAQS: MarketingFaq[] = [
  {
    question: "Como os alertas funcionam?",
    answer:
      "O Avisus compara seus interesses com oportunidades monitoradas e envia alertas pelos canais disponíveis no seu plano, como Web, Telegram e WhatsApp.",
    requirementRefs: ["RF-09", "RF-18"],
  },
  {
    question: "Quais marketplaces são monitorados?",
    answer:
      "A plataforma monitora marketplaces e fontes comerciais usados por revendedores, incluindo ofertas recorrentes e lives em Shopee e TikTok quando configuradas.",
    requirementRefs: ["RF-05", "RF-10", "RF-18"],
  },
  {
    question: "Qual a diferença entre FREE, STARTER e PRO?",
    answer:
      "A diferença está principalmente em frequência do scanner, limites de interesses, janelas de histórico, recursos avançados e monitoramento de lives. O PRO tem maior destaque por unir scanner a cada 5min, termos ilimitados e análise avançada.",
    requirementRefs: ["RF-05", "RF-06", "RF-11", "RF-12", "RF-13", "RF-14", "RF-18"],
  },
  {
    question: "Existe garantia?",
    answer:
      "Sim. Os planos pagos têm garantia de 7 dias para você avaliar a experiência com mais segurança.",
    requirementRefs: ["RF-16", "RF-18"],
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim. Você pode cancelar quando quiser, sem fidelidade obrigatória para continuar usando o Avisus.",
    requirementRefs: ["RF-16", "RF-18"],
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "O Avisus usa rotas internas de login e cadastro, não coloca dados sensíveis em query string e respeita as políticas de segurança da plataforma.",
    requirementRefs: ["RF-18"],
  },
  {
    question: "O Avisus garante lucro na revenda?",
    answer:
      "Não. O Avisus não garante lucro, revenda nem disponibilidade contínua das ofertas. A plataforma apoia sua decisão com dados, margem estimada e alertas acionáveis.",
    requirementRefs: ["RF-18", "RF-19"],
  },
];

export const MARKETING_FINAL_CTA = {
  eyebrow: "Pronto para monitorar com mais velocidade?",
  title: "Assine o PRO e acompanhe oportunidades com scanner a cada 5 minutos.",
  description:
    "Comece pelo plano que faz sentido para sua operação. O Avisus apoia sua decisão de compra com dados, sem prometer lucro garantido.",
  primaryCta: MARKETING_LINKS.finalPro,
  secondaryCta: MARKETING_LINKS.startFree,
  requirementRefs: ["RF-03", "RF-04", "RF-14", "RF-15", "RF-19"],
};

export const MARKETING_CONTENT = {
  links: MARKETING_LINKS,
  events: MARKETING_EVENTS,
  hero: MARKETING_HERO,
  features: MARKETING_FEATURES,
  plans: PUBLIC_PLAN_CARDS,
  trustItems: MARKETING_TRUST_ITEMS,
  testimonials: MARKETING_TESTIMONIALS,
  faqs: MARKETING_FAQS,
  finalCta: MARKETING_FINAL_CTA,
};
