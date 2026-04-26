# Tech Spec — Avisus MVP

## Contexto

- **PRD**: [`prd.md`](./prd.md) — Plataforma de Inteligência para Revendedores
- **Protótipo UI**: [`src/prototype.jsx`](../../src/prototype.jsx)
- **Design System**: [`docs/design-system.md`](../../docs/design-system.md)

O Avisus rastreia ofertas e descontos nos principais marketplaces brasileiros (Mercado Livre, Shopee, Magazine Luiza), identifica oportunidades relevantes para o perfil de cada revendedor e o notifica em tempo real. Modelo freemium em três camadas: FREE, STARTER e PRO.

O sistema atual é um protótipo monolítico (~4.700 linhas JSX, React 19 + Vite 8) com toda a UI implementada sobre dados mockados. Esta Tech Spec transforma esse protótipo em produto funcional.

**Restrições do projeto**: desenvolvedor solo, prazo de 4 semanas, custo operacional mínimo (~$69/mês: Vercel Pro $20 + ScrapingBee $49 + serviços gratuitos).

**Escopo MVP**: Features Must Have do PRD — F01 (Interesses), F02 parcial (Scanner ML + Magalu — 2 marketplaces, ver D11), F03 (Margem + indicador de qualidade, ver D12), F04 parcial (Telegram + silêncio), F05 parcial (Dashboard + filtros + ordenação + ações comprei/dismissed, ver D14), F06 (Planos), F09 (HOT), F13 (Perfil + LGPD + barra de completude RF-48), F14 (Alerta de início de live), mais coleta de `price_history` para F08 futuro. Desvios documentados: D1–D14 (ver seção *Desvios do PRD e Justificativas*).

---

## Escopo Técnico

### O que será construído

| # | Entrega | Features PRD |
|---|---------|-------------|
| 1 | **Frontend + BFF** — Next.js 15 App Router com TypeScript strict, Tailwind CSS, migração do protótipo | F01, F05, F06, F09, F13 |
| 2 | **Backend / Banco** — Supabase (PostgreSQL + Auth + RLS) como plataforma de dados e autenticação | Todas |
| 3 | **Scanner (Vercel Functions)** — Cron → scan ML (API direta) + Magalu (ScrapingBee) + matching + alertas | F02 |
| 4 | **Pipeline de Margem** — Cálculo de custo de aquisição + margem líquida por canal | F03 |
| 5 | **Notificações** — Telegram Bot API com fila, silêncio e limites | F04 parcial |
| 6 | **Assinaturas** — Stripe Checkout + webhooks para planos STARTER/PRO | F06 |
| 7 | **Coleta de dados** — `price_history` desde o dia 1 (investimento invisível para F08) | Pré-req F08 |
| 8 | **Live Monitor** — Polling Shopee/TikTok Live status + alerta instantâneo via Telegram para vendedores favoritos | F14 |

### O que NÃO será construído nesta entrega

- Score inteligente com IA (F08) — apenas coleta de dados históricos
- Tendências de preço (F10), Sazonalidade (F11), Sugestão de Volume (F12)
- Notificação via WhatsApp — risco de ban; pós-MVP
- Scanner da Shopee para ofertas — terceiro marketplace entra após validação dos dois primeiros (Shopee Live entra via F14 apenas para detecção de live, sem scraping de ofertas)
- Filtros por região/frete (F07) — Should Have
- App mobile nativo — web responsivo é suficiente para MVP
- Monitoramento de conteúdo de lives com IA (leitura de tela, extração de preços em tempo real) — evolução futura; F14 valida demanda primeiro
- Métricas de engajamento em lives (cliques, conversão) — Could Have / PRO

### Módulos e camadas

| Camada | Tecnologia | Ação |
|--------|-----------|------|
| Frontend + BFF + Scanner | Next.js 15 App Router, TypeScript strict, Tailwind CSS | Migrar do protótipo |
| Auth + DB + RLS | Supabase (PostgreSQL 15+) | Criar |
| Scanner ML | Vercel Function + API Afiliados ML (HTTP direto) | Criar |
| Scanner Magalu | Vercel Function + ScrapingBee (JS rendering delegado) | Criar |
| Live Monitor | Vercel Cron (*/2 min) → polling Shopee/TikTok Live status | Criar |
| Notificações | Telegram Bot API (ofertas + lives) | Criar |
| Pagamentos | Stripe Subscriptions + Checkout | Criar |
| Hosting (tudo) | Vercel Pro ($20/mês) | Configurar |

---

## Arquitetura e Design

### Visão Geral da Solução

A stack é **serverless-first**: todas as operações — UI, auth, CRUD, scraping e alertas — rodam na Vercel como Functions. O scraping da Magazine Luiza (que exige JS rendering) é delegado ao **ScrapingBee**, eliminando a necessidade de browser headless e infraestrutura dedicada.

A stack utiliza **4 serviços gerenciados** (Vercel, Supabase, ScrapingBee, Stripe), priorizando simplicidade operacional para solo dev em 4 semanas. O **Vercel Pro** ($20/mês) viabiliza cron jobs de alta frequência (*/5 min) e execução serverless com até 800s de timeout. O **ScrapingBee** ($49/mês) gerencia browser rendering, proxies e anti-bot para Magalu. O **Supabase** concentra Auth + DB + RLS + SDK em uma única plataforma (justificativa na seção *Alternativas Consideradas*).

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
│      │   ├── Scanner ML → API Afiliados (HTTP direto)        │
│      │   ├── Scanner Magalu → ScrapingBee API (JS render)    │
│      │   ├── Margin calculator (F03)                         │
│      │   ├── Opportunity matcher                             │
│      │   ├── price_history writer                            │
│      │   └── Alert sender → Telegram Bot API                 │
│      ├── hot/route.ts     → RPC refresh_hot_flags()          │
│      ├── live/route.ts    → polling live status + alertas    │
│      └── cleanup/route.ts → expirar + reter                  │
│                                                              │
│  Vercel Cron (vercel.json)                                   │
│  └── */5 * * * *  → /api/cron/scan                           │
│  └── */2 * * * *  → /api/cron/live                           │
│  └── */15 * * * * → /api/cron/hot                            │
│  └── 0 3 * * *   → /api/cron/cleanup                        │
└──────────┬───────────────────────────────────────────────────┘
           │
    ┌──────▼──────────────┐      ┌────────────────┐
    │   Supabase Cloud    │      │  ScrapingBee   │
    │                     │      │  (JS rendering │
    │  PostgreSQL 15+     │      │   + proxies)   │
    │  + Auth             │      └────────────────┘
    │  + RLS              │
    │  + Generated Types  │      ┌────────────────┐
    │                     │      │  Telegram Bot  │
    │  profiles           │      │  API           │
    │  interests          │      └────────────────┘
    │  products           │
    │  opportunities      │      ┌────────────────┐
    │  channel_margins    │      │  Stripe        │
    │  alerts             │      │  Webhooks      │
    │  price_history      │      └────────────────┘
    │  marketplace_fees   │
    │  subscriptions      │      ┌────────────────┐
    │  user_opp_status    │      │  ML API        │
    │  favorite_sellers   │      │  IBGE API      │
    │  live_alerts        │      └────────────────┘
    └─────────────────────┘
                                 ┌────────────────┐
                                 │ Shopee Live    │
                                 │ TikTok Live    │
                                 │ (polling F14)  │
                                 └────────────────┘
