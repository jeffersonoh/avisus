# Task ID: 29

**Title:** `opportunity-matcher.ts` — pipeline de matching com throttle por plano

**Status:** pending

**Dependencies:** 26, 27, 28

**Priority:** high

**Description:** Implementar matcher respeitando `last_scanned_at` + `scanIntervalMin` por plano (D4), dedup `UNIQUE (marketplace, external_id)`, matching secundário `pg_trgm ≥ 0.3` e anti-duplicata em `alerts`.

**Details:**

Contexto:
- Equivalente a T-054 (tasks.md). Núcleo do scanner (F02 + F04).

Escopo:
- `src/lib/scanner/opportunity-matcher.ts` orquestra: buscar `interests` elegíveis, chamar clients ML/Magalu, upsert products + price_history, upsert opportunities + channel_margins, match secundário via `similarity()`, criar alerts únicos.
- Atualizar `interests.last_scanned_at` ao fim.

Fora de escopo:
- Envio Telegram (T-060).

Implementação:
- Arquivos/módulos: `src/lib/scanner/opportunity-matcher.ts`.
- Regras e validações: throttle por plano usando `PLAN_LIMITS[plan].scanIntervalMin`; Supabase RPC para `similarity` se necessário; documentar pipeline no response JSON do cron.

Critérios de pronto:
- Response `{ scanned, new_opportunities, alerts_sent }` reflete a execução.
- Interesse sem novidades não produz alerta duplicado.

**Test Strategy:**

Cenários de teste:
- [ ] Usuário FREE com `last_scanned_at` há 30min não é processado (precisa 120min).
- [ ] Oportunidade duplicada não gera segundo alert.
- [ ] Match secundário pega termo semelhante (similarity ≥ 0.3).

Validações técnicas:
- [ ] Sem loop infinito em caso de erro parcial.
- [ ] `last_scanned_at` atualizado apenas após processamento.

## Subtasks

### 29.1. Buscar interesses elegíveis para o scan com throttle por plano

**Status:** pending  
**Dependencies:** None  

Implementar a consulta inicial que seleciona os `interests` aptos para uma nova varredura, baseando-se no `last_scanned_at` e no `scanIntervalMin` associado ao plano do usuário.

**Details:**

A lógica deve consultar a tabela `interests` e juntar com `profiles` para obter o plano. O filtro principal será `now() >= last_scanned_at + interval '1 minute' * PLAN_LIMITS[plan].scanIntervalMin`. Os limites do plano serão importados do módulo `plan-limits.ts`.

### 29.2. Orquestrar chamadas concorrentes aos clientes de marketplace

**Status:** pending  
**Dependencies:** 29.1  

Para cada interesse elegível, disparar as chamadas às APIs dos marketplaces (ex: Mercado Livre, Magalu) de forma concorrente para buscar os produtos. Os resultados devem ser agregados para a próxima etapa.

**Details:**

Utilizar `Promise.allSettled` para invocar os métodos dos clientes de API (ex: `mlClient.search()`). Isso garante que a falha em uma busca não interrompa as outras. Os resultados (sucessos e falhas) devem ser coletados e tratados adequadamente.

### 29.3. Implementar matching primário (dedup) e secundário (similaridade)

**Status:** pending  
**Dependencies:** 29.2  

Processar os produtos obtidos, aplicando a lógica de matching. O matching primário usa `(marketplace, external_id)` para deduplicar. Produtos sem match primário passam por um matching secundário via `pg_trgm` para encontrar similares.

**Details:**

O matching primário será feito contra os produtos já existentes no banco. Para o secundário, será chamada uma função RPC do Supabase (`search_similar_products`) que executa `SELECT id FROM products WHERE similarity(title, query_title) >= 0.3`.

### 29.4. Persistir produtos, históricos de preços e oportunidades

**Status:** pending  
**Dependencies:** 29.3  

Com base nos resultados do matching, realizar o `upsert` dos dados nas tabelas `products` e `price_history`. Em seguida, criar ou atualizar os registros na tabela `opportunities`, calculando as margens de canal.

**Details:**

Usar operações em lote (`bulk upsert`) do Supabase para eficiência. Ao criar uma oportunidade, calcular e preencher o campo `channel_margins` (JSONB) com base nas taxas do marketplace e no preço do produto.

### 29.5. Gerar alertas únicos e atualizar o timestamp do scan

**Status:** pending  
**Dependencies:** 29.4  

Para cada nova oportunidade criada, gerar um alerta na tabela `alerts`, garantindo que não haja duplicatas para o mesmo usuário e oportunidade. Ao final do processamento de um interesse, atualizar seu campo `last_scanned_at`.

**Details:**

Antes de inserir um alerta, fazer uma verificação: `SELECT 1 FROM alerts WHERE opportunity_id = ? AND user_id = ? AND status IN ('pending', 'sent')`. A atualização do `interests.last_scanned_at` para `now()` deve ocorrer mesmo se nenhuma oportunidade for encontrada.
