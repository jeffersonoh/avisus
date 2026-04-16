# Task ID: 13

**Title:** Feature dashboard — ProductCard, DetailModal, FilterPanel, OpportunityList

**Status:** pending

**Dependencies:** 12

**Priority:** high

**Description:** Implementar componentes da feature dashboard migrados do protótipo, com dados mockados inicialmente (substituídos após Server Actions).

**Details:**

Contexto:
- Equivalente a T-031 (tasks.md). Superfície principal de valor ao usuário.

Escopo:
- `src/features/dashboard/`: `ProductCard.tsx`, `ProductDetailModal.tsx`, `FilterPanel.tsx`, `OpportunityList.tsx`, `hooks.ts` (`useOpportunities`, `useFilters`).
- Filtros: categoria, marketplace, faixa de desconto, margem, região (RF-13).
- Ordenação: melhor margem, desconto, data (RF-14).
- Filtros e ordenação conectados a querystring.

Fora de escopo:
- Conexão real com Supabase (T-090).
- Ações comprei/dismissed (parte de evolução via `user_opportunity_status`).

Implementação:
- Arquivos/módulos: `src/features/dashboard/*.tsx`, `src/app/(app)/dashboard/page.tsx` (Server Component placeholder), `src/app/(app)/dashboard/components.tsx` (Client Components).
- Regras e validações: lista virtualizada opcional; cada card expõe campos RF-10 (custo aquisição, melhor margem, canal).

Critérios de pronto:
- Filtros e ordenação refletem na querystring.
- Modal detalha canais de revenda (expansão RF-09.1).

**Test Strategy:**

Cenários de teste:
- [ ] Alterar filtro atualiza URL e lista.
- [ ] Ordenação por margem funciona.
- [ ] Modal abre com detalhes e fecha com ESC.

Validações técnicas:
- [ ] Querystring tipada com Zod ou schema simples.
- [ ] Sem fetch no Client Component (dados virão do Server Component).

## Subtasks

### 13.1. Implementar Componente `ProductCard` para Exibição de Oportunidades

**Status:** pending  
**Dependencies:** None  

Criar o componente de UI `ProductCard.tsx` para exibir as informações essenciais de uma única oportunidade de produto, como custo de aquisição, melhor margem e canal, usando dados mockados.

**Details:**

O componente deve ser criado em `src/features/dashboard/ProductCard.tsx`. Ele receberá as propriedades de uma oportunidade e renderizará os campos definidos em RF-10, seguindo o design do protótipo.

### 13.2. Implementar Modal de Detalhes do Produto (`ProductDetailModal`)

**Status:** pending  
**Dependencies:** 13.1  

Desenvolver o componente `ProductDetailModal.tsx` que será exibido ao clicar em um `ProductCard`. O modal deve mostrar informações detalhadas do produto, incluindo os canais de revenda conforme RF-09.1.

**Details:**

Criar o arquivo `src/features/dashboard/ProductDetailModal.tsx`. A lógica de abertura/fechamento será controlada pelo componente pai. O modal deve poder ser fechado com a tecla ESC e ao clicar fora.

### 13.3. Implementar Painel de Filtros e Ordenação (`FilterPanel`)

**Status:** pending  
**Dependencies:** None  

Criar o componente `FilterPanel.tsx` contendo todos os controles de filtro (categoria, marketplace, desconto, margem, região) e ordenação (melhor margem, desconto, data) conforme RF-13 e RF-14.

**Details:**

Localizar o componente em `src/features/dashboard/FilterPanel.tsx`. Implementar os inputs, selects e botões necessários. O estado dos filtros será gerenciado por um hook (`useFilters`).

### 13.4. Montar `OpportunityList` e Sincronizar Filtros com a Querystring da URL

**Status:** pending  
**Dependencies:** 13.1, 13.3  

Compor o componente `OpportunityList.tsx` que renderiza uma lista de `ProductCard`. Conectar o `FilterPanel` para que as alterações de filtro e ordenação atualizem a lista de oportunidades e sejam refletidas na querystring da URL.

**Details:**

Criar `src/features/dashboard/OpportunityList.tsx`. Utilizar hooks `useOpportunities` e `useFilters` para gerenciar os dados. Implementar a lógica para ler os parâmetros da URL na montagem e atualizá-los quando os filtros mudarem.