```

### Stack de serviços

| Serviço | Responsabilidade | Plano / Limites |
|---|---|---|
| **Vercel** (Pro — $20/mês) | Frontend + BFF + Scanner Functions + Cron | 1 TB bandwidth, serverless ilimitado, 100 cron jobs, functions até 800s |
| **Supabase** (Free) | Auth + PostgreSQL + RLS + SDK tipado + admin | 500 MB DB, 50K MAU |
| **ScrapingBee** (Freelance — $49/mês) | JS rendering + proxies + anti-bot para Magalu | 250K créditos/mês (~50K requests JS), 10 concorrentes |
| **Stripe** | Pagamentos (STARTER/PRO) | Sem mensalidade (taxa por transação) |

Justificativas detalhadas na seção *Alternativas Consideradas*.

### Componentes Envolvidos

#### Estrutura de diretórios — Next.js 15

```
avisus/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (Supabase provider, tema, fontes)
│   │   ├── page.tsx                      # Redirect → /dashboard ou /login
│   │   ├── globals.css                   # Tailwind + tokens do design system
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── registro/page.tsx
│   │   ├── (app)/                        # Layout autenticado (shell + nav)
│   │   │   ├── layout.tsx                # Header, bottom nav, proteção de rota
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx              # Server Component: fetch oportunidades
│   │   │   │   └── components.tsx        # Client Components: filtros, cards, modal
│   │   │   ├── interesses/page.tsx
│   │   │   ├── alertas/page.tsx
│   │   │   ├── favoritos/page.tsx           # Vendedores favoritos (CRUD + status live)
│   │   │   ├── perfil/
│   │   │   │   ├── page.tsx
│   │   │   │   └── margem/page.tsx
│   │   │   └── planos/page.tsx
│   │   ├── onboarding/page.tsx
│   │   └── api/
│   │       ├── stripe/webhook/route.ts
│   │       └── cron/
│   │           ├── scan/route.ts         # Vercel Cron → scanner pipeline (maxDuration: 300s)
│   │           ├── live/route.ts         # Vercel Cron → polling live status + alertas (maxDuration: 60s)
│   │           ├── hot/route.ts          # Vercel Cron → RPC refresh_hot_flags()
│   │           └── cleanup/route.ts      # Vercel Cron → expirar + reter
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # createBrowserClient (@supabase/ssr)
│   │   │   ├── server.ts                # createServerClient (cookies)
│   │   │   └── middleware.ts             # Renovação de sessão
│   │   ├── stripe.ts                     # Stripe SDK wrapper
│   │   ├── plan-limits.ts                # Constantes FREE/STARTER/PRO
│   │   ├── constants.ts                  # Tokens, enums, config
│   │   └── scanner/
│   │       ├── mercado-livre.ts          # API Afiliados ML (HTTP direto)
│   │       ├── magazine-luiza.ts         # ScrapingBee → Cheerio parse
│   │       ├── margin-calculator.ts      # F03: custo aquisição + margem/canal
│   │       ├── opportunity-matcher.ts    # Match oportunidades × interesses
│   │       ├── alert-sender.ts           # Telegram Bot API
│   │       ├── scraping-bee.ts           # ScrapingBee client wrapper
│   │       └── live/
│   │           ├── shopee-live.ts        # Polling status live Shopee
│   │           ├── tiktok-live.ts        # Polling status live TikTok
│   │           └── live-monitor.ts       # Orquestrador: check status + enviar alertas
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductDetailModal.tsx
│   │   │   ├── StatCards.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── OpportunityList.tsx
│   │   │   └── hooks.ts                 # useOpportunities, useFilters
│   │   ├── interests/
│   │   │   ├── InterestList.tsx
│   │   │   ├── InterestForm.tsx
│   │   │   └── hooks.ts
│   │   ├── notifications/
│   │   │   ├── AlertList.tsx
│   │   │   ├── ChannelConfig.tsx
│   │   │   └── hooks.ts
│   │   ├── favorites/
│   │   │   ├── FavoriteSellerList.tsx    # Lista de vendedores favoritos com status live
│   │   │   ├── AddSellerForm.tsx         # Adicionar vendedor por link ou busca
│   │   │   └── hooks.ts                 # useFavoriteSellers, useLiveStatus
│   │   ├── profile/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ProfileCompleteness.tsx   # Barra de completude (RF-48)
│   │   │   ├── RegionSelector.tsx        # API IBGE
│   │   │   ├── ResaleChannelsForm.tsx
│   │   │   └── hooks.ts                 # useProfile, useIBGE, useCompleteness
│   │   ├── plans/
│   │   │   ├── PlanComparison.tsx
│   │   │   └── hooks.ts
│   │   └── onboarding/
│   │       └── OnboardingWizard.tsx      # Steps: interesses, região, alertas
│   ├── components/                       # Shared / design system
│   │   ├── AppIcon.tsx
│   │   ├── Badge.tsx
│   │   ├── Toggle.tsx
│   │   ├── Chip.tsx
│   │   ├── StatCard.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Toast.tsx
│   │   └── MiniSparkline.tsx
│   └── types/
│       └── database.ts                   # Gerado por `supabase gen types`
├── supabase/
│   ├── migrations/                       # SQL migrations
│   └── config.toml                       # Supabase local dev config
├── middleware.ts                          # Next.js middleware (Supabase session)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                           # Cron schedules
├── package.json
└── .env.local.example
```

#### Mapeamento Protótipo → Produção

| Protótipo (monolítico) | Destino | Migração |
|---|---|---|
| `App` (~200 linhas de estado) | `layout.tsx` + `(app)/layout.tsx` | Decompor; auth via Supabase; tema via Tailwind `dark:` |
| `LoginPage` | `(auth)/login/page.tsx` | Conectar Supabase Auth (email + Google) |
| `OnboardingPage` (3 steps) | `onboarding/page.tsx` + `OnboardingWizard.tsx` | Server Actions para persistir |
| `DashboardPage` | `dashboard/page.tsx` + componentes | Dados reais via Supabase; infinite scroll |
| `ProductCard`, `ProductDetailModal` | `features/dashboard/` | Converter CSS inline → Tailwind; adicionar ações "Comprei" / "Não tenho interesse" no modal (D14) |
| `InterestsPage` | `interesses/page.tsx` | CRUD real com limites de plano |
| `NotificationsPage` | `alertas/page.tsx` | Dados reais do banco |
| *Novo* (sem equivalente no protótipo) | `favoritos/page.tsx` + `features/favorites/` | Funcionalidade nova (F14) — CRUD de vendedores favoritos + status live |
| `ProfilePage` | `perfil/page.tsx` + `ProfileCompleteness.tsx` | Server Actions; API IBGE; barra de completude (RF-48) |
| `PlanPage` | `planos/page.tsx` | Stripe Checkout |
| `MargemRevendaPage` | `perfil/margem/page.tsx` | Sub-rota do perfil |
| `Badge`, `Toggle`, `Chip`, `StatCard`, `AppIcon` | `components/` | Converter → Tailwind |
| CSS inline (`:root`, `[data-theme="dark"]`) | `globals.css` + `tailwind.config.ts` | Mapear tokens → Tailwind theme |
| `useGravatar`, `useViewportMaxWidth` | `components/` / `hooks` | Manter; `useViewportMaxWidth` pode virar Tailwind responsive |
| `MOCK_OPPORTUNITIES`, constantes | Removidos | Dados vêm do Supabase |

### Contratos e Interfaces

#### Acesso a dados — Supabase JS Client

O Next.js acessa dados via Supabase client (Server Components usam `createServerClient`, Client Components usam `createBrowserClient`). RLS garante isolamento.

```typescript
// Server Component — buscar oportunidades ativas (keyset pagination)
const supabase = await createServerClient();
const { data: { user } } = await supabase.auth.getUser();

// IDs de oportunidades dismissed pelo usuário (D14)
const { data: dismissed } = await supabase
  .from('user_opportunity_status')
  .select('opportunity_id')
  .eq('user_id', user.id)
  .eq('status', 'dismissed');
const dismissedIds = dismissed?.map(d => d.opportunity_id) ?? [];

const query = supabase
  .from('opportunities')
  .select('*, channel_margins(*)', { count: 'exact' })
  .eq('status', 'active')
  .gte('margin_best', filters.minMargin ?? 0)
  .order('detected_at', { ascending: false })
  .order('id')
  .limit(PAGE_SIZE); // PAGE_SIZE = 20

if (dismissedIds.length > 0) {
  query.not('id', 'in', `(${dismissedIds.join(',')})`);
}

// Keyset: próxima página usa detected_at do último item anterior
if (cursor?.detectedAt) {
  query.lt('detected_at', cursor.detectedAt);
}

const { data, count } = await query;

// Server Action — criar interesse (com validação de limite)
async function createInterest(term: string) {
  'use server';
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count } = await supabase
    .from('interests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('active', true);

  const limit = PLAN_LIMITS[profile.plan].maxInterests;
  if (count >= limit) throw new Error('LIMIT_REACHED');

  return supabase.from('interests').insert({ user_id: user.id, term, active: true });
}
```

#### Scanner API (Vercel Functions)

```typescript
// /api/cron/scan — Vercel Cron a cada 5 min
// export const maxDuration = 300; (5 min — Vercel Pro suporta até 800s)
// Validação: CRON_SECRET header
// Pipeline completo:
//   1. Buscar interests elegíveis (last_scanned_at respeitando scanIntervalMin do plano)
//   2. Para cada interesse: scan ML (API) + Magalu (ScrapingBee) usando o term como query
//   3. Upsert products: INSERT INTO products ON CONFLICT (marketplace, external_id) DO UPDATE
//      → atualiza last_price, last_seen_at; retorna product_id
//   4. INSERT INTO price_history (product_id, price, original_price, discount_pct, units_sold)
//   5. Upsert opportunities: INSERT INTO opportunities ON CONFLICT (marketplace, external_id) DO NOTHING
//      → opportunity.product_id = product_id do passo 3
//   6. Margin calculator: para cada nova opportunity, calcular custo aquisição (price + freight)
//      e margem líquida por canal → INSERT channel_margins + UPDATE opportunities SET margin_best
//   7. Quality: calcular quality (exceptional/great/good/NULL) com base em margin_best
//   8. Match × interesses: para cada nova opportunity, buscar usuários cujos interests
//      correspondem (via query original + similarity pg_trgm ≥ 0.3 para matching secundário)
//   9. Alertas: para cada match, verificar limite diário + silêncio → INSERT alerts → enviar Telegram
//  10. UPDATE interests SET last_scanned_at = NOW() para os interesses processados
// Response: { scanned: number, new_opportunities: number, alerts_sent: number }

// /api/cron/live — Vercel Cron a cada 2 min (F14)
// export const maxDuration = 30;
// Validação: CRON_SECRET header
// Pipeline: buscar favorite_sellers ativos → poll status em Shopee/TikTok
//   → se is_live mudou de false→true: enviar alerta Telegram (respeitando silence + limites)
//   → UPDATE favorite_sellers SET is_live, last_live_at, last_checked_at
//   → INSERT live_alerts com status (sent / skipped_limit / skipped_silence)
// Regra silêncio (CA-24): alertas de live NÃO são enfileirados — lives são efêmeras
// Response: { checked: number, new_lives: number, alerts_sent: number }

// /api/cron/hot — Vercel Cron a cada 15 min
// Executa: supabase.rpc('refresh_hot_flags')

