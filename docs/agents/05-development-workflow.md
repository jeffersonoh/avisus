# 05-development-workflow.md: Workflow de Desenvolvimento

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboracao com IA
> **Relacionado:** [02-technology-stack.md](02-technology-stack.md) | [04-coding-standards.md](04-coding-standards.md)

## Visao Geral

Workflow do projeto no estado atual: Next.js 15 com deploy na Vercel e banco no Supabase.

## Setup inicial

```bash
npm install
npm run db:start
cp .env.local.example .env.local
npm run db:types
npm run dev
```

## Comandos diarios

```bash
# App
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck

# Supabase local
npm run db:start
npm run db:stop
npm run db:status
npm run db:migrate:auto
npm run db:types
npx supabase db push

# Testes
npm test
npm run test:integration
npm run test:e2e
```

## Ambientes

| Ambiente | App | DB | Cron |
|----------|-----|----|------|
| **Local** | `next dev` (localhost:3000) | Supabase local via Docker | Trigger manual via curl |
| **Staging** | Vercel Preview | Supabase staging | Trigger manual recomendado |
| **Producao** | Vercel Production (`avisus.app`) | Supabase prod | Ativo via `vercel.json` |

## CI/CD

```text
git push main   -> Vercel build -> deploy producao
git push branch -> Vercel preview deploy
```

- Sem GitHub Actions dedicado
- Migrations com execucao automatica no `prebuild` via `npm run db:migrate:auto` (com dry-run e validacao de pendencias)

## Vercel Cron (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/scan", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/live", "schedule": "*/2 * * * *" },
    { "path": "/api/cron/hot", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/cleanup", "schedule": "0 6 * * *" }
  ]
}
```

## Variaveis de ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_PRO_MONTHLY=

# Scanner
SCRAPINGBEE_API_KEY=
MAGALU_SCRAPE_MODE=managed
MERCADO_LIVRE_SCRAPE_MODE=managed

# Live monitor
APIFY_TOKEN=
APIFY_TIKTOK_ACTOR_ID=
APIFY_SHOPEE_ACTOR_ID=
ENABLE_SHOPEE_LIVE=true
ENABLE_TIKTOK_LIVE=true

# Alertas
TELEGRAM_BOT_TOKEN=
ENABLE_TELEGRAM_ALERTS=true

# Cron
CRON_SECRET=
ENABLE_SCANNER_CRON=true

# Observabilidade
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_APP_ENV=development
```

## Feature flags

| Flag | Padrao | Efeito |
|------|--------|--------|
| `MAGALU_SCRAPE_MODE` | `managed` | `api` / `managed` / `disabled` |
| `MERCADO_LIVRE_SCRAPE_MODE` | `managed` | `managed` / `disabled` |
| `ENABLE_SHOPEE_LIVE` | `true` | Habilita checks Shopee |
| `ENABLE_TIKTOK_LIVE` | `true` | Habilita checks TikTok |
| `ENABLE_TELEGRAM_ALERTS` | `true` | Liga/desliga envio Telegram |
| `ENABLE_SCANNER_CRON` | `true` | Liga/desliga execucao do scanner |

## Rollback

- **App:** rollback pelo historico de deploys na Vercel
- **DB:** rollback via migration corretiva ou script SQL de reversao

## Checklist pos-deploy

- [ ] Login/registro funcionando
- [ ] Dashboard exibindo oportunidades
- [ ] `/api/cron/*` respondendo com auth correta
- [ ] Stripe checkout e webhook funcionando
- [ ] Alertas web/Telegram funcionando conforme configuracao
- [ ] Sentry recebendo eventos sem PII sensivel

---

*Retornar ao [Indice Principal](AGENTS.md) | Anterior: [04-coding-standards.md](04-coding-standards.md) | Proximo: [06-domain-model.md](06-domain-model.md)*
