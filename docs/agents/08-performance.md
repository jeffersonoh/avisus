# 08-performance.md: Performance

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [03-architecture.md](03-architecture.md) | [10-data-management.md](10-data-management.md)

## Visão Geral

Estratégias de performance do Avisus cobrindo frontend (Web Vitals, paginação, cache), backend (índices, batching, deduplicação) e os pipelines de scanner e live monitor.

## Metas

| Métrica | Alvo |
|---------|------|
| LCP (mobile 4G) | < 2.5s |
| API P95 | < 500ms |
| Detecção oferta → notificação | < 10 min (planos pagos) |
| Início live → alerta | < 2 min (RF-54) |
| Perfis simultâneos | 10.000 sem degradação |
| Lighthouse mobile | > 80 |

## Frontend

| Estratégia | Detalhe |
|-----------|---------|
| Server Components | Dashboard carrega dados no servidor, sem waterfall client-side |
| Streaming / Suspense | `loading.tsx` por rota com skeleton |
| Code splitting | Automático por rota (Next.js App Router) |
| Imagens | `next/image` com lazy loading, placeholder blur, otimização automática |
| Paginação | Infinite scroll (20 itens/página) via **keyset pagination** (`detected_at` + `id` como cursor) |
| Data fetching client | TanStack Query v5 para mutations, cache e revalidação em **Client Components** (`staleTime`: 30s dashboard, 24h IBGE). Server Components usam Supabase client diretamente |
| Tema | Tailwind `dark:` class strategy — sem re-render |

### Keyset Pagination

Evita degradação com volume crescente (diferente de OFFSET):

```typescript
const query = supabase
  .from('opportunities')
  .select('*, channel_margins(*)', { count: 'exact' })
  .eq('status', 'active')
  .order('detected_at', { ascending: false })
  .order('id')
  .limit(PAGE_SIZE); // 20

if (cursor?.detectedAt) {
  query.lt('detected_at', cursor.detectedAt);
}
```

## Backend — Índices

| Índice | Tabela | Tipo | Propósito |
|--------|--------|------|-----------|
| `idx_products_name_trgm` | products | GIN (trigram) | Busca textual por similaridade |
| `idx_opp_name_trgm` | opportunities | GIN (trigram) | Matching secundário de interesses |
| `idx_opp_active` | opportunities | Parcial (`status = 'active'`) | Dashboard queries |
| `idx_opp_margin` | opportunities | Parcial (`status = 'active'`) DESC | Ordenação por margem |
| `idx_opp_detected` | opportunities | DESC | Paginação keyset |
| `idx_ph_product_time` | price_history | Composto | Tendências por produto |
| `idx_interests_scan` | interests | Parcial (`active = TRUE`) | Elegibilidade de scan |
| `idx_fav_sellers_live_check` | favorite_sellers | Parcial (`is_live = FALSE`) | Live Monitor |
| `idx_profiles_plan` | profiles | B-tree | Lookup por plano |
| `idx_interests_user_active` | interests | Parcial (`active = TRUE`) | Interesses ativos do usuário |
| `idx_alerts_user` | alerts | Composto DESC | Lista de alertas do usuário |
| `idx_alerts_pending` | alerts | Parcial (`status IN ('pending','silenced')`) | Retry de envio |
| `idx_subs_user` | subscriptions | B-tree | Assinatura do usuário |
| `idx_fav_sellers_user` | favorite_sellers | B-tree | Favoritos do usuário |
| `idx_live_alerts_user` | live_alerts | Composto DESC | Alertas live do usuário |
| `idx_live_alerts_seller` | live_alerts | Composto DESC | Alertas por seller |

## Backend — Deduplicação

- **Oportunidades:** UNIQUE `(marketplace, external_id)` + `ON CONFLICT DO NOTHING`
- **Alertas:** UNIQUE `(user_id, opportunity_id)` — sem alertas duplicados por oportunidade
- **Channel margins:** UNIQUE `(opportunity_id, channel)` — uma margem por canal

## Scanner Pipeline — Batching

- **Lotes:** 20 termos por invocação da function (300s timeout)
- **Paralelismo:** 3 requests simultâneos
  - ML API: ~200ms/request
  - Magalu via ScrapingBee: ~3-5s/request
- **Frequência por plano:** Respeita `last_scanned_at` × `scanIntervalMin` (FREE: 120 min, STARTER: 30 min, PRO: 5 min)
- **Termos pendentes:** Se o lote não terminar em 300s, processados na próxima invocação (5 min)
- **Idempotência:** UNIQUE constraints garantem que re-scans não duplicam dados

## Live Monitor — Throughput

- **Cron:** A cada 2 min (Vercel Function, maxDuration: 30s)
- **Batch:** Até 50 sellers por invocação; > 50 → processamento rotativo (metade a cada invocação)
- **Transição:** `is_live: false→true` dispara alerta imediato via Telegram
- **Regra CA-24:** Lives são efêmeras — alertas em silêncio NÃO são enfileirados
- **Anti-bloqueio:** Headers padrão browser, delays aleatórios 100-500ms entre requests, ScrapingBee como fallback
- **Stale detection:** `is_live = false` se `last_checked_at > 1h` sem confirmação

## HOT Flag

Materializado a cada 15 min via `refresh_hot_flags()` (RPC Supabase). Evita cálculo em tempo real por filtro do usuário.

## Rate Limiting

- **Alertas diários:** `alerts_sent_today()` no DB (conta ofertas + lives) — sem Redis
- **Telegram:** 30 msgs/segundo (rate limit da API)
- **ML API:** 10.000 req/hora
- **ScrapingBee:** 10 requests concorrentes

## Retenção / Cleanup

Cron diário às 3h (UTC-3) (`/api/cron/cleanup`):
1. Expirar oportunidades (`expires_at < NOW()` ou `detected_at > 7 dias`)
2. DELETE `price_history` > 90 dias
3. DELETE oportunidades expiradas > 30 dias (cascade em `channel_margins`, `alerts`)
4. Reset `is_live = false` se `last_checked_at > 1h`

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [07-security.md](07-security.md) | Próximo: [09-integrations.md](09-integrations.md)*
