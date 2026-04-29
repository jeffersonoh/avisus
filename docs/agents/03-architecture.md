# 03-architecture.md: Arquitetura

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [02-technology-stack.md](02-technology-stack.md) | [06-domain-model.md](06-domain-model.md) | [09-integrations.md](09-integrations.md)

## Visão Geral

Arquitetura **serverless-first**: UI, auth, CRUD, scraping e alertas rodam como Vercel Functions. Nenhum servidor persistente. O scraping de Mercado Livre e Magazine Luiza é delegado ao ScrapingBee (JS rendering externo quando necessário).

## Diagrama de Alto Nível

```
┌──────────────────────────────────────────────────────────────┐
│                       VERCEL (Pro)                            │
│  Next.js 15 — App Router + TypeScript strict                 │
│                                                              │
│  /app (Frontend React — SSR + Client Components)             │
│  ├── Dashboard (oportunidades, filtros, cards, modal)        │
│  ├── Interesses (CRUD, limites por plano)                    │
│  ├── Alertas (lista, canais, silêncio)                       │
│  ├── Vendedores Favoritos (CRUD, status live, limites)       │
│  ├── Perfil (dados, IBGE, canais de revenda, LGPD)           │
│  ├── Planos (comparativo, Stripe Checkout)                   │
│  ├── Onboarding (wizard 3 passos)                            │
│  └── Login / Registro                                        │
│                                                              │
│  /app/api (BFF — Route Handlers + Scanner Functions)         │
│  ├── Stripe webhook                                          │
│  └── cron/                                                   │
│      ├── scan/route.ts    (maxDuration: 300s)                │
│      ├── live/route.ts    (maxDuration: 60s)                 │
│      ├── hot/route.ts     → RPC refresh_hot_flags()          │
│      └── cleanup/route.ts → expirar + reter                  │
│                                                              │
│  Vercel Cron (vercel.json)                                   │
│  └── */5  → /api/cron/scan                                   │
│  └── */2  → /api/cron/live                                   │
│  └── */15 → /api/cron/hot                                    │
│  └── 0 6  → /api/cron/cleanup                                │
└──────────┬───────────────────────────────────────────────────┘
           │
    ┌──────▼──────────────┐      ┌────────────────┐
    │   Supabase Cloud    │      │  ScrapingBee   │
    │  PostgreSQL 15+     │      │  (JS rendering)│
    │  + Auth + RLS       │      └────────────────┘
    │  + Generated Types  │      ┌────────────────┐
    └─────────────────────┘      │  Telegram Bot  │
                                 └────────────────┘
                                 ┌────────────────┐
                                 │  Stripe        │
                                 └────────────────┘
                                 ┌────────────────┐
                                  │ ScrapingBee/IBGE│
                                 └────────────────┘
                                 ┌────────────────┐
                                 │ Shopee/TikTok  │
                                 │ Live (polling) │
                                 └────────────────┘
```

## Estrutura de Diretórios

