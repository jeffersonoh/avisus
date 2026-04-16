# Task ID: 46

**Title:** Dashboard SSR com paginação keyset e filtros RF-13/14

**Status:** pending

**Dependencies:** 13, 31

**Priority:** high

**Description:** Render Server Components com paginação keyset (`detected_at`, `id`), page size 20, filtros RF-13 e ordenação RF-14, meta LCP < 2.5s mobile.

**Details:**

Contexto:
- Equivalente a T-090 (tasks.md). F05 parcial + desvio D7 (filtros/silêncio no MVP).

Escopo:
- `src/app/(app)/dashboard/page.tsx` Server Component.
- Paginação keyset (ver Tech Spec exemplo).
- Filtros: categoria, marketplace, faixa desconto, margem, região, frete; ordenação por margem/desconto/data.

Fora de escopo:
- Tendências/sazonalidade/volume/score (D5/D6).

Implementação:
- Arquivos/módulos: `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/dashboard/components.tsx`.
- Regras e validações: querystring tipada; filtros de `dismissed` via subconsulta em `user_opportunity_status`; cache server por 30s.

Critérios de pronto:
- Meta LCP < 2.5s em mobile (monitorar com Lighthouse em staging).
- Filtros não quebram paginação.

**Test Strategy:**

Cenários de teste:
- [ ] Filtrar margem > 30% exibe apenas qualificadas.
- [ ] Paginar 3 páginas consecutivas com keyset.
- [ ] Usuário com `dismissed` oculta itens.

Validações técnicas:
- [ ] LCP < 2.5s em Lighthouse Mobile.
- [ ] Nenhuma chamada N+1.

## Subtasks

### 46.1. Construir Query Dinâmica para Filtros e Ordenação no Dashboard

**Status:** pending  
**Dependencies:** None  

Implementar no Server Component (`/dashboard/page.tsx`) a lógica para construir uma query Supabase que aplica dinamicamente os filtros (categoria, marketplace, etc.) e a ordenação (margem, desconto, data) com base nos parâmetros da querystring.

**Details:**

Utilizar o cliente Supabase para montar a query. Ler os parâmetros da URL (`searchParams`), validá-los (preferencialmente com Zod) e aplicar `eq`, `gte`, `lte`, e `order` na consulta à tabela de oportunidades.

### 46.2. Implementar Paginação Keyset com Cursor (detected_at, id)

**Status:** pending  
**Dependencies:** 46.1  

Adicionar a lógica de paginação keyset (seek-based) na query do dashboard. A paginação usará um cursor composto pela tupla `(detected_at, id)` para buscar a próxima página de resultados de forma performática.

**Details:**

O cursor será passado via querystring (e.g., `?cursor=...`). A cláusula WHERE da query precisará ser modificada para `(detected_at, id) > (cursor_detected_at, cursor_id)` ou `<` dependendo da ordenação. O tamanho da página será fixo em 20.

### 46.3. Integrar Filtro para Excluir Itens Dispensados pelo Usuário

**Status:** pending  
**Dependencies:** 46.1  

Modificar a query do dashboard para excluir as oportunidades que o usuário marcou como 'dispensadas'. Isso será feito através de uma subconsulta ou um `LEFT JOIN` com a tabela `user_opportunity_status`.

**Details:**

A query principal deve ser ajustada para incluir uma cláusula como `WHERE NOT EXISTS (SELECT 1 FROM user_opportunity_status uos WHERE uos.opportunity_id = opportunities.id AND uos.user_id = 'current_user_id' AND uos.status = 'dismissed')` ou um `LEFT JOIN ... WHERE uos.status IS NULL`.
