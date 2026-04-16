# Task ID: 47

**Title:** Integrar TanStack Query no client com cache consistente

**Status:** pending

**Dependencies:** 17, 46

**Priority:** medium

**Description:** Adicionar TanStack Query para mutations e caching onde fizer sentido: `staleTime` 30s no dashboard, 24h no IBGE.

**Details:**

Contexto:
- Equivalente a T-091 (tasks.md). Melhora UX sem refetch agressivo.

Escopo:
- Provider Query client no layout.
- Migrar hooks `useOpportunities`, `useIBGE`, `useProfile` para `useQuery`.
- Mutations com invalidation adequada.

Fora de escopo:
- SWR / outras libs.

Implementação:
- Arquivos/módulos: `src/lib/query-client.ts`, uso nos hooks das features.
- Regras e validações: `staleTime` documentado; invalidation por tag (`['opportunities']`, `['ibge', uf]`).

Critérios de pronto:
- Navegação entre rotas reaproveita cache.
- Mutações ativas invalidation correta.

**Test Strategy:**

Cenários de teste:
- [ ] Abrir/fechar modal sem trigger de refetch.
- [ ] Salvar perfil invalida `['profile']`.

Validações técnicas:
- [ ] `staleTime` e `gcTime` configurados.
- [ ] Nenhum loop de refetch.

## Subtasks

### 47.1. Configurar o QueryClientProvider na Aplicação

**Status:** pending  
**Dependencies:** None  

Instalar a biblioteca @tanstack/react-query e envolver o layout raiz da aplicação com o QueryClientProvider para disponibilizar o cliente de query para todos os componentes.

**Details:**

Criar uma instância de QueryClient em 'src/lib/query-client.ts'. No componente de layout principal, importar e usar o QueryClientProvider para envolver os componentes filhos, passando a instância do cliente.

### 47.2. Migrar Hooks de Busca de Dados para useQuery

**Status:** pending  
**Dependencies:** 47.1  

Refatorar os hooks existentes que realizam buscas de dados (GET), como useOpportunities, useIBGE e useProfile, para utilizar o hook useQuery, aplicando as estratégias de cache especificadas (staleTime).

**Details:**

Substituir a lógica de fetch manual por useQuery. Configurar `staleTime` de 30s para dashboard (useOpportunities, useProfile) e 24h para IBGE (useIBGE). Utilizar chaves de query ('queryKey') descritivas.

### 47.3. Refatorar Mutações com useMutation e Invalidação de Cache

**Status:** pending  
**Dependencies:** 47.2  

Adaptar as chamadas a Server Actions que modificam dados no servidor para usar o hook useMutation, configurando a invalidação de queries relevantes no callback onSuccess.

**Details:**

Envolver as Server Actions de mutação com o hook useMutation. Na opção `onSuccess` do hook, chamar `queryClient.invalidateQueries` com a queryKey apropriada (ex: ['profile']) para forçar um refetch dos dados atualizados.