```
avisus/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # Root layout (Supabase provider, tema, fontes)
│   │   ├── page.tsx                    # Home institucional
│   │   ├── globals.css                 # Tailwind + tokens do design system
│   │   ├── (auth)/                     # Rotas públicas
│   │   │   ├── login/page.tsx
│   │   │   └── registro/page.tsx
│   │   ├── (app)/                      # Layout autenticado (shell + nav)
│   │   │   ├── layout.tsx              # Header, bottom nav, proteção de rota
│   │   │   ├── dashboard/page.tsx      # Server Component: fetch oportunidades
│   │   │   ├── interesses/page.tsx
│   │   │   ├── alertas/page.tsx
│   │   │   ├── favoritos/page.tsx      # Vendedores favoritos (F14)
│   │   │   ├── perfil/page.tsx
│   │   │   └── planos/page.tsx
│   │   ├── onboarding/page.tsx
│   │   └── api/
│   │       ├── stripe/webhook/route.ts
│   │       └── cron/
│   │           ├── scan/route.ts       # Scanner pipeline (300s)
│   │           ├── live/route.ts       # Live monitor (60s)
│   │           ├── hot/route.ts        # HOT flags
│   │           └── cleanup/route.ts    # Expirar + reter
│   ├── lib/
│   │   ├── supabase/                   # Clients (browser, server, middleware)
│   │   ├── stripe.ts                   # Stripe SDK wrapper
│   │   ├── plan-limits.ts             # Constantes FREE/STARTER/PRO
│   │   └── scanner/
│   │       ├── mercado-livre.ts        # Scraping ML via ScrapingBee
│   │       ├── magazine-luiza.ts       # ScrapingBee → Cheerio
│   │       ├── margin-calculator.ts    # F03: custo aquisição + margem/canal
│   │       ├── opportunity-matcher.ts  # Match oportunidades × interesses
│   │       ├── alert-sender.ts         # Telegram Bot API
│   │       ├── scraping-bee.ts         # ScrapingBee client wrapper
│   │       └── live/
│   │           ├── shopee-live.ts      # Actor Apify Shopee
│   │           ├── tiktok-live.ts      # Actor Apify TikTok
│   │           └── live-monitor.ts     # Orquestrador live
│   ├── features/                       # Feature modules (componentes + hooks)
│   │   ├── dashboard/
│   │   ├── interests/
│   │   ├── notifications/              # AlertNotifier + UnreadAlertsProvider (Realtime)
│   │   ├── favorites/
│   │   ├── profile/
│   │   ├── plans/
│   │   └── onboarding/
│   ├── components/                     # Shared / design system
│   └── types/
│       └── database.ts                 # Gerado por supabase gen types
├── supabase/
│   ├── migrations/                     # SQL migrations
│   └── config.toml                     # Supabase local dev config
├── src/middleware.ts                    # Next.js middleware (Supabase session)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                         # Cron schedules
└── .env.local.example
```

## Camadas da Aplicação

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|-----------------|
| **Apresentação** | React Server Components + Client Components | UI, interações, filtros |
| **BFF** | Next.js Server Actions + Route Handlers | Mutações, validação, Stripe webhook |
| **Scanner** | Vercel Functions (cron-triggered) | Scan marketplaces, margem, matching, alertas |
| **Live Monitor** | Vercel Function (cron */2 min) | Polling status de lives, alertas Telegram |
| **Dados** | Supabase PostgreSQL + RLS | Persistência, autorização, tipos gerados |
| **Auth** | Supabase Auth | Signup, login, OAuth, sessões JWT |

## Pipelines

### Scanner Pipeline (`/api/cron/scan` — a cada 5 min)

1. Buscar `interests` elegíveis (respeitar `scanIntervalMin` por plano)
2. Para cada interesse: scan Mercado Livre + Magazine Luiza via ScrapingBee e parsing Cheerio
3. Upsert `products` (ON CONFLICT marketplace + external_id)
4. INSERT `price_history`
5. Upsert `opportunities` (ON CONFLICT DO NOTHING)
6. Margin calculator: custo aquisição + margem líquida por canal → `channel_margins`
7. Quality badge (exceptional ≥40% / great ≥25% / good ≥15%)
8. Match × interesses (query + pg_trgm similarity ≥ 0.3)
9. Alertas: verificar limite diário + silêncio → INSERT `alerts` → Telegram
10. UPDATE `interests.last_scanned_at`

### Live Monitor Pipeline (`/api/cron/live` — a cada 2 min)

1. Buscar `favorite_sellers` ativos
2. Poll status em Shopee/TikTok (até 50 sellers por invocação)
3. Detectar transição `is_live: false → true`
4. Enviar alerta Telegram (respeitar silence + limites)
5. UPDATE `favorite_sellers` (is_live, last_live_at, last_checked_at)
6. INSERT `live_alerts` com status (sent / skipped_limit / skipped_silence)
7. **Regra CA-24:** alertas de live em silêncio são **descartados**, não enfileirados

### HOT Refresh (`/api/cron/hot` — a cada 15 min)

RPC `refresh_hot_flags()`: PERCENTILE_CONT(0.70) sobre oportunidades ativas → top 30% recebe `hot = true`.

