# Avisus

Plataforma de inteligência de preços para revendedores brasileiros. Rastreia ofertas e descontos em marketplaces (Mercado Livre, Magazine Luiza, Shopee), calcula margem estimada por canal de revenda e notifica oportunidades em tempo real via Telegram e dashboard web. Inclui detecção de início de transmissões ao vivo (Shopee/TikTok) de vendedores favoritos.

## Índice

- [Objetivo](#objetivo)
- [Estado Atual](#estado-atual)
- [Uso](#uso)
- [Tecnologias](#tecnologias)
- [Setup](#setup)
- [Conseguindo Ajuda](#conseguindo-ajuda)
- [Contribuindo](#contribuindo)
- [Decisões Arquiteturais (ADR)](#decisões-arquiteturais-adr)
- [Documentação para Assistentes de IA](#documentação-para-assistentes-de-ia)

## Objetivo

Revendedores que compram produtos com desconto para revender enfrentam fragmentação das fontes de oportunidade: cupons, promoções-relâmpago e descontos surgem e desaparecem rapidamente em múltiplos marketplaces. O Avisus automatiza essa vigilância.

- **Scanner** varre marketplaces (5 min PRO, 30 min STARTER, 2h FREE)
- **Margem estimada** calcula custo de aquisição (preço + frete) e a melhor margem líquida por canal de revenda
- **Notificação push** via Telegram com dados acionáveis (custo, margem, qualidade, link direto)
- **Live Monitor** detecta início de transmissões ao vivo (Shopee/TikTok) em até 2 minutos

Modelo de negócio **freemium** em três camadas: FREE, STARTER e PRO.

- **Público-alvo:** revendedores pessoa física ou microempreendedores ("Carlos, o Revendedor")
- **Custo operacional planejado:** ~US$ 69/mês (Vercel Pro + ScrapingBee + serviços gratuitos)
- **Idioma da UI:** português do Brasil

## Estado Atual

O projeto está em **transição de protótipo para produção**:

- **Protótipo funcional** (atual) — React 19 + Vite 8, monolito em `src/prototype.jsx` (~5.200 linhas JSX) com UI completa, dados mock e design system já aplicado. Serve como referência visual e comportamental.
- **Destino planejado** — Next.js 15 (App Router) + TypeScript strict + Supabase (Auth + Postgres + RLS) + Stripe + Vercel Cron, conforme a Tech Spec aprovada em `.tasks/avisus-mvp/tech-spec.md`.

A migração do protótipo para a stack alvo está documentada em `docs/agents/03-architecture.md` (mapa protótipo → produção) e em [docs/adrs/003_migracao_nextjs_app_router.md](docs/adrs/003_migracao_nextjs_app_router.md).

## Uso

Aplicação web acessada pelo revendedor:

1. Cadastro e login (Supabase Auth planejado; protótipo usa mock)
2. Onboarding em três passos: dados pessoais, canais de revenda, termos de interesse
3. Dashboard de oportunidades com filtros, ordenação e ações "Comprei" / "Não tenho interesse"
4. Alertas automáticos via Telegram e lista no app
5. Gestão de vendedores favoritos com detecção de lives
6. Upgrade de plano via Stripe Checkout

Fluxos detalhados em `docs/agents/01-project-overview.md` e `docs/agents/06-domain-model.md`.

## Tecnologias

### Protótipo (estado atual)

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 19.2.5 | Biblioteca de UI |
| Vite | 8.0.8 | Build e dev server |
| Node.js | ≥ 20 | Runtime de desenvolvimento |

### Stack Alvo (Tech Spec)

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js (App Router) | 15 | Framework full-stack (SSR + Route Handlers + Server Actions) |
| TypeScript | strict | Type-safety em todo o projeto |
| Tailwind CSS | 4+ | Estilização utility-first |
| TanStack Query | 5 | Cache e mutations no client |
| Zod | — | Validação de schemas |
| Supabase | Postgres 15+ | Auth + DB + RLS + tipos gerados |
| Stripe | — | Assinaturas STARTER/PRO |
| ScrapingBee | Freelance | JS rendering para Magazine Luiza |
| Telegram Bot API | — | Notificações push |
| Vercel | Pro | Hospedagem + Cron Functions |
| Sentry | Developer | Error tracking |
| Vitest + Playwright | — | Testes unitários e E2E |

A descrição completa da stack alvo está em `docs/agents/02-technology-stack.md`.

## Setup

### Protótipo (hoje)

Pré-requisitos: Node.js ≥ 20 e npm.

```bash
git clone <repo-url> avisus
cd avisus
npm install
npm run dev
```

A UI abre em `http://localhost:5173/`.

Para rodar o Vite em segundo plano (wrapper em `scripts/vite-ctl.mjs`):

```bash
npm run start    # inicia e grava PID em .run/vite-dev.pid
npm run stop     # envia SIGTERM ao PID registrado
npm run restart
```

### Stack Alvo (planejado)

Instruções completas de setup para a stack alvo (Next.js + Supabase local via Docker, geração de tipos, variáveis de ambiente, testes e scanner pipeline) em [docs/guia-do-desenvolvedor.md](docs/guia-do-desenvolvedor.md).

## Conseguindo Ajuda

- **Owner / ponto focal:** Jefferson Henrique (solo dev)
- **Para entender o produto:** comece por `docs/agents/01-project-overview.md`
- **Para entender a arquitetura:** `docs/agents/03-architecture.md`
- **Para entender decisões:** [docs/adrs/](docs/adrs/README.md)
- **Para problemas conhecidos e feature flags:** `docs/agents/12-troubleshooting.md`
- **Para especificação completa do MVP:** `.tasks/avisus-mvp/prd.md` e `.tasks/avisus-mvp/tech-spec.md`

## Contribuindo

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para convenções de branch e mensagens de commit. O projeto segue padrões de código descritos em `docs/agents/04-coding-standards.md` (TypeScript strict, Tailwind only, validação Zod, enforcement de limites no backend).

## Decisões Arquiteturais (ADR)

Decisões arquiteturais relevantes estão registradas em [docs/adrs/](docs/adrs/README.md) no formato ADR. Começam em `001` e devem ser consultadas antes de mudanças estruturais.

## Documentação para Assistentes de IA

Este repositório possui um módulo dedicado a colaboração com assistentes de IA em [`docs/agents/`](docs/agents/AGENTS.md). Ele contém o índice canônico (`AGENTS.md`) referenciado pelos symlinks `AGENTS.md`, `CLAUDE.md` e `GEMINI.md` na raiz, além de 13 arquivos temáticos cobrindo visão geral, stack, arquitetura, padrões, segurança, performance, integrações e troubleshooting.

> Este documento não substitui `docs/agents/AGENTS.md` — ele é apenas o ponto de entrada humano do projeto.
