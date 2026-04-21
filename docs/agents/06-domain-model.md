# 06-domain-model.md: Modelo de Domínio

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [03-architecture.md](03-architecture.md) | [10-data-management.md](10-data-management.md) | [07-security.md](07-security.md)

## Visão Geral

Modelo de dados do Avisus em Supabase PostgreSQL 15+ com RLS. Cobre o ciclo completo: perfil do revendedor → interesses → scanner → oportunidades → margem → alertas → planos. Inclui tabelas de F14 (vendedores favoritos e alertas de live).

## Diagrama ER

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
marketplace_fees (lookup — sem FK)
```

## Tabelas Principais

### profiles

Estende `auth.users` do Supabase Auth. Criado automaticamente via trigger `on_auth_user_created`.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK, FK auth.users) | Identificador do usuário |
| `name` | TEXT | Nome do revendedor |
| `phone` | TEXT | Telefone (opcional) |
| `uf` | VARCHAR(2) | Estado (UF) |
| `city` | TEXT | Cidade (via API IBGE) |
| `telegram_username` | TEXT | @username do Telegram |
| `alert_channels` | TEXT[] | Canais de alerta (default: `['web']`) |
| `silence_start` / `silence_end` | TIME | Horário de silêncio |
| `max_freight` | NUMERIC(10,2) | Teto de frete (não usado no MVP) |
| `resale_channels` | JSONB | Canais de revenda habilitados. Default: `{"Mercado Livre": true, "Magazine Luiza": true}` |
| `min_discount_pct` | NUMERIC(5,2) | Desconto mínimo (default 15%, não exposto na UI do MVP) |
| `resale_margin_mode` | VARCHAR(10) | `average` ou `custom` |
| `resale_fee_pct` | JSONB | Taxas customizadas por marketplace. Default: `{}` (usa `marketplace_fees` no modo average) |
| `onboarded` | BOOLEAN | Se completou onboarding |
| `plan` | VARCHAR(10) | `free` / `starter` / `pro` |
| `created_at` | TIMESTAMPTZ | Data de criação (auto) |
| `updated_at` | TIMESTAMPTZ | Última atualização (trigger `set_updated_at`) |

### interests

Termos monitorados pelo revendedor. UNIQUE funcional em `(user_id, LOWER(term))`. Campo `last_scanned_at` controla a frequência de scan conforme o plano (`scan_interval_hours`).

### products

Entidade base rastreada pelo scanner. UNIQUE em `(marketplace, external_id)`. Índice GIN trigram em `name`.

### opportunities

Ofertas detectadas pelo scanner. UNIQUE em `(marketplace, external_id)`. Campos de margem, quality badge e flag HOT.

### channel_margins

Margem líquida por canal de revenda para cada oportunidade. UNIQUE em `(opportunity_id, channel)`. Sem dimensão de usuário — taxas médias de `marketplace_fees`. Modo `custom` recalcula client-side com `resale_fee_pct` do perfil.

### alerts

Notificações de ofertas ao revendedor. UNIQUE em `(user_id, opportunity_id)` para deduplicação. Campo `attempts` (default 0) indica tentativas de envio para lógica de retry.

Status possíveis: `pending`, `sent`, `read`, `failed`. A transição para `read` é feita por [`markAlertsAsRead`](../../src/features/notifications/actions.ts) quando o usuário visita `/alertas`. O contador de não-lidos em [`getUnreadAlertsCount`](../../src/features/notifications/actions.ts) considera `status IN ('pending','sent')`. Ver [ADR 011](../adrs/011_notificacoes_web_via_supabase_realtime.md).

### user_opportunity_status

Ações do revendedor: `bought` (comprei) ou `dismissed` (não tenho interesse). Oportunidades dismissed são ocultadas do dashboard.

### subscriptions

Assinaturas Stripe. Trigger `tr_sync_plan` propaga mudança de plano para `profiles.plan`.

### favorite_sellers (F14)

Vendedores favoritos por plataforma (Shopee/TikTok). UNIQUE em `(user_id, platform, seller_username)`. Campos `is_live`, `last_live_at`, `last_checked_at` atualizados pelo Live Monitor.

### live_alerts (F14)

Alertas de início de live. Status: `sent`, `read`, `skipped_limit`, `skipped_silence`, `failed` (check constraint atualizado na migration [`0006_alerts_read_status.sql`](../../supabase/migrations/0006_alerts_read_status.sql)). Campo `clicked_at` para tracking de engajamento (coletado desde o dia 1, UI de métricas pós-MVP). Publicada em `supabase_realtime` para alimentar o badge de não-lidos.

### price_history

Histórico de preços (investimento invisível para F08 futuro). Retenção: 90 dias (cleanup diário).

### marketplace_fees

Lookup de taxas médias por marketplace + categoria. Seed: ML 15%, Magalu 16% (categoria `default`).

## Lógica de Negócio

### Planos e Limites

```typescript
const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:    { maxInterests: 5,        maxAlertsPerDay: 5,        scanIntervalMin: 120, historyDays: 7,  maxFavoriteSellers: 3,        liveAlertsUnlimited: false },
  starter: { maxInterests: Infinity, maxAlertsPerDay: Infinity, scanIntervalMin: 30,  historyDays: 30, maxFavoriteSellers: 15,       liveAlertsUnlimited: true  },
  pro:     { maxInterests: Infinity, maxAlertsPerDay: Infinity, scanIntervalMin: 5,   historyDays: 90, maxFavoriteSellers: Infinity,  liveAlertsUnlimited: true  },
};
```

Limites verificados **no backend** (Server Actions / Scanner Functions), nunca apenas no frontend.

### Cálculo de Margem (F03)

- **Custo de aquisição:** `price + freight`
- **Margem líquida por canal:** `((market_price × (1 - fee_pct/100)) - custo_aquisição) / custo_aquisição × 100`
- **margin_best:** Melhor margem entre todos os canais (armazenada em `opportunities`)
- **Modo average:** Usa `fee_pct` de `marketplace_fees`
- **Modo custom:** Frontend recalcula com `resale_fee_pct` do perfil

### Quality Badge

| margin_best | quality | Badge |
|-------------|---------|-------|
| ≥ 40% | `exceptional` | Excepcional |
| ≥ 25% | `great` | Ótima |
| ≥ 15% | `good` | Boa |
| < 15% | NULL | Sem badge (descartada) |

### HOT Flag

Top 30% de `margin_best` entre oportunidades ativas. Calculado globalmente via `refresh_hot_flags()` a cada 15 min (decisão D1 — não contextual por filtro).

### Contagem de Alertas (FREE)

`alerts_sent_today(user_id)` conta ofertas (`alerts`) + lives (`live_alerts`) no dia (timezone `America/Sao_Paulo`). Limite FREE: 5 alertas/dia totais.

## Functions PostgreSQL

| Function | Responsabilidade |
|----------|-----------------|
| `handle_new_user()` | Trigger: cria profile no signup |
| `alerts_sent_today(uuid)` | Conta alertas ofertas + lives do dia |
| `refresh_hot_flags()` | Recalcula flag HOT (percentil 70) |
| `set_updated_at()` | Auto-update `updated_at` em triggers |
| `sync_profile_plan()` | Propaga plano de subscriptions → profiles |

## Extensões

- `pg_trgm` — Busca textual por similaridade (matching de interesses, threshold ≥ 0.3)

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [05-development-workflow.md](05-development-workflow.md) | Próximo: [07-security.md](07-security.md)*
