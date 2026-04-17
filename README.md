# Avisus

Plataforma de inteligência de preços para revendedores brasileiros. Rastreia ofertas e descontos em marketplaces (Mercado Livre, Magazine Luiza, Shopee), calcula margem estimada por canal de revenda e notifica oportunidades em tempo real via Telegram e dashboard web. Inclui detecção de início de transmissões ao vivo (Shopee/TikTok) de vendedores favoritos.

## Índice

- [Objetivo](#objetivo)
- [Estado Atual](#estado-atual)
- [Uso](#uso)
- [Tecnologias](#tecnologias)
- [Setup](#setup)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Tipos do Banco](#tipos-do-banco)
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

## Configuração de Ambiente

1. Copie o arquivo de exemplo:

```bash
cp .env.local.example .env.local
```

2. Preencha os valores reais no `.env.local`.
3. Nunca commite `.env.local` (o arquivo já está no `.gitignore`).

### Onde obter cada variável

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Project Settings > API (uso apenas servidor) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Developers > Webhooks |
| `STRIPE_PRICE_STARTER_MONTHLY` | Stripe Dashboard > Products > Price ID do plano STARTER |
| `STRIPE_PRICE_PRO_MONTHLY` | Stripe Dashboard > Products > Price ID do plano PRO |
| `TELEGRAM_BOT_TOKEN` | Telegram BotFather (`/newbot`) |
| `ML_CLIENT_ID` | Mercado Livre Developers (app credentials) |
| `ML_CLIENT_SECRET` | Mercado Livre Developers (app credentials) |
| `ML_REFRESH_TOKEN` | Fluxo OAuth do Mercado Livre |
| `SCRAPINGBEE_API_KEY` | ScrapingBee Dashboard |
| `MAGALU_SCRAPE_MODE` | Definido internamente (`api`, `managed`, `disabled`) |
| `CRON_SECRET` | Valor interno forte gerado pela equipe (usado no header Authorization) |
| `ENABLE_SCANNER_CRON` | Flag interna (`true`/`false`) para ligar/desligar `/api/cron/scan` |
| `ENABLE_TELEGRAM_ALERTS` | Flag interna (`true`/`false`) |
| `ENABLE_SHOPEE_LIVE` | Flag interna (`true`/`false`) |
| `ENABLE_TIKTOK_LIVE` | Flag interna (`true`/`false`) |
| `SENTRY_DSN` | Sentry > Project Settings > Client Keys (DSN) |
| `NEXT_PUBLIC_SITE_URL` | URL base do app (opcional; útil quando headers de proxy não expõem o host correto para OAuth) |

> Referência rápida: veja também `.env.local.example` para placeholders e comentários por variável.

### Supabase Auth — Google OAuth

1. No Supabase: **Authentication → Providers → Google** — habilite e informe Client ID / Secret do Google Cloud Console (tipo *Web application*).
2. Em **Authentication → URL Configuration**, inclua em **Redirect URLs**:
   - desenvolvimento: `http://localhost:3000/auth/callback`
   - produção: `https://<seu-dominio>/auth/callback`
3. O fluxo PKCE troca o `code` na rota interna `/auth/callback` e grava a sessão em cookies (mesmo padrão `@supabase/ssr` do restante do app).

### Stripe Checkout — modo teste

1. Configure no `.env.local`:
   - `STRIPE_SECRET_KEY` com chave `sk_test_...`
   - `STRIPE_PRICE_STARTER_MONTHLY` e `STRIPE_PRICE_PRO_MONTHLY` com IDs `price_...` de produtos recorrentes mensais
2. Inicie a aplicação (`npm run dev`) e acesse `http://localhost:3000/planos` com um usuário autenticado.
3. Clique em **Fazer upgrade** no plano desejado (STARTER ou PRO) para abrir o Stripe Checkout.
4. Use um cartão de teste do Stripe (ex.: `4242 4242 4242 4242`, validade futura, CVC qualquer).
5. Ao concluir, o Stripe redireciona para `/dashboard`. A mudança de plano depende do webhook (`/api/stripe/webhook`) processar o evento.

## Tipos do Banco

Após qualquer alteração de schema em `supabase/migrations/*.sql`, regenere os tipos TypeScript do banco:

```bash
npm run db:types
```

Isso atualiza `src/types/database.ts` com o schema local do Supabase e evita inconsistências entre banco e código.

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