// /api/cron/cleanup — Vercel Cron diário às 3h
// Executa: expirar oportunidades + reter price_history + limpar expiradas + reset is_live stale
```

#### Vercel Cron (vercel.json)

```json
{
  "crons": [
    { "path": "/api/cron/scan",    "schedule": "*/5 * * * *" },
    { "path": "/api/cron/live",    "schedule": "*/2 * * * *" },
    { "path": "/api/cron/hot",     "schedule": "*/15 * * * *" },
    { "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }
  ]
}
```

#### Tipos TypeScript principais

```typescript
// types/database.ts é gerado por `supabase gen types typescript`
// Tipos de domínio derivados:

type Plan = 'free' | 'starter' | 'pro';
type Marketplace = 'Mercado Livre' | 'Magazine Luiza';
type LivePlatform = 'shopee' | 'tiktok';
type Quality = 'exceptional' | 'great' | 'good';
type AlertChannel = 'telegram' | 'web';
type AlertStatus = 'pending' | 'sent' | 'read' | 'silenced' | 'failed';
// AlertType é usado apenas na UI para combinar alertas de `alerts` (ofertas)
// e `live_alerts` (lives) em uma listagem unificada — não existe como coluna no banco
type AlertType = 'opportunity' | 'live';

interface PlanLimits {
  maxInterests: number;           // FREE: 5, STARTER: 20, PRO: Infinity
  maxAlertsPerDay: number;        // FREE: 5 (ofertas + lives), STARTER/PRO: Infinity
  scanIntervalMin: number;        // FREE: 120, STARTER: 30, PRO: 5
  historyDays: number;            // FREE: 7, STARTER: 30, PRO: 90
  maxFavoriteSellers: number;     // FREE: 3, STARTER: 15, PRO: Infinity
  liveAlertsUnlimited: boolean;   // FREE: false (contam no limite diário), STARTER/PRO: true
}

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:    { maxInterests: 5,        maxAlertsPerDay: 5,        scanIntervalMin: 120, historyDays: 7,  maxFavoriteSellers: 3,        liveAlertsUnlimited: false },
  starter: { maxInterests: 20,       maxAlertsPerDay: Infinity, scanIntervalMin: 30,  historyDays: 30, maxFavoriteSellers: 15,       liveAlertsUnlimited: true  },
  pro:     { maxInterests: Infinity, maxAlertsPerDay: Infinity, scanIntervalMin: 5,   historyDays: 90, maxFavoriteSellers: Infinity, liveAlertsUnlimited: true  },
};
```

#### Convenção de percentuais

> **Padrão**: todas as colunas `*_pct` e valores de percentual em JSONB usam **formato percentual** (15.00 = 15%), nunca fração decimal (0.15). Essa convenção se aplica a: `discount_pct`, `fee_pct` (em `marketplace_fees`, `channel_margins`), `resale_fee_pct` (JSONB em `profiles`) e `min_discount_pct`.

#### Classificação de qualidade (quality)

O campo `quality` em `opportunities` é calculado pela Scanner Function com base na `margin_best`:

| `margin_best` | `quality` | Badge UI |
|----------------|-----------|----------|
| ≥ 40% | `exceptional` | 🟣 Excepcional |
| ≥ 25% | `great` | 🟢 Ótima |
| ≥ 15% | `good` | 🔵 Boa |
| < 15% | `NULL` | Sem badge |

Oportunidades com `quality IS NULL` são descartadas pelo scanner (desconto abaixo do `min_discount_pct` padrão de 15%). Os thresholds estão definidos em `src/lib/scanner/constants.ts` e podem ser ajustados sem migration.

#### Algoritmo de matching — interesses × oportunidades

O `opportunity-matcher.ts` na Scanner Function executa o matching após cada scan:

1. Busca todos os `interests` ativos cujo `last_scanned_at` respeita o `scanIntervalMin` do plano
2. Para cada interesse, o scanner busca produtos nos marketplaces usando o `term` como query
3. Os resultados do marketplace já são filtrados por `min_discount_pct` do perfil (padrão 15%)
4. Match é feito **na origem** (query de busca ao marketplace), não por comparação local
5. Deduplicação via `UNIQUE (marketplace, external_id)` com `ON CONFLICT DO NOTHING`

Para matching secundário (ex: oportunidade detectada por termo A que também é relevante para termo B do mesmo usuário), a function executa `similarity(opportunity.name, interest.term)` via `pg_trgm` com threshold ≥ 0.3, evitando alertas duplicados via `UNIQUE (user_id, opportunity_id)` em `alerts`.

#### Design: `channel_margins` sem dimensão de usuário

A tabela `channel_margins` armazena margens calculadas com **taxas médias** (`marketplace_fees`), sem `user_id`. Essa é uma decisão consciente:

- **Modo `average`** (padrão): o frontend usa diretamente os valores de `channel_margins`
- **Modo `custom`**: o frontend recalcula a margem client-side usando `resale_fee_pct` do perfil do usuário, substituindo `fee_pct` da tabela. A fórmula: `net_margin = ((market_price * (1 - user_fee_pct/100)) - (price + freight)) / (price + freight) * 100`

Essa abordagem evita a explosão de linhas (N usuários × M oportunidades × K canais) e mantém o recálculo simples. O campo `margin_best` em `opportunities` sempre reflete taxas médias; a UI exibe "(estimativa com taxas médias)" quando o modo é `average` e "(suas taxas)" quando é `custom`.

---

## Modelo de Dados

### Diagrama ER

```
auth.users (Supabase) 1──1 profiles
profiles 1──* interests
profiles 1──* alerts
profiles 1──* subscriptions
profiles 1──* user_opportunity_status
profiles 1──* favorite_sellers
favorite_sellers 1──* live_alerts
profiles 1──* live_alerts
products 1──* price_history
products 1──* opportunities
opportunities 1──* channel_margins
opportunities 1──* alerts
opportunities 1──* user_opportunity_status
marketplace_fees (lookup)
```

### DDL — Supabase PostgreSQL

```sql
-- ========================================
-- Extensões (habilitar no dashboard Supabase)
-- ========================================
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================
-- PROFILES (estende auth.users do Supabase Auth)
-- ========================================
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT '',
  phone             TEXT,
  uf                VARCHAR(2),
  city              TEXT,
  telegram_username TEXT,
  alert_channels    TEXT[] NOT NULL DEFAULT ARRAY['web']::TEXT[],
  silence_start     TIME,
  silence_end       TIME,
  max_freight       NUMERIC(10,2),
  resale_channels   JSONB NOT NULL DEFAULT
    '{"Mercado Livre": true, "Magazine Luiza": true}',
  min_discount_pct  NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  resale_margin_mode VARCHAR(10) NOT NULL DEFAULT 'average'
    CHECK (resale_margin_mode IN ('average', 'custom')),
  resale_fee_pct    JSONB NOT NULL DEFAULT
    '{"Mercado Livre": 15, "Magazine Luiza": 16}',
  onboarded         BOOLEAN NOT NULL DEFAULT FALSE,
  plan              VARCHAR(10) NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_plan ON public.profiles(plan);

-- ========================================
-- INTERESTS (termos monitorados pelo revendedor)
-- ========================================
CREATE TABLE public.interests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  term            TEXT NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  last_scanned_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique funcional (expressão LOWER não é suportada em CONSTRAINT UNIQUE)
CREATE UNIQUE INDEX uq_interest_user_term ON public.interests(user_id, LOWER(term));

CREATE INDEX idx_interests_user_active ON public.interests(user_id, active)
  WHERE active = TRUE;
CREATE INDEX idx_interests_scan ON public.interests(last_scanned_at)
  WHERE active = TRUE;

-- ========================================
-- PRODUCTS (entidade rastreada — base para price_history)
-- ========================================
CREATE TABLE public.products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   TEXT,
  marketplace   VARCHAR(20) NOT NULL
    CHECK (marketplace IN ('Mercado Livre', 'Magazine Luiza')),
  name          TEXT NOT NULL,
  category      TEXT,
  image_url     TEXT,
  last_price    NUMERIC(12,2),
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_product_external UNIQUE (marketplace, external_id)
);

CREATE INDEX idx_products_name_trgm ON public.products
  USING GIN (name gin_trgm_ops);

-- ========================================
-- PRICE_HISTORY (investimento invisível para F08 futuro)
-- ========================================
CREATE TABLE public.price_history (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price           NUMERIC(12,2) NOT NULL,
  original_price  NUMERIC(12,2),
  discount_pct    NUMERIC(5,2),
  units_sold      INTEGER,
  marketplace     VARCHAR(20) NOT NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ph_product_time ON public.price_history(product_id, recorded_at DESC);

-- ========================================
-- MARKETPLACE_FEES (taxas médias — RF-08.1)
-- ========================================
CREATE TABLE public.marketplace_fees (
  marketplace TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'default',
  fee_pct     NUMERIC(5,2) NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (marketplace, category)
);

INSERT INTO public.marketplace_fees (marketplace, category, fee_pct) VALUES
  ('Mercado Livre',  'default', 15.00),
  ('Magazine Luiza', 'default', 16.00);

-- ========================================
-- OPPORTUNITIES (ofertas detectadas pelo scanner)
-- ========================================
CREATE TABLE public.opportunities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID REFERENCES public.products(id),
  external_id       TEXT,
  name              TEXT NOT NULL,
  marketplace       VARCHAR(20) NOT NULL
    CHECK (marketplace IN ('Mercado Livre', 'Magazine Luiza')),
  price             NUMERIC(12,2) NOT NULL,
  original_price    NUMERIC(12,2) NOT NULL,
  discount_pct      NUMERIC(5,2) NOT NULL,
  freight           NUMERIC(10,2) NOT NULL DEFAULT 0,
  freight_free      BOOLEAN NOT NULL DEFAULT FALSE,
  margin_best       NUMERIC(5,2),
  margin_best_channel TEXT,
  quality           VARCHAR(15)
    CHECK (quality IN ('exceptional', 'great', 'good')),
  category          TEXT,
  region_uf         VARCHAR(2),
  region_city       TEXT,
  expires_at        TIMESTAMPTZ,
  buy_url           TEXT NOT NULL,
  image_url         TEXT,
  hot               BOOLEAN NOT NULL DEFAULT FALSE,
  status            VARCHAR(10) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired')),
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_data          JSONB,

  CONSTRAINT uq_opp_external UNIQUE (marketplace, external_id)
);

CREATE INDEX idx_opp_active ON public.opportunities(status)
  WHERE status = 'active';
CREATE INDEX idx_opp_margin ON public.opportunities(margin_best DESC)
  WHERE status = 'active';
CREATE INDEX idx_opp_detected ON public.opportunities(detected_at DESC);
CREATE INDEX idx_opp_name_trgm ON public.opportunities
  USING GIN (name gin_trgm_ops);

-- ========================================
-- CHANNEL_MARGINS (margem por canal de revenda)
-- ========================================
CREATE TABLE public.channel_margins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  channel         VARCHAR(20) NOT NULL,
  market_price    NUMERIC(12,2) NOT NULL,
  fee_pct         NUMERIC(5,2) NOT NULL,
  net_margin      NUMERIC(5,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_ch_margin UNIQUE (opportunity_id, channel)
);

-- ========================================
-- ALERTS (notificações ao revendedor)
-- ========================================
CREATE TABLE public.alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id  UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  channel         VARCHAR(10) NOT NULL DEFAULT 'web'
    CHECK (channel IN ('telegram', 'web')),
  status          VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'read', 'silenced', 'failed')),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  attempts        SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_alert_user_opp ON public.alerts(user_id, opportunity_id);
CREATE INDEX idx_alerts_user ON public.alerts(user_id, created_at DESC);
CREATE INDEX idx_alerts_pending ON public.alerts(status)
  WHERE status IN ('pending', 'silenced');

