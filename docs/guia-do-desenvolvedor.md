# Guia do Desenvolvedor

Este guia descreve o fluxo de desenvolvimento do Avisus com base no estado atual do repositorio (Next.js 15 + Supabase).

## Pre-requisitos

| Ferramenta | Versao recomendada | Observacao |
|---|---|---|
| Node.js | 20 (`.nvmrc`) | Runtime local |
| npm | 10+ | Gerenciador de dependencias |
| Docker | 24+ | Necessario para Supabase local |
| Git | 2.40+ | Controle de versao |

## Setup inicial

```bash
npm install
cp .env.local.example .env.local
npm run db:start
npm run db:types
npm run dev
```

App local: `http://localhost:3000`.

## Comandos do dia a dia

```bash
# App
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck

# Testes
npm test
npm run test:integration
npm run test:e2e

# Supabase local
npm run db:start
npm run db:stop
npm run db:status
npm run db:types
```

## Ambientes

| Ambiente | App | Banco | Cron |
|---|---|---|---|
| Local | `next dev` em `localhost:3000` | Supabase local via Docker | Disparo manual via curl |
| Staging | Vercel Preview | Supabase de staging | Preferencialmente manual |
| Producao | Vercel Production | Supabase de producao | Ativo via `vercel.json` |

## Variaveis de ambiente

Use `.env.local.example` (ou `.env.example`) como base.

### Obrigatorias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`

### Scanner e live monitor

- `SCRAPINGBEE_API_KEY`
- `MAGALU_SCRAPE_MODE` (`api`, `managed`, `disabled`)
- `MERCADO_LIVRE_SCRAPE_MODE` (`managed`, `disabled`)
- `APIFY_TOKEN`
- `APIFY_TIKTOK_ACTOR_ID`
- `APIFY_SHOPEE_ACTOR_ID`

### Feature flags

- `ENABLE_SCANNER_CRON`
- `ENABLE_TELEGRAM_ALERTS`
- `ENABLE_SHOPEE_LIVE`
- `ENABLE_TIKTOK_LIVE`

### Observabilidade

- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_APP_ENV`

Regra importante: variaveis `NEXT_PUBLIC_*` sao expostas no browser.

## Cron local (manual)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/scan
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/live
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/hot
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/cleanup
```

## Fluxo de deploy

```text
git push main      -> Vercel build -> deploy producao
git push <branch>  -> Vercel preview deploy
```

Antes de deploy, use:

- `docs/deploy-checklist.md`
- `docs/runbook.md`

## Padrões de codigo

- TypeScript strict (sem `any`)
- Validacao com Zod nas entradas
- Regras de plano validadas no backend
- Supabase client correto por contexto (server/browser/service)
- Estilo hibrido do projeto: CSS variables + inline styles + Tailwind para layout/responsividade

Referencia detalhada: `docs/agents/04-coding-standards.md`.
