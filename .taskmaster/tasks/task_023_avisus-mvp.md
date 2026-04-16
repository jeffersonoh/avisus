# Task ID: 23

**Title:** Server Actions: CRUD de favorite_sellers com limites de plano

**Status:** pending

**Dependencies:** 8, 16

**Priority:** high

**Description:** Mutações para vendedores favoritos validando URL, normalizando username e bloqueando em `maxFavoriteSellers` (3/15/∞).

**Details:**

Contexto:
- Equivalente a T-042 (tasks.md). F14 (RF-52/57) + CA-22.

Escopo:
- Server Actions `addFavoriteSeller`, `removeFavoriteSeller`, `listFavoriteSellers`.
- Extrair `platform` + `seller_username` da URL.
- Enforcement: `COUNT` vs `PLAN_LIMITS[plan].maxFavoriteSellers`.

Fora de escopo:
- Polling de status (T-070/T-071).

Implementação:
- Arquivos/módulos: `src/features/favorites/actions.ts`, helpers de parsing em `src/lib/scanner/live/url-parser.ts`.
- Regras e validações: Zod valida URL por domínio; constraint `UNIQUE (user_id, platform, seller_username)`.

Critérios de pronto:
- 4º favorito em FREE bloqueado (CA-22).
- Remover favorito libera vaga.

**Test Strategy:**

Cenários de teste:
- [ ] URL Shopee válida cria registro.
- [ ] Duplicata no mesmo usuário rejeita.
- [ ] Quarto em FREE → `LIMIT_REACHED`.

Validações técnicas:
- [ ] `seller_username` minúsculo.
- [ ] `seller_url` preservada como entrada normalizada.

## Subtasks

### 23.1. Implementar Server Action 'addFavoriteSeller' com validação e limites de plano

**Status:** pending  
**Dependencies:** None  

Criar a Server Action para adicionar um vendedor favorito. A ação deve validar a URL fornecida, extrair a plataforma e o nome de usuário do vendedor, normalizá-los e verificar se o usuário não excedeu o limite de vendedores do seu plano.

**Details:**

A implementação será feita em `src/features/favorites/actions.ts`. Usar Zod para validar o formato da URL e o domínio. O nome de usuário do vendedor deve ser normalizado para minúsculas. Antes da inserção, verificar a contagem atual de vendedores favoritos contra o limite definido em `PLAN_LIMITS`. Retornar um erro tipado como `LIMIT_REACHED` se o limite for excedido.

### 23.2. Implementar Server Action 'removeFavoriteSeller'

**Status:** pending  
**Dependencies:** 23.1  

Desenvolver a Server Action que permite a um usuário remover um vendedor da sua lista de favoritos. A ação deve receber o ID do registro a ser removido e garantir que o usuário só possa apagar seus próprios registros.

**Details:**

Implementar `removeFavoriteSeller` em `src/features/favorites/actions.ts`. A função receberá o `id` do vendedor favorito como argumento, verificará se o `user_id` do registro corresponde ao do usuário autenticado e, em caso positivo, o removerá do banco de dados. Chamar `revalidatePath` para atualizar a interface.

### 23.3. Implementar Server Action 'listFavoriteSellers' para consulta na UI

**Status:** pending  
**Dependencies:** 23.1  

Criar a Server Action para listar todos os vendedores favoritos do usuário atualmente autenticado. Esta função será consumida pelos componentes da UI para exibir a lista de vendedores salvos.

**Details:**

Implementar `listFavoriteSellers` no arquivo `src/features/favorites/actions.ts`. A função deve realizar uma consulta ao banco de dados para buscar todos os registros da tabela `favorite_sellers` que correspondam ao `user_id` do usuário logado, retornando a lista para a UI.
