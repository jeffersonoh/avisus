# Avisus

Plataforma de inteligencia de precos para revendedores brasileiros. O Avisus monitora oportunidades em marketplaces, estima margem de revenda por canal e envia alertas via web/Telegram.

## Estado atual

O projeto roda hoje em **Next.js 15 + TypeScript + Supabase**.

- Scanner de ofertas: Mercado Livre + Magazine Luiza
- Live monitor: Shopee + TikTok (via Apify)
- Auth: Supabase (email/senha + callback OAuth)
- Billing: Stripe Checkout + webhook
- Cron: Vercel (`/api/cron/*`)

O arquivo `src/prototype.jsx` continua no repositorio como referencia historica de UX, mas o runtime principal e o App Router em `src/app/`.

## Rotas principais

- Publicas: `/login`, `/registro`, `/auth/callback`
- App autenticado: `/dashboard`, `/interesses`, `/alertas`, `/favoritos`, `/perfil`, `/perfil/margem`, `/planos`
- Onboarding: `/onboarding`

## Endpoints de backend

- Cron: `/api/cron/scan`, `/api/cron/live`, `/api/cron/hot`, `/api/cron/cleanup`
- Stripe webhook: `/api/stripe/webhook`
- Live click tracking: `/api/live-click/[id]`

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend/BFF | Next.js 15 (App Router), React 19, TypeScript strict |
| Dados/Auth | Supabase (`@supabase/ssr`, Postgres, RLS) |
| Scanner | Cheerio + ScrapingBee |
| Live monitor | Apify actors |
| Billing | Stripe |
| Observabilidade | Sentry |
| Testes | Vitest + Playwright |

## Setup local

Pre-requisitos:

- Node 20 (ver `.nvmrc`)
- npm
- Docker (para Supabase local)

```bash
npm install
cp .env.local.example .env.local
npm run db:start
npm run db:types
npm run dev
```

App local: `http://localhost:3000`.

## Scripts mais usados

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
```

Supabase local:

```bash
npm run db:start
npm run db:stop
npm run db:status
npm run db:types
```

## Variaveis de ambiente

Use `.env.local.example` como base no desenvolvimento local. Para deploy, configure no painel da Vercel.

### Obrigatorias para funcionamento principal

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

### Integracoes

- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`
- Scanner: `SCRAPINGBEE_API_KEY`, `MAGALU_SCRAPE_MODE`, `MERCADO_LIVRE_SCRAPE_MODE`
- Live monitor: `APIFY_TOKEN`, `APIFY_TIKTOK_ACTOR_ID`, `APIFY_SHOPEE_ACTOR_ID`
- Alertas: `TELEGRAM_BOT_TOKEN`, `ENABLE_TELEGRAM_ALERTS`
- Sentry: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

## Cron jobs (Vercel)

Definidos em `vercel.json`:

- `/api/cron/scan`: `*/5 * * * *`
- `/api/cron/live`: `*/2 * * * *`
- `/api/cron/hot`: `*/15 * * * *`
- `/api/cron/cleanup`: `0 6 * * *` (UTC)

## Deploy

Antes de publicar, use o checklist:

- `docs/deploy-checklist.md`
- `docs/runbook.md`

## Documentacao

- Guia de desenvolvimento: `docs/guia-do-desenvolvedor.md`
- ADRs: `docs/adrs/README.md`
- Padroes para IA: `docs/agents/AGENTS.md`

## Contribuicao

Veja `CONTRIBUTING.md` para padrao de branch, commit e validacoes locais.
