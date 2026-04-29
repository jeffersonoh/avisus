# 02-technology-stack.md: Stack Tecnológica

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [03-architecture.md](03-architecture.md) | [05-development-workflow.md](05-development-workflow.md)

## Visão Geral

Stack serverless-first com 4 serviços gerenciados pagos (Vercel, Supabase, ScrapingBee, Stripe) + APIs gratuitas (Telegram, IBGE), otimizada para solo dev com custo mínimo. Todo o código (frontend, BFF, scanner, live monitor) roda como Next.js 15 App Router na Vercel.

## Frontend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| **Next.js** | 15 (App Router) | Framework full-stack (SSR + Client Components + Route Handlers) |
| **React** | 19 | Biblioteca de UI |
| **TypeScript** | strict mode | Type-safety em todo o projeto |
| **Tailwind CSS** | 3.4.x | Utilitarios de layout e responsividade |
| **TanStack Query** | v5 (React Query) | Cache, mutations e revalidação em Client Components |
| **Zod** | — | Validação de schemas em Server Actions e Route Handlers |

### Design System

- **Fonte:** Montserrat (display + body)
- **Paleta:** Navy (#1B2E63), Teal (#1D8F95), Lime (#B7DB47), Purple (#7B42C9)
-- **Tema:** Light/Dark via classe `html.dark` + CSS variables
- **Componentes shared:** Badge, Toggle, Chip, StatCard, AppIcon, BottomSheet, Toast, MiniSparkline
- **Referência completa:** `docs/design-system.md`

## Backend / BFF

| Tecnologia | Uso |
|-----------|-----|
| **Next.js Route Handlers** | API endpoints (`/api/stripe/webhook`, `/api/cron/*`) |
| **Next.js Server Actions** | Mutations (CRUD interesses, perfil, favoritos) |
| **Next.js Server Components** | Data fetching no servidor (dashboard, listas) |
| **Vercel Cron** | Agendamento dos scanner pipelines |

## Banco de Dados e Auth

| Serviço | Plano | Uso |
|---------|-------|-----|
| **Supabase** (PostgreSQL 15+) | Free (500 MB DB, 50K MAU) | Auth + DB + RLS + tipos gerados |
| `@supabase/ssr` | — | Client/server/middleware para Next.js 15 |
| `supabase gen types` | — | Geração de tipos TypeScript do schema |
| `pg_trgm` | extensão | Busca textual por similaridade (matching de interesses) |

### Acesso a Dados

- **Server Components:** `createServerClient()` (cookies)
- **Client Components:** `createBrowserClient()`
- **Scanner Functions:** `createServiceRoleClient()` com `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS)

**Decisão:** Supabase JS client ao invés de ORM (Drizzle/Prisma). Bundling Auth + DB + RLS + SDK economiza setup. Tipos gerados por `supabase gen types typescript`.

## Serviços Externos

| Serviço | Plano / Custo | Responsabilidade |
|---------|--------------|-----------------|
| **Vercel** | Pro ($20/mês) | Frontend + BFF + Scanner Functions + Cron (até 100 jobs, 800s timeout) |
| **ScrapingBee** | Freelance ($49/mês) | JS rendering + proxies + anti-bot para Mercado Livre e Magazine Luiza |
| **Stripe** | Pay-as-you-go ($0 fixo) | Assinaturas STARTER/PRO (Checkout + webhooks) |
| **Telegram Bot API** | Gratuito | Notificações push (ofertas + lives) |
| **Apify** | Pay-as-you-go | Execucao de actors para detectar live Shopee/TikTok (F14) |
| **IBGE Localidades API** | Gratuito | Lista de estados/cidades para perfil |
| **Mercado Livre listagem pública** | Via ScrapingBee | Scanner de ofertas por termo |

### Integrações Futuras (pós-MVP)

| Serviço | Responsabilidade | Prioridade PRD |
|---------|-----------------|----------------|
| **WhatsApp Business API** (ou Evolution API) | Notificações push alternativas ao Telegram | Should Have |
| **Shopee API** (ofertas) | Terceiro marketplace no scanner | Should Have |

## Observabilidade

| Ferramenta | Plano | Uso |
|-----------|-------|-----|
| **Sentry** | Developer (grátis, 5K events/mês) | Error tracking frontend + functions |
| **Vercel Analytics** | Free | Web Vitals (LCP, FID, CLS) |
| **Vercel Logs** | Incluído no Pro | Logs estruturados JSON das functions |

## Testes

| Ferramenta | Uso |
|-----------|-----|
| **Vitest** | Testes unitários (margin-calculator, plan-limits, live-monitor, componentes) |
| **Playwright** | Testes E2E (cadastro → dashboard, Stripe test mode) |
| **Supabase local** | `npm run db:start` (Docker) para testes de integração |

## Dependências Planejadas (package.json pós-migração)

```
next, react, react-dom
@supabase/supabase-js, @supabase/ssr
@tanstack/react-query
@stripe/stripe-js, stripe
zod
cheerio (parsing HTML dos marketplaces)
tailwindcss, @tailwindcss/typography
@sentry/nextjs
```

**Dev:**
```
typescript, @types/react, @types/node
vitest, @playwright/test
supabase (CLI)
```

## Evidências do Codebase

- `package.json` — Dependencias e scripts do runtime atual (Next.js 15 + React 19)
- `next.config.ts` — Integracao de build com Sentry
- `docs/design-system.md` — Tokens visuais, componentes, paleta, tipografia

## Decisões e Alternativas

| Decisão | Escolha | Alternativas descartadas |
|---------|---------|------------------------|
| DB + Auth | Supabase | Neon + Auth.js (mais setup, sem RLS integrado) |
| ORM | Supabase JS client | Drizzle (overhead), Prisma (cold start, engine 2 MB) |
| Auth | Supabase Auth | Auth.js v5 (sem RLS), Clerk (custo) |
| Scraping ML/Magalu | ScrapingBee API | Playwright + Fly.io (Docker, VM, complexidade), APIs ML restritas |
| Fila | Vercel Cron direto | QStash (over-engineering para MVP) |
| Live detection | Polling cron */2 min | WebSocket (VM dedicada), Webhook (indisponível) |
| Cache | DB-only | Redis/Upstash (desnecessário até ~2.000 usuários) |

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [01-project-overview.md](01-project-overview.md) | Próximo: [03-architecture.md](03-architecture.md)*
