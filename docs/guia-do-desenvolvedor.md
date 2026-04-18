# Guia do Desenvolvedor

Este guia descreve o setup e o workflow diário para desenvolver no Avisus. Ele cobre dois contextos que convivem neste repositório: o **protótipo atual** (React 19 + Vite 8) e a **stack alvo** (Next.js 15 + Supabase) definida na Tech Spec. Até que a migração seja concluída, comandos de protótipo e de produção coexistem.

Para contexto de negócio, consulte `docs/agents/01-project-overview.md`. Para arquitetura detalhada, `docs/agents/03-architecture.md`.

## Pré-requisitos

| Ferramenta | Versão mínima | Observação |
|------------|---------------|------------|
| Node.js | 20 LTS | Runtime principal |
| npm | 10 | Empacotador padrão do Node |
| Docker | 24+ | Necessário apenas para Supabase local (stack alvo) |
| Git | 2.40+ | Controle de versão |
| Conta Vercel | — | Preview e produção |
| Conta Supabase | — | Projeto remoto staging/produção |

Contas adicionais para funcionalidades completas: Stripe (test mode), ScrapingBee, Telegram BotFather, Mercado Livre Devs (Client ID + Secret + Refresh Token), Sentry.

## Setup — Protótipo (atual)

```bash
git clone <repo-url> avisus
cd avisus
npm install
npm run dev
```

A UI é servida em `http://localhost:5173/`. O ponto de entrada é `src/main.jsx` que renderiza `src/prototype.jsx`.

### Vite em segundo plano

O repositório inclui um wrapper em `scripts/vite-ctl.mjs` para rodar o Vite como daemon:

```bash
npm run start     # inicia em background; grava PID em .run/vite-dev.pid
npm run stop      # envia SIGTERM ao PID registrado
npm run restart
```

Logs do servidor ficam em `.run/vite-dev.log`.

## Setup — Stack Alvo (planejada)

Assim que a migração para Next.js 15 for iniciada, o setup passa a ser:

```bash
npm install
npm run db:start                        # sobe Postgres + Auth local (Docker)
cp .env.local.example .env.local      # preencher variáveis
npm run db:types
npm run dev                            # Next.js em http://localhost:3000
```

### Comandos diários (stack alvo)

```bash
npm run dev          # Next.js dev server
npm run build        # Build de produção
npm start            # next start (servir build local)

# Supabase
npm run db:start
npm run db:stop
npm run db:status
npm run db:types
npx supabase db push

# Testes
npm test                  # Vitest — testes unitários (src/**/*.test.ts)
npm run test:integration  # Vitest — integração contra Supabase local (requer npm run db:start)
npm run test:e2e          # Playwright — fluxos E2E

# Cron local (exige CRON_SECRET no .env.local)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/scan
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/live
```

## Ambientes

| Ambiente | App | Banco de dados | Cron |
|----------|-----|----------------|------|
| **Local** | `next dev` em `localhost:3000` | Supabase local via Docker | Disparo manual via curl |
| **Staging** | Vercel Preview (deploy por branch) | Projeto Supabase de staging | Desativado (disparo manual) |
| **Produção** | `avisus.app` (Vercel Pro) | Projeto Supabase de produção | Ativo via `vercel.json` |

## Variáveis de Ambiente

Todas as variáveis são configuradas em `.env.local` (desenvolvimento) e no painel da Vercel (staging/produção). Ver também `docs/agents/05-development-workflow.md` e `docs/agents/09-integrations.md`.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
STRIPE_LIVE_MODE=false

# Telegram
TELEGRAM_BOT_TOKEN=
ENABLE_TELEGRAM_ALERTS=true

# Mercado Livre
ML_CLIENT_ID=
ML_CLIENT_SECRET=
ML_REFRESH_TOKEN=

# ScrapingBee
SCRAPINGBEE_API_KEY=
MAGALU_SCRAPE_MODE=managed

# Live Monitor
ENABLE_SHOPEE_LIVE=true
ENABLE_TIKTOK_LIVE=true