-- ========================================
-- USER_OPPORTUNITY_STATUS (comprado / descartado)
-- Schema preparatório: a tabela é criada no MVP para suportar
-- US-07 ("comprei") e "não tenho interesse" (Could Have no PRD).
-- O ProductDetailModal incluirá botões "Comprei" e "Não tenho interesse"
-- que fazem INSERT nesta tabela. Oportunidades com status 'dismissed'
-- são ocultadas do dashboard do usuário. Oportunidades 'bought' ficam
-- marcadas visualmente. Refinamento de relevância baseado nesses dados
-- é evolução futura.
-- ========================================
CREATE TABLE public.user_opportunity_status (
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id  UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  status          VARCHAR(15) NOT NULL CHECK (status IN ('bought', 'dismissed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, opportunity_id)
);

-- ========================================
-- SUBSCRIPTIONS (Stripe)
-- ========================================
CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT NOT NULL,
  stripe_subscription_id  TEXT,
  plan                    VARCHAR(10) NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro')),
  status                  VARCHAR(20) NOT NULL DEFAULT 'active',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subs_user ON public.subscriptions(user_id);

-- ========================================
-- FAVORITE_SELLERS (vendedores favoritos — F14)
-- ========================================
CREATE TABLE public.favorite_sellers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform        VARCHAR(10) NOT NULL
    CHECK (platform IN ('shopee', 'tiktok')),
  seller_username TEXT NOT NULL,
  seller_name     TEXT,
  seller_url      TEXT NOT NULL,
  is_live         BOOLEAN NOT NULL DEFAULT FALSE,
  last_live_at    TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_fav_seller UNIQUE (user_id, platform, seller_username)
);

CREATE INDEX idx_fav_sellers_user ON public.favorite_sellers(user_id);
CREATE INDEX idx_fav_sellers_live_check ON public.favorite_sellers(last_checked_at)
  WHERE is_live = FALSE;

-- ========================================
-- LIVE_ALERTS (alertas de início de live — F14)
-- ========================================
CREATE TABLE public.live_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES public.favorite_sellers(id) ON DELETE CASCADE,
  platform        VARCHAR(10) NOT NULL
    CHECK (platform IN ('shopee', 'tiktok')),
  live_title      TEXT,
  live_url        TEXT NOT NULL,
  channel         VARCHAR(10) NOT NULL DEFAULT 'telegram'
    CHECK (channel IN ('telegram', 'web')),
  status          VARCHAR(10) NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'skipped_limit', 'skipped_silence', 'failed')),
  clicked_at      TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_live_alerts_user ON public.live_alerts(user_id, created_at DESC);
