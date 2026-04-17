# Task ID: 30

**Title:** Writer `products` + `price_history` para coleta histórica (pré-F08)

**Status:** done

**Dependencies:** 29

**Priority:** high

**Description:** Inserir snapshot em `price_history` a cada detecção e upsert em `products`, alimentando o futuro score (F08).

**Details:**

Contexto:
- Equivalente a T-055 (tasks.md). Tech Spec §Coleta de dados (F08 futuro).

Escopo:
- `src/lib/scanner/writers/products.ts`: upsert com `ON CONFLICT (marketplace, external_id) DO UPDATE SET last_price, last_seen_at`.
- Inserir `price_history` sempre que oportunidade for detectada.

Fora de escopo:
- Retenção (T-081/cleanup).

Implementação:
- Arquivos/módulos: `src/lib/scanner/writers/products.ts`, `src/lib/scanner/writers/price-history.ts`.
- Regras e validações: salvar `units_sold` quando disponível; `discount_pct` em formato percentual.

Critérios de pronto:
- Cada scan insere ao menos uma linha em `price_history` por produto novo/atualizado.
- Sem duplicidade em `products`.

**Test Strategy:**

Cenários de teste:
- [x] Primeiro scan insere product + price_history.
- [x] Segundo scan do mesmo produto atualiza `last_seen_at` e cria novo snapshot.

Validações técnicas:
- [x] `price_history` nunca é atualizado, apenas insert.
- [x] `units_sold` opcional, mas persistido quando vier.

## Subtasks

### 30.1. Implementar writer para a tabela `products` com lógica de upsert

**Status:** done  
**Dependencies:** None  

Criar o writer em `src/lib/scanner/writers/products.ts` que realiza um `upsert` na tabela `products`. A operação deve usar `ON CONFLICT (marketplace, external_id) DO UPDATE` para atualizar `last_price` e `last_seen_at`, evitando registros duplicados.

**Details:**

Modificar o arquivo `src/lib/scanner/writers/products.ts` para implementar a query de upsert. A chave de conflito é `(marketplace, external_id)`. Os campos a serem atualizados são `last_price` e `last_seen_at`. A operação deve ser otimizada para inserção em lote.

### 30.2. Implementar writer para a tabela `price_history`

**Status:** done  
**Dependencies:** 30.1  

Criar o writer em `src/lib/scanner/writers/price-history.ts` que sempre insere um novo registro (snapshot) na tabela `price_history` para cada produto detectado ou atualizado pelo scanner. Este writer não deve atualizar registros existentes.

**Details:**

Modificar o arquivo `src/lib/scanner/writers/price-history.ts`. A implementação deve focar em uma operação de `INSERT` em lote. Para cada produto processado, um novo registro de histórico deve ser criado, contendo o `product_id` correspondente, preço e a data do scan.