# Cron
CRON_SECRET=

# Observabilidade
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

**Regra absoluta:** variáveis com prefixo `NEXT_PUBLIC_*` são expostas ao browser. Nunca prefixe secrets com `NEXT_PUBLIC_`.

## Feature Flags

Flags de ambiente permitem degradar o sistema sem deploy. Referência completa em `docs/agents/12-troubleshooting.md`.

| Flag | Padrão | Efeito quando desativado |
|------|--------|--------------------------|
| `MAGALU_SCRAPE_MODE=disabled` | `managed` | Scanner opera apenas com Mercado Livre |
| `ENABLE_SHOPEE_LIVE=false` | `true` | Live Monitor pula Shopee |
| `ENABLE_TIKTOK_LIVE=false` | `true` | Live Monitor pula TikTok |
| `ENABLE_TELEGRAM_ALERTS=false` | `true` | Não envia alertas reais (dev/staging) |
| `STRIPE_LIVE_MODE=false` | `false` | Usa Stripe test mode |

## Testes

| Tipo | Ferramenta | Cobertura alvo |
|------|------------|----------------|
| Unitário | Vitest | `margin-calculator`, `opportunity-matcher`, `plan-limits`, `live-monitor`, componentes shared |
| Integração | Vitest + Supabase local | Onboarding, CRUD interesses, limites por plano, webhook Stripe |
| E2E | Playwright | Cadastro → Dashboard, checkout Stripe (test mode), envio Telegram (staging) |

## CI/CD

Pipeline enxuto sem GitHub Actions dedicado:

```text
git push main      → Vercel Git Integration → Build → Deploy produção
git push <branch>  → Vercel Preview Deploy (URL temporária)
```

- DB migrations aplicadas manualmente com `supabase db push` antes do deploy
- Rollback do app: 1 clique no dashboard Vercel (mantém deploys anteriores)
- Rollback do DB: script SQL de reversão por migração em `supabase/migrations/`

## Checklist Pós-Deploy

Ver `docs/agents/05-development-workflow.md#checklist-pós-deploy` para a lista completa (signup, onboarding, scanner, HOT, Telegram, Stripe, RLS cruzada, lives).

## Troubleshooting Rápido

| Sintoma | Hipótese primária | Onde investigar |
|---------|------------------|-----------------|
| Vite não sobe em `npm run start` | PID residual em `.run/vite-dev.pid` | Rodar `npm run stop` e reiniciar |
| Scanner não retorna ofertas | Token ML expirado ou ScrapingBee sem créditos | Vercel Logs + `docs/agents/12-troubleshooting.md` |
| Alertas Telegram não chegam | `ENABLE_TELEGRAM_ALERTS=false` ou `@username` inválido | `.env.local` + validação Zod no perfil |
| Live Monitor com muitas falhas | API interna Shopee/TikTok mudou | Ativar fallback ScrapingBee ou feature flag |
| RLS negando leitura esperada | Cliente errado (browser quando deveria ser server) | `docs/agents/04-coding-standards.md` seção Supabase Client |

Problemas e mitigações detalhadas em `docs/agents/12-troubleshooting.md`.

## Convenções de Código

- **TypeScript strict**, sem `any` (usar `unknown` + type guards)
- **Tailwind only** para estilização; sem CSS inline em componentes
- **Zod** validando toda entrada de usuário
- **Server Components por padrão**; Client Components apenas quando necessário (`'use client'`)
- **Server Actions** para mutações; validar sessão e limites de plano sempre no backend
- **Keyset pagination** em todas as listagens (nunca offset)
- **Naming:** componentes em PascalCase, utilitários em kebab-case, rotas em kebab-case português (`interesses/`, `alertas/`)

Lista completa em `docs/agents/04-coding-standards.md`.

## Commits

Formato `tipo(escopo): descrição` em português do Brasil. Ver [CONTRIBUTING.md](../CONTRIBUTING.md) para regras e exemplos.