### Cleanup (`/api/cron/cleanup` — diário 3h UTC-3)

1. Expirar oportunidades (expires_at < NOW() ou detected_at > 7 dias)
2. DELETE price_history > 90 dias
3. DELETE oportunidades expiradas > 30 dias (cascade em channel_margins, alerts)
4. Reset `is_live = false` se `last_checked_at > 1h` sem confirmação

## Mapeamento Protótipo → Produção

| Protótipo (monolítico) | Destino Produção |
|------------------------|-----------------|
| `App` (~200 linhas de estado) | `layout.tsx` + `(app)/layout.tsx` |
| `LoginPage` | `(auth)/login/page.tsx` |
| `OnboardingPage` | `onboarding/page.tsx` + `OnboardingWizard.tsx` |
| `DashboardPage` | `dashboard/page.tsx` + features/dashboard/ |
| `ProductCard`, `ProductDetailModal` | `features/dashboard/` |
| `InterestsPage` | `interesses/page.tsx` |
| `NotificationsPage` | `alertas/page.tsx` |
| `ProfilePage` | `perfil/page.tsx` |
| `PlanPage` | `planos/page.tsx` |
| `Badge`, `Toggle`, `Chip`, `StatCard` | `components/` |
| CSS inline (`:root`, `[data-theme]`) | `globals.css` + `tailwind.config.ts` |
| `MOCK_OPPORTUNITIES`, constantes | Removidos (dados vêm do Supabase) |

## Padrões Arquiteturais

- **Server Components por padrão:** Dados fetched no servidor, sem waterfall client-side
- **Client Components quando necessário:** Interatividade (filtros, formulários, toggles)
- **Server Actions para mutações:** CRUD com validação Zod no servidor
- **Supabase RLS como barreira:** Todas as tabelas com policies baseadas em `auth.uid()`
- **Feature modules:** Cada feature em `src/features/` com componentes + hooks colocados
- **Cron-triggered functions:** Scanner e Live Monitor acionados por Vercel Cron, stateless
- **Realtime autenticado via prop do servidor:** Cookies Supabase são `httpOnly`, então o access token é lido no `(app)/layout.tsx` (`supabase.auth.getSession()`) e injetado nos client components. Eles chamam `supabase.realtime.setAuth(accessToken)` **antes** de `.subscribe()` — sem isso o socket conecta como `anon` e o RLS filtra todos os eventos. Padrão documentado em [ADR 011](../adrs/011_notificacoes_web_via_supabase_realtime.md)

## Notificações no Navegador (canal `web`)

Entregues inteiramente do lado cliente com Supabase Realtime + Notification API, sem service worker/push:

```text
(app)/layout.tsx (Server Component)
  ├── getSession() → accessToken
  ├── getUnreadAlertsCount() → initialCount
  └── renderiza
      ├── <UnreadAlertsProvider userId accessToken initialCount>
      │     Context<number> com contagem reativa
      │     Subscreve postgres_changes em alerts + live_alerts
      │     Debounce 150ms → refetch getUnreadAlertsCount()
      │
      ├── <AppHeader>  → useUnreadAlertsCount() → badge pill
      │
      └── <AlertNotifier userId accessToken>
            Só efetivo quando Notification.permission === "granted"
            Subscreve INSERT em alerts filtrado por user_id + channel="web"
            Dispara new Notification(title, { body, icon, tag })
```

Página `/alertas` monta [`<MarkAlertsOnMount>`](../../src/features/notifications/MarkAlertsOnMount.tsx) que invoca a server action `markAlertsAsRead()` no `useEffect`, promovendo `alerts.status IN ('pending','sent')` e `live_alerts.status = 'sent'` para `'read'`. Fluxo ponta-a-ponta coberto por `scripts/browser-alert-notifier-test.mjs` e `scripts/browser-alerts-badge-test.mjs`.

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [02-technology-stack.md](02-technology-stack.md) | Próximo: [04-coding-standards.md](04-coding-standards.md)*
