# Task ID: 31

**Title:** Upsert `opportunities` + `channel_margins`

**Status:** pending

**Dependencies:** 28, 30

**Priority:** high

**Description:** Gravar oportunidades com `ON CONFLICT` em `(marketplace, external_id)`, preencher `margin_best`, `quality`, `freight`, `freight_free`, `image_url`, `buy_url` e criar/atualizar `channel_margins`.

**Details:**

Contexto:
- Equivalente a T-056 (tasks.md). Dashboard (T-090) consome essas tabelas.

Escopo:
- `src/lib/scanner/writers/opportunities.ts` com upsert.
- `channel_margins`: `UNIQUE (opportunity_id, channel)`; salvar market_price, fee_pct, net_margin.
- Status `'active'` por padrão; `expires_at` quando disponível.

Fora de escopo:
- Recalcular margens quando `marketplace_fees` mudar (aceitável pós-MVP).

Implementação:
- Arquivos/módulos: `src/lib/scanner/writers/opportunities.ts`.
- Regras e validações: bulk insert quando possível; idempotência garantida por constraints.

Critérios de pronto:
- Dashboard consegue ler `opportunities + channel_margins(*)`.
- Reexecutar scan não duplica oportunidades.

**Test Strategy:**

Cenários de teste:
- [ ] Nova oferta insere opp + 1..N channel_margins.
- [ ] Reprocessar mesma oferta atualiza `margin_best` sem duplicar.

Validações técnicas:
- [ ] `margin_best_channel` bate com o maior `net_margin` em `channel_margins`.
- [ ] `quality` coerente com thresholds.

## Subtasks

### 31.1. Implementar o writer de upsert para a tabela `opportunities`

**Status:** pending  
**Dependencies:** None  

Desenvolver a lógica no arquivo `src/lib/scanner/writers/opportunities.ts` para realizar um `upsert` em lote na tabela `opportunities`, utilizando a constraint `UNIQUE (marketplace, external_id)` para evitar duplicatas e atualizar registros existentes.

**Details:**

A implementação deve usar uma query de inserção em massa (bulk insert) com a cláusula `ON CONFLICT (marketplace, external_id) DO UPDATE` para atualizar campos como `margin_best`, `quality`, `freight`, `image_url`, `buy_url`, e `updated_at`. O status deve ser definido como 'active' por padrão.

### 31.2. Implementar o writer de upsert para a tabela `channel_margins`

**Status:** pending  
**Dependencies:** 31.1  

Criar a lógica para inserir ou atualizar os registros de margens de canal na tabela `channel_margins`, garantindo a associação correta com a oportunidade recém-criada/atualizada e a unicidade da entrada por canal.

**Details:**

Após o `upsert` na tabela `opportunities` retornar os IDs, usar esses IDs para realizar um `upsert` em lote na tabela `channel_margins`. A query deve usar `ON CONFLICT (opportunity_id, channel) DO UPDATE` para atualizar os campos `market_price`, `fee_pct` e `net_margin`.