CREATE INDEX idx_live_alerts_seller ON public.live_alerts(seller_id, created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_opportunity_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_margins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuário lê/edita apenas o próprio
CREATE POLICY profiles_own ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Interests: CRUD restrito ao proprietário
CREATE POLICY interests_own ON public.interests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Opportunities + Channel Margins: leitura pública
CREATE POLICY opps_read ON public.opportunities FOR SELECT USING (TRUE);
CREATE POLICY cm_read ON public.channel_margins FOR SELECT USING (TRUE);

-- Products + Price History + Marketplace Fees: leitura pública (dados não sensíveis)
CREATE POLICY products_read ON public.products FOR SELECT USING (TRUE);
CREATE POLICY ph_read ON public.price_history FOR SELECT USING (TRUE);
CREATE POLICY mf_read ON public.marketplace_fees FOR SELECT USING (TRUE);

-- Alerts: leitura e atualização (ex: marcar como 'read') restritos ao proprietário
CREATE POLICY alerts_select ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY alerts_update ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Subscriptions: restrito ao proprietário
CREATE POLICY subs_own ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- User opp status: próprio
CREATE POLICY uos_own ON public.user_opportunity_status
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Favorite sellers: CRUD restrito ao proprietário
CREATE POLICY fav_sellers_own ON public.favorite_sellers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Live alerts: leitura restrita ao proprietário
CREATE POLICY live_alerts_select ON public.live_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY live_alerts_update ON public.live_alerts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Alertas enviados hoje — conta ofertas + lives para limite FREE (RF-16: até 5 alertas/dia incluindo lives)
CREATE OR REPLACE FUNCTION public.alerts_sent_today(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT (
    (SELECT COUNT(*) FROM public.alerts
     WHERE user_id = p_user_id
       AND status IN ('sent', 'read')
       AND created_at >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE
       AND created_at <  (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE + INTERVAL '1 day')
    +
    (SELECT COUNT(*) FROM public.live_alerts
     WHERE user_id = p_user_id
       AND status = 'sent'
       AND created_at >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE
       AND created_at <  (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE + INTERVAL '1 day')
  )::INTEGER;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Refresh HOT flags (top 30% margem ativa)
CREATE OR REPLACE FUNCTION public.refresh_hot_flags()
RETURNS VOID AS $$
DECLARE
  threshold NUMERIC;
BEGIN
  SELECT PERCENTILE_CONT(0.70) WITHIN GROUP (ORDER BY margin_best)
  INTO threshold
  FROM public.opportunities
  WHERE status = 'active' AND margin_best IS NOT NULL;

  UPDATE public.opportunities
  SET hot = (margin_best >= COALESCE(threshold, 999))
  WHERE status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tr_subs_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tr_mf_updated BEFORE UPDATE ON public.marketplace_fees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tr_cm_updated BEFORE UPDATE ON public.channel_margins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- Sincronização profiles.plan ↔ subscriptions.plan
-- O webhook Stripe atualiza subscriptions; este trigger
-- propaga a mudança para profiles.plan automaticamente,
-- evitando inconsistência entre as duas tabelas.
-- ========================================
CREATE OR REPLACE FUNCTION public.sync_profile_plan()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET plan = NEW.plan
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_sync_plan
  AFTER INSERT OR UPDATE OF plan ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_plan();
```

---

## Integrações

### 1. Mercado Livre — API de Afiliados

| Item | Detalhe |
|------|---------|
| API | `api.mercadolibre.com` — Items & Search API |
| Auth | OAuth 2.0 (`client_id` + `client_secret`) |
| Endpoints | `GET /sites/MLB/search?q={term}`, `GET /items/{id}` |
| Dados | Nome, preço, preço original, desconto, frete, vendidos, categoria, link, imagem |
| Rate limit | 10.000 req/hora |
| Token mgmt | Access token armazenado em variável global da function; refresh automático via `refresh_token` antes da expiração (TTL ~6h). `ML_REFRESH_TOKEN` em variável de ambiente. Se refresh falhar, log de erro e retry no próximo ciclo de scan (5 min) |
| Executa em | Vercel Function (`/api/cron/scan`, `maxDuration: 300s`) |

### 2. Magazine Luiza — ScrapingBee + Cheerio

| Item | Detalhe |
|------|---------|
| Método | **ScrapingBee API** para JS rendering + **Cheerio** para parsing do HTML retornado |
| URL | `www.magazineluiza.com.br/busca/{term}/` |
| Dados | Nome, preço, preço original, desconto, frete, link, imagem |
| Anti-bot | Gerenciado pelo ScrapingBee (rotação de proxies, user-agents, stealth) |
| Executa em | Vercel Function (`/api/cron/scan`, `maxDuration: 300s`) |
| RAM | ~5-15 MB (HTTP client + Cheerio — sem browser local) |
| Créditos | 5 créditos/request (JS rendering). Freelance: 250K créditos = ~50K requests/mês |
| Estratégia | (1) Tentar API interna Magalu via HTTP direto (0 créditos); (2) Fallback: ScrapingBee; (3) Desativar via flag |
| Feature flag | `MAGALU_SCRAPE_MODE` — `api` (HTTP direto), `managed` (ScrapingBee), `disabled` |

### 3. Telegram Bot API

| Item | Detalhe |
|------|---------|
| API | `api.telegram.org/bot{token}/sendMessage` |
| parse_mode | HTML |
| Template (oferta) | `<b>{nome}</b>\n💰 Custo: R$ {preco+frete}\n📈 Margem: {margin}% via {canal}\n🔥 {quality}\n⏰ Expira em {tempo_restante}\n\n<a href="{url}">Ver oferta →</a>` — a linha `⏰` só é incluída quando `expires_at` está disponível; caso contrário, omitida |
| Template (live — F14) | `🔴 <b>AO VIVO</b> — {seller_name}\n📺 {platform}: {live_title}\n\n<a href="{live_url}">Entrar na live →</a>` |
| Vinculação | Usuário informa @username no perfil; bot valida via `getChat` |
| Rate limit | 30 msgs/segundo |
| Executa em | Vercel Function (ofertas via `/api/cron/scan`, lives via `/api/cron/live`) |

### 4. Shopee Live — Detecção de Status (F14)

| Item | Detalhe |
|------|---------|
| Método | Polling HTTP da página pública do vendedor ou API interna de live status |
| Estratégia em camadas | (1) **Primário**: `GET https://shopee.com.br/api/v4/livestream/get_info?username={seller}` (API interna — pode mudar sem aviso); (2) **Fallback**: ScrapingBee no perfil do vendedor → Cheerio para detectar badge "AO VIVO"; (3) **Desativação**: feature flag |
| Detecção | Comparar `is_live` anterior vs. resposta atual. Transição `false→true` = início de live → disparar alerta |
| Dados extraídos | `is_live` (boolean), `live_title` (quando disponível), `live_url` (link direto para a transmissão) |
| Polling interval | A cada 2 min via Vercel Cron (`/api/cron/live`) |
| Executa em | Vercel Function (`maxDuration: 30s`) |
| Rate limit | Limitar a 50 sellers por invocação; se > 50, processar em lotes rotativos |
| Anti-bloqueio | Headers padrão browser; delays aleatórios (100-500ms) entre requests; ScrapingBee como fallback com proxies |
| Feature flag | `ENABLE_SHOPEE_LIVE` — `true` / `false` |

### 5. TikTok Live — Detecção de Status (F14)

| Item | Detalhe |
|------|---------|
| Método | Polling HTTP da página pública do vendedor ou API interna |
| Estratégia em camadas | (1) **Primário**: `GET https://www.tiktok.com/api/live/detail/?uniqueId={seller}` (API interna — pode mudar sem aviso); (2) **Fallback**: ScrapingBee na página do vendedor → Cheerio para detectar indicador de live; (3) **Desativação**: feature flag |
| Detecção | Mesma lógica Shopee: transição `false→true` = início |
| Dados extraídos | `is_live` (boolean), `live_title`, `live_url` |
| Polling interval | Compartilhado com Shopee no mesmo cron (`/api/cron/live`) |
| Executa em | Vercel Function (`maxDuration: 30s`) |
| Anti-bloqueio | Mesma estratégia Shopee (headers, delays, ScrapingBee fallback) |
| Feature flag | `ENABLE_TIKTOK_LIVE` — `true` / `false` |
| Risco | APIs internas TikTok são mais instáveis que Shopee; priorizar Shopee na primeira semana e habilitar TikTok após validação |

### 6. Stripe — Subscriptions

| Item | Detalhe |
|------|---------|
| Fluxo | Next.js Route Handler cria `checkout.sessions` → redireciona → Stripe hosted page → webhook |
| Planos | `price_starter_monthly`, `price_pro_monthly` (criados no Dashboard Stripe) |
| Webhook events | `customer.subscription.created`, `updated`, `deleted`, `invoice.payment_failed` |
| Pix | `payment_method_types: ['card', 'pix']` |
| Idempotência | O handler valida assinatura via `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`. Verifica `stripe_subscription_id` existente antes de processar para ignorar webhooks duplicados. Eventos já processados retornam `200 OK` sem efeito colateral |
| Executa em | Vercel (Route Handler `/api/stripe/webhook`) |

### 7. IBGE — Localidades

| Item | Detalhe |
|------|---------|
| API | `servicodados.ibge.gov.br/api/v1/localidades` |
| Cache | Chamada direta do client; TanStack Query com `staleTime: 24h` |

### 8. Supabase Auth

| Item | Detalhe |
|------|---------|
| Providers | Email/senha + Google OAuth |
| Pacote | `@supabase/ssr` (client + server + middleware) |
| Session | Cookie-based, refresh automático via middleware |
| Profile | Trigger `on_auth_user_created` cria row em `profiles` |

---

## Segurança

### Autenticação e Sessões

- **Supabase Auth** gerencia signup, login, OAuth, reset de senha e sessões
- Tokens JWT gerenciados pelo Supabase; refresh via middleware Next.js
- Session persistida em cookies HTTP-only (via `@supabase/ssr`)
- Confirmação de e-mail habilitada (configuração no dashboard Supabase)

### Autorização

- **RLS em todas as tabelas** — policies baseadas em `auth.uid()`
- Oportunidades e margens são **leitura pública** (sem dados sensíveis)
- Dados pessoais (profiles, interests, alerts) restritos ao proprietário
- Scanner Functions usam `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS) para operações batch de escrita (oportunidades, alertas, price_history)
- Limites de plano verificados **no backend** (Server Actions / Server Components):
  - Interesses: `COUNT(*) WHERE active = TRUE` vs `PLAN_LIMITS[plan].maxInterests`
  - Alertas (ofertas + lives): `alerts_sent_today(user_id)` vs `PLAN_LIMITS[plan].maxAlertsPerDay`
  - Vendedores favoritos: `COUNT(*) WHERE user_id = ?` vs `PLAN_LIMITS[plan].maxFavoriteSellers`

### Validação de Entrada

- **Zod** para validação em Server Actions e Route Handlers
- Telegram username: `z.string().regex(/^@?[a-zA-Z0-9_]{5,32}$/)`
- Termos de interesse: `z.string().trim().min(2).max(100)`
- Seller URL (F14): `z.string().url()` + validação de domínio (`shopee.com.br` ou `tiktok.com`)
- Seller username (F14): `z.string().regex(/^[a-zA-Z0-9._-]{2,50}$/)`
- Route Handlers de cron (`/api/cron/*`) validam o header `Authorization: Bearer <CRON_SECRET>` no início da execução — os endpoints são públicos no Vercel e a validação previne invocação não autorizada. Retorna `401` se o secret não corresponder
- Webhook Stripe valida assinatura via `stripe.webhooks.constructEvent()` — rejeita payloads com assinatura inválida

### Dados Sensíveis

- Senhas gerenciadas pelo Supabase Auth (bcrypt interno)
- Tokens de API (`TELEGRAM_BOT_TOKEN`, `STRIPE_SECRET_KEY`, `SCRAPINGBEE_API_KEY`, chaves ML, chaves Shopee/TikTok se necessário) em variáveis de ambiente (Vercel)
- Logs não contêm dados pessoais completos

### LGPD

- Consentimento no onboarding (RF-49): texto informando uso de dados para alertas e cálculo de frete/margem
- Exclusão de conta: `DELETE` no Supabase Auth → cascade para todas as tabelas (via FK `ON DELETE CASCADE`)
- Texto de conformidade visível na tela de perfil

---

## Performance

### Frontend

| Estratégia | Detalhe |
|-----------|---------|
| Server Components | Dashboard carrega dados no servidor, sem waterfall client-side |
| Streaming / Suspense | `loading.tsx` por rota com skeleton (padrão do protótipo) |
| Code splitting | Automático por rota (Next.js App Router) |
| Imagens | `next/image` com lazy loading, placeholder blur, otimização automática |
| Paginação | Infinite scroll no dashboard (20 itens/página) via keyset pagination (`detected_at` + `id` como cursor) — evita degradação com volume crescente |
| Data fetching client | **TanStack Query (React Query v5)** como padrão para mutations, cache e revalidação em Client Components. Server Components usam Supabase client diretamente. `staleTime` conservador (30s para dashboard, 24h para IBGE) |
| Tema | Tailwind `dark:` class strategy — sem re-render |

### Backend

| Estratégia | Detalhe |
|-----------|---------|
| Índices | GIN (trigram) para busca textual; parciais em `status = 'active'` |
| HOT flag | Materializado a cada 15 min via Vercel Cron → `refresh_hot_flags()` |
| Deduplicação | UNIQUE constraint `(marketplace, external_id)` + `ON CONFLICT DO NOTHING` |
| Rate limiting | `alerts_sent_today()` no DB (conta ofertas + lives) — sem Redis necessário para MVP |
| Live Monitor | Cron a cada 2 min → Function (`maxDuration: 30s`). Poll paralelo de até 50 sellers por invocação. Se > 50, processamento rotativo (metade a cada invocação). Transição `is_live: false→true` dispara alerta imediato. Lives são efêmeras: alertas em silêncio NÃO são enfileirados (CA-24). Reset `is_live = false` se `last_checked_at > 1h` sem confirmação |
| Scanner | Vercel Cron a cada 5 min → Function (`maxDuration: 300s`). Lotes de 20 termos por invocação; 3 requisições paralelas (ML API: ~200ms/req; Magalu via ScrapingBee: ~3-5s/req). Respeita `last_scanned_at` × `scanIntervalMin` do plano do usuário (FREE: 120 min, STARTER: 30 min, PRO: 5 min). Se o lote não terminar em 300s, os termos restantes são processados na próxima invocação (5 min depois). Após scan, `UPDATE interests SET last_scanned_at = NOW()` |
| Retenção (`/api/cron/cleanup`) | Cron diário às 3h (UTC-3): (1) `UPDATE opportunities SET status = 'expired' WHERE status = 'active' AND (expires_at < NOW() OR detected_at < NOW() - INTERVAL '7 days')`; (2) `DELETE FROM price_history WHERE recorded_at < NOW() - INTERVAL '90 days'`; (3) `DELETE FROM opportunities WHERE status = 'expired' AND detected_at < NOW() - INTERVAL '30 days'` (remove expiradas antigas + cascade em `channel_margins` e `alerts`) |

### Metas

| Métrica | Alvo |
|---------|------|
| LCP (mobile 4G) | < 2.5s |
| API P95 | < 500ms |
| Detecção oferta → notificação | < 10 min (planos pagos) |
| Início live → alerta | < 2 min (RF-54) |
| Perfis simultâneos | 10.000 sem degradação |

---

## Internacionalização (i18n)

MVP exclusivamente em **PT-BR**. Sem necessidade de i18n.

- Moeda: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Datas: `Intl.DateTimeFormat('pt-BR')`
- Textos de UI em constantes centralizadas para facilitar extração futura

---

## Tratamento de Erros

| Camada | Estratégia |
|--------|-----------|
| **Frontend** | `error.tsx` por rota (Next.js Error Boundaries); toast para erros de ação; retry via TanStack Query; exceções capturadas pelo Sentry |
| **Server Actions** | Try/catch com Zod validation; retorno `{ error, code }` para o componente |
| **Route Handlers** | Respostas HTTP semânticas (400/401/403/500) com corpo JSON |
| **Scanner Function** | Erros por marketplace isolados (falha ML não bloqueia Magalu); ScrapingBee retorna HTML ou erro — retry com backoff; status `failed` com `error_message` em alerts |
| **Live Monitor** | Erros por plataforma isolados (falha Shopee não bloqueia TikTok); polling que falha marca `last_checked_at` mesmo assim (evita retry loop); seller com 5 falhas consecutivas é marcado como `check_failed` e pulado até reset manual |
| **Telegram** | 3 tentativas (campo `attempts`); após falha final, status `failed` |

### Mensagens ao Usuário

- Rede: "Não foi possível conectar. Verifique sua internet e tente novamente."
- Validação: mensagens inline específicas (ex: "Este termo já está cadastrado")
- Servidor: "Algo deu errado. Tente novamente em alguns instantes."
- Limite de plano: CTA de upgrade (ex: "Limite de 5 alertas/dia atingido. Faça upgrade!")

---

## Observabilidade

MVP mínimo para solo dev, priorizando free tiers:

| Camada | Ferramenta | Detalhe |
|--------|-----------|---------|
| **Error tracking** | Sentry (free: 5K events/mês) | SDK Next.js (`@sentry/nextjs`) para frontend e Functions; captura exceções não tratadas, performance traces e breadcrumbs |
| **Health check** | Vercel Cron monitoring | Cada cron loga resultado; ausência de oportunidades novas > 2h indica falha silenciosa |
| **Logs** | Vercel Logs | Logs estruturados (`JSON.stringify`) com nível (info/warn/error); sem dados pessoais; Function logs no dashboard Vercel |
| **Cron monitoring** | Log + alerta passivo | Cada cron job loga resultado (`{ scanned, matched, alerts_sent }`); falhas silenciosas detectadas via ausência de oportunidades novas no dashboard |
| **Uptime** | Vercel Analytics (free) | Métricas de Web Vitals (LCP, FID, CLS) integradas ao Next.js; dashboard no Vercel |

### Alertas recomendados (pós-launch)

- Cron scan sem oportunidades novas há > 2h → revisar Vercel Logs + saldo ScrapingBee
- Sentry: > 50 erros/hora → investigar
- Supabase: uso de storage > 400 MB → planejar cleanup ou upgrade
- ScrapingBee: créditos < 20% do plano → avaliar upgrade ou reduzir frequência Magalu
- Live monitor: taxa de falhas > 50% em 1h → verificar se API Shopee/TikTok mudou; considerar desativar via flag
- Live alerts: nenhum alerta enviado em 24h com sellers ativos → revisar polling

---

## Plano de Testes

### Testes Unitários — Vitest

| Módulo | Cobertura alvo |
|--------|---------------|
| `margin-calculator.ts` | Todas as combinações de canal/taxa/frete |
| `opportunity-matcher.ts` | Match de termos × categorias × oportunidades |
| `plan-limits.ts` | FREE/STARTER/PRO × interests/alerts/scan/favoriteSellers |
| `live-monitor.ts` | Transição is_live false→true; respeito a silence; limite FREE |
| `quality` thresholds | Classificação exceptional/great/good/NULL por faixa de margin_best |
| `ProfileCompleteness` | Cálculo de completude: nome, email, estado, cidade, canal de alerta |
| Componentes shared | Badge, Toggle, Chip, ProductCard, ProfileCompleteness |

### Testes de Integração

| Cenário | Método |
|---------|--------|
| Onboarding → perfil salvo no banco | Supabase local (`supabase start`) |
| CRUD interesses + limites de plano | Supabase local |
| CRUD vendedores favoritos + limites por plano (F14) | Supabase local |
| Ações bought/dismissed em user_opportunity_status (D14) | Supabase local |
| Dashboard exclui oportunidades dismissed do usuário | Supabase local |
| UNIQUE constraint (user_id, opportunity_id) em alerts impede duplicatas | Supabase local |
| Webhook Stripe → upgrade de plano | Stripe mock events |

### Testes E2E — Playwright

| Cenário |
|---------|
| Cadastro → Onboarding → Dashboard com dados |
| Fluxo de pagamento Stripe (test mode) |
| Envio de alerta Telegram (staging, bot de teste) |

### Ambiente de teste

- **Supabase local**: `supabase start` (Docker) com seed SQL derivado do `MOCK_OPPORTUNITIES` do protótipo
- **Stripe test mode**: cartão `4242 4242 4242 4242`
- **Telegram**: bot de teste separado para staging

---

## Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Magazine Luiza bloquear scraping (mesmo via ScrapingBee) | Média | Médio | ScrapingBee gerencia proxies e anti-bot; feature flag `MAGALU_SCRAPE_MODE=disabled` para desativar; funcionalidade degradada (apenas ML) |
| ScrapingBee créditos esgotados antes do fim do mês | Baixa | Médio | Monitorar saldo via API ScrapingBee; reduzir frequência Magalu ou desativar temporariamente; upgrade para Startup ($99/mês) se necessário |
| Vercel Function timeout (300s) insuficiente para lote grande | Média | Baixo | Lotes de 20 termos (não 50); termos restantes processados na próxima invocação (5 min); scan é idempotente (UNIQUE → ON CONFLICT) |
| Supabase free tier (500 MB DB, 50K MAU) | Baixa | Médio | Monitorar uso; retenção de 90 dias em `price_history`; upgrade Pro ($25/mês) quando necessário |
| Imprecisão na margem estimada | Alta | Médio | Comunicar "estimativa" na UI; `marketplace_fees` editável; disclaimer no onboarding |
| Token ML expirar durante scan (TTL ~6h) | Baixa | Médio | Refresh automático antes de expirar; se falhar, loga erro e retry no próximo ciclo (~5 min) — perda máxima de 1 ciclo |
| ScrapingBee fora do ar / lento | Baixa | Médio | Timeout de 30s por request; fallback para modo `disabled` temporário; ML continua funcionando independente |
| API interna Shopee/TikTok mudar sem aviso (F14) | Alta | Médio | Monitorar taxa de sucesso do polling; fallback para ScrapingBee + Cheerio no perfil público; feature flags `ENABLE_SHOPEE_LIVE` / `ENABLE_TIKTOK_LIVE` para desativar individualmente. Se ambas falharem, F14 degrada gracefully (UI mostra "detecção indisponível") |
| Falsos positivos/negativos em detecção de live | Média | Médio | Usar transição `is_live: false→true` (não apenas valor atual) para evitar alertas repetidos; permitir ao usuário reportar "alerta incorreto" (Could Have); monitorar taxa de falsos positivos |
| 4 semanas insuficientes (escopo expandido com F14) | Média | Alto | Priorização rígida; cortar TikTok Live se necessário (MVP com Shopee Live primeiro); Magalu antes de lives |
| Supabase fora do ar | Baixa | Alto | SLA 99.9% no free tier; sem mitigação prática para solo dev — aceitar o risco |
| CORS / cookies em Preview deploys do Vercel | Baixa | Baixo | Configurar `NEXT_PUBLIC_SITE_URL` por ambiente; Supabase redirect URLs incluindo Preview URLs |

---

## Alternativas Consideradas

### Banco de Dados: Supabase vs Neon

**Neon PostgreSQL** é uma alternativa serverless com branching instantâneo. Comparação para o contexto deste MVP:

| Critério | Supabase | Neon |
|----------|----------|------|
| Auth integrado | Sim (Supabase Auth) | Não (precisa Auth.js / Clerk) |
| RLS + policies | Dashboard visual | SQL manual |
| Admin panel | Sim (Table Editor, SQL Editor, Logs) | Não |
| SDK tipado | `@supabase/supabase-js` + `gen types` | Precisa ORM (Drizzle/Prisma) |
| Branching | Sim (migration-based) | Sim (copy-on-write, mais rápido) |
| Cold start | Não | Sim (scale-to-zero) |
| Free tier DB | 500 MB, 50K MAU auth | 500 MB, 190h compute |

**Decisão: Supabase.** A bundling de Auth + DB + RLS + SDK + admin economiza ~1 semana de setup para solo dev. O trade-off (lock-in, branching mais lento) é aceitável para MVP. Migração para Neon é possível no futuro mantendo o mesmo PostgreSQL.

### ORM: Drizzle vs Prisma vs Supabase Client

| Critério | Drizzle | Prisma | Supabase JS |
|----------|---------|--------|-------------|
| Type-safety | Excelente | Excelente | Bom (gen types) |
| Bundle size | ~50 KB | ~2 MB (engine) | ~30 KB |
| Serverless | Ótimo | Problemático (cold start do engine) | Nativo |
| Learning curve | Média | Média | Baixa (se já usa Supabase) |
| Auth integrado | Não | Não | Sim |

**Decisão: Supabase JS client.** Como já usamos Supabase para Auth e DB, adicionar um ORM separado é overhead desnecessário. Tipos gerados por `supabase gen types typescript` cobrem a type-safety. As Scanner Functions usam o mesmo client com `service_role` key para operações batch.

### Auth: Supabase Auth vs Auth.js v5 vs Clerk

| Critério | Supabase Auth | Auth.js v5 | Clerk |
|----------|--------------|------------|-------|
| Custo | Free (50K MAU) | Free (self-hosted) | Free (10K MAU) |
| Setup com Next.js 15 | `@supabase/ssr` (maduro) | `@auth/drizzle-adapter` + config | SDK dedicado |
| Providers | Email, Google, GitHub, etc. | Idem | Idem + UI pré-construída |
| RLS integrado | Sim (`auth.uid()`) | Não (precisa middleware manual) | Não |
| Esforço de integração | Baixo (já usamos Supabase) | Médio (adapter, config, session) | Baixo |

**Decisão: Supabase Auth.** Integração nativa com RLS (`auth.uid()` nas policies) e zero setup adicional já que usamos Supabase para o banco.

### Scraping Magalu: Playwright (Fly.io) vs ScrapingBee vs Zyte

| Critério | Playwright + Fly.io | ScrapingBee | Zyte |
|----------|---------------------|-------------|------|
| RAM local | 200-400 MB (Chromium) | ~5 MB (HTTP only) | ~5 MB (HTTP only) |
| Infra adicional | Fly.io VM + Docker | Nenhuma | Nenhuma |
| Anti-bot | Manual (user-agent, delays) | Gerenciado (proxies, stealth) | Gerenciado (automático, IA) |
| Custo/mês (15K req) | $0-6 (Fly.io) | $49 (Freelance) | ~$72-150 (Tier 3-4) |
| Previsibilidade | Alta (custo fixo VM) | Alta (plano fixo) | Baixa (tier variável) |
| Deploy complexity | Alta (Docker, fly.toml, CI separado) | Nenhuma (API call) | Nenhuma (API call) |
| Timeout | Sem limite | N/A (API externa) | N/A (API externa) |

**Decisão: ScrapingBee.** Elimina Fly.io, Docker e Playwright do projeto — reduzindo de 2 para 1 pipeline de deploy. Custo previsível ($49/mês) e integração trivial (1 chamada HTTP). O free trial de 1.000 calls permite validar antes de pagar. Zyte seria alternativa se a taxa de sucesso do ScrapingBee na Magalu for insuficiente (ban handling automático mais maduro). Playwright + Fly.io pode ser reintroduzido se o volume justificar VM dedicada.

### Fila: QStash vs Cron Direto

| Critério | QStash | Vercel Cron direto |
|----------|--------|-------------------|
| Retry automático | Sim (3 tentativas) | Não |
| Guaranteed delivery | Sim | Não |
| Serviço adicional | Sim (+1 conta, +1 config) | Não |
| Complexidade | Média | Baixa |

**Decisão: Cron direto para MVP.** Com Vercel Pro (até 100 cron jobs, frequência mínima 1 min), a disponibilidade é alta. Scans perdidos são toleráveis — a próxima invocação (5 min depois) processa os termos pendentes. QStash pode ser adicionado quando escala justificar retry automático.

### Live Detection (F14): Polling vs WebSocket vs Webhook

| Critério | Polling (escolhido) | WebSocket | Webhook (plataforma) |
|----------|---------------------|-----------|---------------------|
| Disponibilidade | Alta (API pública) | Baixa (requer conexão persistente) | Indisponível (Shopee/TikTok não oferecem webhook público para live) |
| Compatibilidade serverless | Total (stateless, cron-triggered) | Incompatível (requer processo long-running) | N/A |
| Latência | ~2 min (intervalo do cron) | Real-time | Real-time |
| Complexidade | Baixa | Alta (connection management, reconnect) | Baixa (se disponível) |
| Custo | Incluído no Vercel Pro | Requer VM dedicada (ex: Fly.io) | $0 |

**Decisão: Polling via Cron (*/2 min).** Shopee e TikTok não oferecem webhooks públicos para notificação de início de live. WebSocket exigiria processo persistente (voltaríamos ao Fly.io). O polling a cada 2 min via Vercel Cron é a abordagem mais simples e compatível com a arquitetura serverless-first. A latência de ~2 min atende o requisito RF-54 (< 2 min). Se no futuro as plataformas oferecerem webhooks, migrar é trivial.

### Cache: Redis vs DB-only

**Decisão: DB-only para MVP.** Deduplicação via UNIQUE constraint com `ON CONFLICT DO NOTHING`; rate limiting via `alerts_sent_today()`. Redis (Upstash) é over-engineering até ~2.000 usuários.

---

## Plano de Rollout

### Custo Estimado — MVP

| Serviço | Plano | Custo | Uso no MVP |
|---------|-------|-------|-----------|
| **Vercel** | Pro | **$20/mês** | Frontend + BFF + Scanner Functions + Cron |
| **ScrapingBee** | Freelance | **$49/mês** | JS rendering + proxies para Magalu (~50K requests/mês) |
| Supabase | Free | $0 | Auth + DB + RLS (500 MB DB, 50K MAU) |
| Stripe | Pay-as-you-go | $0 fixo | Pagamentos (taxa por transação) |
| Telegram Bot API | Gratuito | $0 | Notificações |
| Sentry | Developer | $0 | Error tracking — 5K events/mês |
| **TOTAL** | | **~$69/mês (~R$ 380)** | Até ~1.000–2.000 usuários |

**Justificativa dos custos fixos**:
- **Vercel Pro ($20/mês)**: O plano Hobby limita cron jobs a 2 com frequência mínima diária, inviabilizando scan a cada 5 min. O Pro permite até 100 cron jobs com frequência mínima de 1 min, functions de até 800s, 1 TB bandwidth. O custo se paga com ~2 assinaturas STARTER ou ~1 PRO.
- **ScrapingBee ($49/mês)**: Elimina Fly.io ($0-6/mês), Docker, Playwright (~200-400 MB RAM) e um pipeline de CI/CD separado. Gerencia proxies, anti-bot e JS rendering para Magalu. Trade-off: custo mensal maior em troca de zero complexidade operacional e 1 único deploy pipeline.

### Variáveis de ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...

# Mercado Livre
ML_CLIENT_ID=...
ML_CLIENT_SECRET=...
ML_REFRESH_TOKEN=...

# ScrapingBee
SCRAPINGBEE_API_KEY=...
MAGALU_SCRAPE_MODE=managed  # api | managed | disabled

# Live Monitor (F14)
ENABLE_SHOPEE_LIVE=true
ENABLE_TIKTOK_LIVE=true

# Cron
CRON_SECRET=...

# Observabilidade
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Cronograma — 4 semanas

| Semana | Foco | Entregas |
|--------|------|---------|
| **S1** | **Fundação** | Next.js 15 + TS + Tailwind + Supabase (schema, migrations, auth) + middleware + layout shell (header, bottom nav, tema dark/light) + componentes shared migrados do protótipo (Badge, Toggle, Chip, ProductCard, etc.) + Login/Registro + Profile CRUD + RegionSelector (IBGE) |
| **S2** | **Scanner + Dados** | Scanner Functions setup + scanner ML (API) + scanner Magalu (ScrapingBee + Cheerio) + margin-calculator (F03) + `marketplace_fees` + `price_history` desde o dia 1 + HOT flag + Vercel Cron |
| **S3** | **Dashboard + Lives + Core** | Dashboard com dados reais (filtros, ordenação, infinite scroll) + Interesses CRUD com limites + Vendedores Favoritos CRUD (F14) + Live Monitor (polling Shopee primeiro, TikTok segundo) + Telegram Bot (ofertas + lives + silêncio) + alert matching + Onboarding wizard |
| **S4** | **Monetização + Ship** | Stripe Checkout + webhook + planos no perfil + limites enforced no backend (incluindo favoritos) + CTA upgrade + polish responsivo + testes (unitários críticos + 1 E2E) + deploy produção |

### Ambientes

| Ambiente | App (Vercel) | DB |
|----------|-------------|-----|
| Local | `next dev` (scanner executado via `curl localhost:3000/api/cron/scan`) | `supabase start` (Docker) |
| Staging | Vercel Preview (cron desativado — trigger manual) | Supabase project staging |
| Produção | `avisus.app` (Vercel Pro — cron ativo) | Supabase project prod |

### CI/CD

| Componente | Pipeline | Trigger |
|-----------|----------|---------|
| **App (Frontend + Scanner)** | Vercel Git Integration (GitHub) | Push em `main` → deploy produção; push em branch → Preview deploy |
| **DB migrations** | `supabase db push` (manual no MVP) | Executado localmente antes do deploy; CI apenas valida que migration aplica sem erro |

Pipeline único: push → Vercel build → deploy. Sem Docker, sem GitHub Actions, sem segundo serviço de deploy.

### Feature flags

| Flag (env var) | Padrão | Efeito |
|------|--------|--------|
| `MAGALU_SCRAPE_MODE` | `managed` | `api` = HTTP direto, `managed` = ScrapingBee, `disabled` = desativar |
| `ENABLE_SHOPEE_LIVE` | `true` | Habilita polling de lives Shopee (F14) |
| `ENABLE_TIKTOK_LIVE` | `true` | Habilita polling de lives TikTok (F14) |
| `ENABLE_TELEGRAM_ALERTS` | `true` | Desativa envio real (staging/dev) |

### Rollback

- **App**: Vercel mantém deploys anteriores; rollback instantâneo pelo dashboard (1 clique)
- **DB**: Supabase migrations versionadas; script de rollback SQL por migration

### Checklist pós-deploy

- [ ] Signup + login funcionando (email + Google)
- [ ] Onboarding completo → perfil salvo no Supabase
- [ ] Dashboard mostrando oportunidades reais do scanner
- [ ] Interesses: limites por plano funcionam (FREE: 5, STARTER: 20, PRO: ilimitado) — bloqueio no backend retorna erro `LIMIT_REACHED` com CTA de upgrade
- [ ] Scanner ML retornando dados via scraping gerenciado a cada 5 min (PRO)
- [ ] Scanner Magalu retornando dados via ScrapingBee (ou `MAGALU_SCRAPE_MODE=disabled` com graceful degradation)
- [ ] HOT recalculando a cada 15 min
- [ ] Telegram entregando alertas < 10 min
- [ ] Limite 5 alertas/dia FREE com CTA upgrade
- [ ] Horário de silêncio enfileirando corretamente
- [ ] Stripe checkout funcional com as chaves e price IDs do ambiente
- [ ] Perfil: IBGE carregando cidades, feedback "Salvo", LGPD visível, barra de completude (RF-48)
- [ ] Vendedores favoritos: CRUD funcionando com limites por plano (3/15/∞)
- [ ] Live monitor: detectando início de live Shopee em < 2 min
- [ ] Live monitor: alerta Telegram entregue com link direto para a live
- [ ] Live monitor: horário de silêncio descarta alertas de live (não enfileira)
- [ ] Live monitor: limite FREE (5 alertas/dia) conta ofertas + lives juntos
- [ ] Dashboard: ações "Comprei" / "Não tenho interesse" no modal de detalhe funcionando
- [ ] Dashboard: oportunidades dismissed ocultadas para o usuário
- [ ] Badge de qualidade (exceptional/great/good) exibido nos cards e alertas Telegram
- [ ] Lighthouse mobile > 80
- [ ] RLS: acesso cruzado entre usuários bloqueado (incluindo favorite_sellers e user_opportunity_status)

---

## Desvios do PRD e Justificativas

Esta seção documenta diferenças conscientes entre o PRD e a implementação técnica do MVP, com justificativas para cada decisão.

### D1 — HOT flag global vs. contextual (RF-30/RF-31)

| PRD | Tech Spec |
|-----|-----------|
| "top 30% de margem efetiva entre os produtos **visíveis no contexto atual** (dashboard filtrado ou alertas)" — recalculado quando filtros mudam | HOT calculado globalmente sobre **todas** as oportunidades ativas, materializado a cada 15 min via `refresh_hot_flags()` |

**Justificativa**: Calcular HOT dinamicamente por filtro do usuário requer computação em tempo real a cada mudança de filtro, adicionando complexidade significativa (view materializada por sessão ou cálculo client-side). Para MVP, o flag global é suficiente e performático. O PRD pode ser atendido em iteração futura adicionando cálculo client-side sobre o subset filtrado.

**Impacto**: O badge HOT não muda quando o usuário aplica filtros no dashboard. É consistente entre usuários, o que pode ser visto como vantagem (comparabilidade).

### D2 — Preview de ofertas ao digitar interesses (UX)

| PRD | Tech Spec |
|-----|-----------|
| "Interesses mostram preview em tempo real de ofertas disponíveis ao digitar, contagem de ofertas por interesse, e melhor margem encontrada por termo" | Não implementado no MVP |

**Justificativa**: Requer query em tempo real (`LIKE` / trigram) contra `opportunities` a cada keystroke, com debounce e formatação de resultados. Adiciona ~2-3 dias de trabalho ao escopo de Interesses, sem ser bloqueante para o fluxo principal (cadastrar interesse → receber alertas). Prioridade cedida para features Must Have.

**Implementação futura**: Endpoint `/api/interests/preview?q=...` retornando `{ count, bestMargin, topResults[] }` com debounce de 300ms no cliente.

### D3 — Desconto mínimo parcialmente configurável (RF-05)

| PRD | Tech Spec |
|-----|-----------|
| "percentual mínimo configurável pelo usuário (padrão: 15%)" | Campo `min_discount_pct` adicionado em `profiles` (default 15%), mas **não exposto na UI do MVP** — o scanner usa o valor, mas o usuário não pode alterá-lo na interface |

**Justificativa**: O campo existe no banco e a Scanner Function o respeita, preparando para exposição futura na UI. Não exibir no MVP simplifica o perfil (menos campos) e evita confusão para usuários iniciantes. Pode ser exposto como configuração avançada em iteração futura.

### D4 — Scan único com frequência controlada por plano

| PRD | Tech Spec |
|-----|-----------|
| RF-06: "frequência mínima de 30 minutos no plano pago e 2 horas no plano gratuito" | Vercel Cron (Pro) dispara a Scanner Function a cada **5 min**. A function consulta `interests.last_scanned_at` × `PLAN_LIMITS[plan].scanIntervalMin` para decidir quais interesses processar |

**Justificativa**: Um único cron de 5 min (viável com Vercel Pro, que suporta até 100 cron jobs com frequência mínima de 1 min) simplifica a infraestrutura mantendo a diferenciação por plano na function. A cada execução, a Scanner Function verifica se já passou tempo suficiente desde o último scan de cada interesse. Interesses FREE são escaneados ~1x a cada 2h; STARTER ~1x a cada 30min; PRO ~1x a cada 5min. Todos os planos recebem a frequência prometida no PRD.

### D5 — Score básico do STARTER não implementado no MVP

| PRD | Tech Spec |
|-----|-----------|
| RF-17: plano STARTER inclui "score básico de oportunidade" (margem + desconto) | Score não implementado em nenhum plano no MVP — apenas coleta de `price_history` |

**Justificativa**: O PRD classifica score básico como Should Have (não Must Have). A implementação requer acúmulo mínimo de ~60 dias de dados históricos (premissa P08 do PRD) para gerar valores confiáveis. A coleta de dados inicia desde o dia 1 como investimento invisível. O score básico (margem + desconto) será a primeira feature ativada pós-MVP quando houver dados suficientes.

**Impacto**: Usuários STARTER não verão score numérico nem rótulos de ação no MVP. A UI do dashboard exibirá `margin_best` e `discount_pct` diretamente, com a badge de `quality` (exceptional/great/good) servindo como indicador simplificado de oportunidade.

### D6 — Tendências de preço (STARTER/PRO) não implementadas no MVP

| PRD | Tech Spec |
|-----|-----------|
| RF-17: STARTER inclui "tendências de preço (30 dias)"; RF-17.1: PRO inclui tendências de 90 dias + 3m, 6m, 1 ano | Tendências de preço (F10) não implementadas no MVP — dados coletados em `price_history` |

**Justificativa**: A coleta de `price_history` está ativa desde o dia 1 (pré-requisito para F08/F10), mas a visualização de tendências requer: (1) dados acumulados (mínimo 30 dias para STARTER ter valor), (2) componente de mini-gráfico (MiniSparkline) com dados reais, (3) lógica de janela temporal por plano. Adicionar isso ao MVP de 4 semanas comprometeria features Must Have. Será a segunda feature ativada pós-MVP, junto com D5.

**Impacto**: Usuários STARTER e PRO não verão gráficos de tendência no MVP. O componente `MiniSparkline` já existe no protótipo — a migração será rápida quando os dados estiverem prontos.

### D7 — Horário de silêncio e filtros promovidos de Should Have a MVP

| PRD | Tech Spec |
|-----|-----------|
| "Horário de silêncio nas notificações" e "Filtros e ordenação no dashboard" classificados como **Should Have** | Ambos incluídos no MVP: `silence_start`/`silence_end` em `profiles` + `FilterPanel` no dashboard |

**Justificativa**: Horário de silêncio é essencial para a experiência de notificações Telegram (enviar mensagem às 3h da manhã destrói a percepção do produto). A implementação é simples (~4h de trabalho): comparar hora atual com `silence_start`/`silence_end` antes de enviar e enfileirar como `silenced`. Filtros e ordenação no dashboard são imprescindíveis para o revendedor priorizar compras — um dashboard sem filtro é um catálogo estático. O protótipo já possui a UI de filtros; a migração requer apenas conectar aos dados reais.

### D8 — Métricas de engajamento em lives adiadas para pós-MVP (F14 parcial / PRO)

| PRD | Tech Spec |
|-----|-----------|
| RF-56: plano PRO inclui "métricas de engajamento: se o revendedor clicou no link do alerta de live" | O campo `clicked_at` existe na tabela `live_alerts` mas a **UI de métricas** (analytics, taxa de conversão) não é implementada no MVP |

**Justificativa**: O PRD classifica métricas de engajamento como Could Have. O registro do clique (`clicked_at`) é trivial (tracking link no template Telegram) e já está no schema para coleta desde o dia 1. Porém, a UI de visualização de métricas (gráficos, taxa de conversão por seller) adiciona ~2-3 dias de trabalho sem valor direto para o revendedor no MVP. O dado coletado será a base para o dashboard de métricas pós-MVP.

**Impacto**: Revendedores PRO receberão alertas de live normalmente. O tracking de cliques ocorre em background. A diferenciação visível do PRO para lives no MVP é apenas o limite ilimitado de sellers, não as métricas.

### D9 — Alertas de live em silêncio são descartados, não enfileirados (CA-24)

| PRD | Tech Spec |
|-----|-----------|
| RF-55: "respeitar horário de silêncio" para alertas de live | Alertas de live em horário de silêncio são **descartados** (`status: skipped_silence`), não enfileirados como alertas de oferta (`status: silenced`) |

**Justificativa**: Lives são efêmeras — uma transmissão dura tipicamente 30-120 minutos. Enfileirar um alerta de live para entregar quando o silêncio terminar (ex: enviar às 7h um alerta de live que começou às 2h) não tem utilidade — a live já terminou. O alerta é registrado com `status: skipped_silence` para auditoria, mas o Telegram não é acionado. O status "ao vivo" permanece visível na listagem de favoritos para quem acessar a UI mesmo em horário de silêncio (RF-58).

### D10 — Sugestão de categorias populares no onboarding adiada (RF-02)

| PRD | Tech Spec |
|-----|-----------|
| RF-02 (F01 — Must Have): "O sistema deve sugerir categorias populares durante o cadastro inicial (onboarding)" | Onboarding com 3 steps (interesses, região, alertas) **sem sugestão automática de categorias** |

**Justificativa**: O PRD apresenta contradição interna — RF-02 está dentro de F01 (Must Have), mas a priorização explícita lista "Onboarding com sugestão de categorias populares" como **Could Have**. A implementação requer: (1) definir uma lista curada de categorias populares por marketplace, (2) UI de seleção rápida com chips no step de interesses, (3) mapeamento categoria → termos de busca. Seguimos a priorização (Could Have) e o onboarding permite apenas digitação livre de termos no MVP.

**Implementação futura**: Componente `PopularCategories.tsx` no step 1 do onboarding com chips clicáveis de categorias mais buscadas (extraídas dos dados de `interests` acumulados ou lista estática curada).

### D11 — Scanner com 2 marketplaces, não 3 (RF-04 vs. priorização)

| PRD | Tech Spec |
|-----|-----------|
| RF-04: "O sistema deve monitorar **pelo menos 3 marketplaces no MVP**: Mercado Livre, Shopee e Magazine Luiza" | Scanner implementa apenas **2 marketplaces**: Mercado Livre (API) + Magazine Luiza (ScrapingBee). Shopee para ofertas é excluída |

**Justificativa**: A priorização do PRD classifica explicitamente "Scanner de pelo menos 2 marketplaces (F02 parcial)" como Must Have e "Terceiro marketplace no scanner (F02 completo)" como Should Have. O texto de RF-04 contradiz a priorização ao mencionar 3 marketplaces "no MVP". Seguimos a priorização (2 marketplaces), priorizando robustez dos dois primeiros sobre cobertura do terceiro. A Shopee é utilizada no MVP apenas para detecção de lives (F14), sem scraping de ofertas.

**Impacto**: Revendedores não recebem oportunidades de ofertas da Shopee. Ofertas Shopee são o primeiro incremento pós-MVP ao scanner.

### D12 — Indicador visual de qualidade promovido de Should Have (RF-09.2)

| PRD | Tech Spec |
|-----|-----------|
| Priorização: "Indicador visual de qualidade da oportunidade" classificado como **Should Have** | Campo `quality` (exceptional/great/good) implementado no MVP com thresholds baseados em `margin_best` |

**Justificativa**: A implementação é trivial (~2h): 3 thresholds no scanner ao calcular a margem, e o badge já existe no protótipo (`Badge.tsx`). O indicador visual agrega valor significativo à experiência (o revendedor vê "Ótima" ou "Excepcional" sem precisar interpretar percentuais) com esforço mínimo. Removê-lo empobreceria a UI sem economia relevante de tempo.

### D13 — Teto de frete coletado mas não utilizado para filtro (RF-23 / `max_freight`)

| PRD | Tech Spec |
|-----|-----------|
| RF-23 (F07): "teto máximo de frete aceitável para filtrar oportunidades automaticamente" | Campo `max_freight` existe em `profiles` mas **não é exposto na UI do MVP** e **não é utilizado para filtro** — F07 está fora do escopo MVP |

**Justificativa**: Mesma lógica de D3 (`min_discount_pct`). O campo existe no banco e será consumido quando F07 (filtro por região/frete) for implementado. Não expor no MVP simplifica o perfil e evita frustração do usuário (configurar algo que não tem efeito visível). Diferente de `min_discount_pct` (que o scanner já usa internamente), `max_freight` não tem consumidor no MVP.

### D14 — `user_opportunity_status` com UI mínima no MVP (US-07 / Could Have)

| PRD | Tech Spec |
|-----|-----------|
| US-07: "marcar uma oportunidade como comprada"; Could Have: "Feedback 'comprei'" e "Não tenho interesse" | Tabela `user_opportunity_status` com ações `bought`/`dismissed` incluída no MVP com **UI básica** (botões no `ProductDetailModal`) mas **sem refinamento de relevância** |

**Justificativa**: Os botões "Comprei" e "Não tenho interesse" no modal de detalhe são implementação simples (~4h: 2 botões + INSERT + ocultar dismissed no dashboard). O refinamento de relevância baseado nesses dados (ex: ajustar ranking, sugerir produtos similares) é evolução futura. A coleta desde o dia 1 gera dados valiosos para personalização futura.

**Impacto**: O revendedor pode marcar oportunidades como compradas ou irrelevantes. Oportunidades dismissed são ocultadas do dashboard. Nenhum efeito em alertas ou ranking no MVP.

---

## Referências

| Recurso | Link |
|---------|------|
| PRD | [`prd.md`](./prd.md) |
| Design System | [`docs/design-system.md`](../../docs/design-system.md) |
| Protótipo | [`src/prototype.jsx`](../../src/prototype.jsx) |
| Next.js 15 App Router | https://nextjs.org/docs/app |
| Supabase (Auth, DB, RLS) | https://supabase.com/docs |
| Supabase + Next.js (`@supabase/ssr`) | https://supabase.com/docs/guides/auth/quickstarts/nextjs |
| ScrapingBee | https://www.scrapingbee.com/documentation/ |
| Cheerio | https://cheerio.js.org/docs/intro |
| Stripe Subscriptions | https://stripe.com/docs/billing/subscriptions |
| Telegram Bot API | https://core.telegram.org/bots/api |
| Mercado Livre API | https://developers.mercadolivre.com.br/ |
| Tailwind CSS | https://tailwindcss.com/docs |
| IBGE Localidades | https://servicodados.ibge.gov.br/api/docs/localidades |
| TanStack Query (React Query v5) | https://tanstack.com/query/latest |
| Sentry (Next.js) | https://docs.sentry.io/platforms/javascript/guides/nextjs/ |
| Zod | https://zod.dev/ |
| Vitest | https://vitest.dev/ |
| Shopee Brasil | https://shopee.com.br/ |
| TikTok Live | https://www.tiktok.com/live |
