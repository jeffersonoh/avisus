# 10-data-management.md: Gestão de Dados

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [06-domain-model.md](06-domain-model.md) | [08-performance.md](08-performance.md)

## Visão Geral

Gestão de dados do Avisus em Supabase PostgreSQL 15+ (free tier: 500 MB). Cobre schema management, migrações, retenção, cleanup e convenções de dados.

## Supabase como Plataforma de Dados

| Componente | Uso |
|-----------|-----|
| PostgreSQL 15+ | Banco de dados principal |
| Auth | Autenticação (email + Google) |
| RLS | Autorização row-level |
| Generated Types | `supabase gen types typescript` → `src/types/database.ts` |
| Extensões | `pg_trgm` (busca por similaridade) |

### Free Tier Limits

| Recurso | Limite |
|---------|--------|
| Database | 500 MB |
| MAU auth | 50K |
| Bandwidth | 2 GB |
| File storage | 1 GB |

**Monitoramento:** Quando DB > 400 MB, planejar cleanup ou upgrade para Supabase Pro ($25/mês).

## Migrações

- Armazenadas em `supabase/migrations/`
- Aplicadas manualmente: `npx supabase db push` (antes de cada deploy)
- Dev local: `npx supabase start` inicia PostgreSQL + Auth + Dashboard
- Rollback: Script SQL por migration (manual)

### Workflow de Migration

```bash
# Criar nova migration
npx supabase migration new nome_da_migration

# Editar SQL gerado em supabase/migrations/
# Testar localmente
npx supabase db reset

# Aplicar em staging/prod
npx supabase db push
```

## Retenção de Dados

| Tabela | Política de Retenção |
|--------|---------------------|
| `price_history` | 90 dias (cleanup diário) |
| `opportunities` (ativas) | Até expirar ou 7 dias sem `expires_at` |
| `opportunities` (expiradas) | 30 dias após expiração (cascade deleta channel_margins, alerts) |
| `live_alerts` | Sem cleanup no MVP (volume baixo) |
| `alerts` | Cascade com opportunities (30 dias após expiração) |
| `profiles`, `interests`, `subscriptions` | Permanente (ou até exclusão da conta) |
| `favorite_sellers` | Permanente (ou até remoção pelo usuário) |
| `marketplace_fees` | Permanente (lookup estático editável) |

## Cleanup Cron

Executa diariamente às 3h (UTC-3) (`/api/cron/cleanup`):

```sql
-- 1. Expirar oportunidades ativas
UPDATE opportunities SET status = 'expired'
WHERE status = 'active'
  AND (expires_at < NOW() OR detected_at < NOW() - INTERVAL '7 days');

-- 2. Limpar price_history antigo
DELETE FROM price_history WHERE recorded_at < NOW() - INTERVAL '90 days';

-- 3. Remover expiradas antigas (cascade em channel_margins, alerts)
DELETE FROM opportunities
WHERE status = 'expired' AND detected_at < NOW() - INTERVAL '30 days';

-- 4. Reset live status stale
UPDATE favorite_sellers SET is_live = false
WHERE is_live = true AND last_checked_at < NOW() - INTERVAL '1 hour';
```

## Convenções de Dados

### Percentuais

Formato percentual em todas as colunas `*_pct` e JSONB: `15.00 = 15%`, nunca `0.15`.

### Timestamps

- Todas as colunas temporais usam `TIMESTAMPTZ`
- Timezone padrão: UTC no banco, `America/Sao_Paulo` para lógica de negócio (alertas diários)
- `created_at` em todas as tabelas com `DEFAULT NOW()`
- `updated_at` com trigger `set_updated_at()` em tabelas que mudam

### UUIDs

- Primary keys são UUID (`gen_random_uuid()`) em todas as tabelas
- Exceção: `price_history.id` é `BIGINT GENERATED ALWAYS AS IDENTITY` (volume alto)

### Deduplicação

| Tabela | UNIQUE Constraint |
|--------|------------------|
| `products` | `(marketplace, external_id)` |
| `opportunities` | `(marketplace, external_id)` |
| `interests` | `(user_id, LOWER(term))` — index funcional |
| `alerts` | `(user_id, opportunity_id)` |
| `channel_margins` | `(opportunity_id, channel)` |
| `favorite_sellers` | `(user_id, platform, seller_username)` |
| `marketplace_fees` | PK `(marketplace, category)` |
| `user_opportunity_status` | PK `(user_id, opportunity_id)` |

### Upsert Pattern (Scanner)

```sql
INSERT INTO products (marketplace, external_id, name, ...)
VALUES (...)
ON CONFLICT (marketplace, external_id) DO UPDATE
SET last_price = EXCLUDED.last_price, last_seen_at = NOW()
RETURNING id;

INSERT INTO opportunities (marketplace, external_id, ...)
VALUES (...)
ON CONFLICT (marketplace, external_id) DO NOTHING;
```

## Seed Data

### marketplace_fees (valores iniciais)

```sql
INSERT INTO marketplace_fees (marketplace, category, fee_pct) VALUES
  ('Mercado Livre',  'default', 15.00),
  ('Magazine Luiza', 'default', 16.00);
```

### Dados de Teste (Dev Local)

Seed SQL derivado dos `MOCK_OPPORTUNITIES` do protótipo (`src/prototype.jsx`). Executado via `supabase/seed.sql` no `supabase start`.

## Backup e Recuperação

- **Supabase free tier:** Point-in-time recovery não disponível
- **Mitigação:** Migrations versionadas + seed data. Em caso de perda, `supabase db reset` recria o schema
- **Dados de usuário:** Aceitar o risco no MVP; upgrade para Supabase Pro para backups automáticos se necessário

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [09-integrations.md](09-integrations.md) | Próximo: [11-ai-collaboration.md](11-ai-collaboration.md)*
