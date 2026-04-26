# 09-integrations.md: Integracoes Externas

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboracao com IA
> **Relacionado:** [03-architecture.md](03-architecture.md) | [12-troubleshooting.md](12-troubleshooting.md)

## Visao Geral

As integracoes do Avisus rodam no backend Next.js (Route Handlers/Server Actions) e em cron jobs da Vercel.

## 1. Scanner de ofertas (Mercado Livre + Magazine Luiza)

| Item | Detalhe |
|------|---------|
| Implementacao | `src/lib/scanner/mercado-livre.ts` e `src/lib/scanner/magazine-luiza.ts` |
| Metodo | Scraping via ScrapingBee + parsing com Cheerio |
| Execucao | `/api/cron/scan` |
| Env vars | `SCRAPINGBEE_API_KEY`, `MAGALU_SCRAPE_MODE`, `MERCADO_LIVRE_SCRAPE_MODE` |

### Modos de scraping

- `MAGALU_SCRAPE_MODE`: `api`, `managed`, `disabled`
- `MERCADO_LIVRE_SCRAPE_MODE`: `managed`, `disabled`

## 2. Telegram Bot API

| Item | Detalhe |
|------|---------|
| API | `https://api.telegram.org/bot{token}/sendMessage` |
| Uso | Alertas de oportunidades e lives |
| Execucao | Scanner (`/api/cron/scan`) e live monitor (`/api/cron/live`) |
| Conexao usuario | Deep link do bot + webhook `/api/telegram/webhook`; entrega usa `telegram_chat_id`, nao `@username` |
| Feature flag | `ENABLE_TELEGRAM_ALERTS` |
| Env vars | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` |

## 3. Live Monitor (Shopee/TikTok)

| Item | Detalhe |
|------|---------|
| Implementacao | `src/lib/scanner/live/` |
| Metodo | Execucao de actors Apify via `run-sync-get-dataset-items` |
| Polling | `/api/cron/live` a cada 2 minutos |
| Feature flags | `ENABLE_SHOPEE_LIVE`, `ENABLE_TIKTOK_LIVE` |
| Env vars | `APIFY_TOKEN`, `APIFY_SHOPEE_ACTOR_ID`, `APIFY_TIKTOK_ACTOR_ID` |

## 4. Stripe (planos STARTER/PRO)

| Item | Detalhe |
|------|---------|
| Checkout | Server Action cria sessao Stripe |
| Webhook | `/api/stripe/webhook` |
| Planos | Mapeados por `STRIPE_PRICE_STARTER_MONTHLY` e `STRIPE_PRICE_PRO_MONTHLY` |
| Env vars | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY` |

## 5. IBGE (localidades)

| Item | Detalhe |
|------|---------|
| API | `servicodados.ibge.gov.br/api/v1/localidades` |
| Uso | Estados e cidades no onboarding/perfil |

## 6. Supabase Auth + DB + Realtime

| Item | Detalhe |
|------|---------|
| Auth | Email/senha + callback OAuth |
| Sessao | Cookies via `@supabase/ssr` e middleware |
| Realtime | Atualizacao de alertas web/badge de nao lidos |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

## 7. Sentry

| Item | Detalhe |
|------|---------|
| Integracao | `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx` |
| Uso | Captura de erros server/client e filtros de PII |
| Env vars | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_APP_ENV` |

## Resumo de variaveis por integracao

| Integracao | Variaveis |
|-----------|-----------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Scanner | `SCRAPINGBEE_API_KEY`, `MAGALU_SCRAPE_MODE`, `MERCADO_LIVRE_SCRAPE_MODE` |
| Live monitor | `APIFY_TOKEN`, `APIFY_SHOPEE_ACTOR_ID`, `APIFY_TIKTOK_ACTOR_ID`, `ENABLE_SHOPEE_LIVE`, `ENABLE_TIKTOK_LIVE` |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `ENABLE_TELEGRAM_ALERTS` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY` |
| Cron | `CRON_SECRET`, `ENABLE_SCANNER_CRON` |
| Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_APP_ENV` |

---

*Retornar ao [Indice Principal](AGENTS.md) | Anterior: [08-performance.md](08-performance.md) | Proximo: [10-data-management.md](10-data-management.md)*
