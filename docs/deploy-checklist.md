# Deploy checklist (Vercel)

Checklist curto para validar o deploy de producao do Avisus na Vercel.

## 1) Build e ambiente

- [ ] Build local passou: `npm run build`
- [ ] Versao do Node compativel (`>=18`, conforme `package.json`)
- [ ] `NEXT_PUBLIC_SITE_URL` definido com dominio de producao (`https://...`)

## 2) Variaveis obrigatorias

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `CRON_SECRET`

## 3) Variaveis de pagamentos (Stripe)

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRICE_STARTER_MONTHLY`
- [ ] `STRIPE_PRICE_PRO_MONTHLY`

## 4) Variaveis de scanner e live monitor

- [ ] `SCRAPINGBEE_API_KEY`
- [ ] `APIFY_TOKEN`
- [ ] `APIFY_TIKTOK_ACTOR_ID`
- [ ] `APIFY_SHOPEE_ACTOR_ID`

## 5) Feature flags

- [ ] `ENABLE_SCANNER_CRON`
- [ ] `ENABLE_TELEGRAM_ALERTS`
- [ ] `ENABLE_SHOPEE_LIVE`
- [ ] `ENABLE_TIKTOK_LIVE`

## 6) Observabilidade (Sentry)

- [ ] `SENTRY_DSN`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `SENTRY_ORG`
- [ ] `SENTRY_PROJECT`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `NEXT_PUBLIC_APP_ENV=production`

## 7) Crons na Vercel

Validar se os crons declarados em `vercel.json` estao ativos:

- [ ] `/api/cron/scan` -> `*/5 * * * *`
- [ ] `/api/cron/live` -> `*/2 * * * *`
- [ ] `/api/cron/hot` -> `*/15 * * * *`
- [ ] `/api/cron/cleanup` -> `0 6 * * *`

## 8) Integracoes externas

- [ ] Supabase Auth com redirect de producao: `https://<dominio>/auth/callback`
- [ ] Webhook Stripe apontando para `https://<dominio>/api/stripe/webhook`

## 9) Smoke test pos deploy

- [ ] Login e registro funcionando
- [ ] Dashboard carregando sem erro
- [ ] Perfil e Margem salvando com sucesso
- [ ] Endpoint de webhook Stripe respondendo (evento de teste)
- [ ] Eventos de erro chegando no Sentry (se habilitado)

## 10) Comandos uteis

```bash
# build local de validacao
npm run build

# opcional: lint e testes
npm run lint
npm run test
```
