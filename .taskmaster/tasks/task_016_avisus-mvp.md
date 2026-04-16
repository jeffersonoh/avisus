# Task ID: 16

**Title:** Feature favorites — CRUD de vendedores favoritos (F14)

**Status:** pending

**Dependencies:** 12

**Priority:** high

**Description:** UI para cadastrar/remover vendedores Shopee/TikTok por URL, listar com status offline/ao vivo e respeitar limites por plano (3/15/∞).

**Details:**

Contexto:
- Equivalente a T-034 (tasks.md). F14 do PRD (RF-52, 57, 58).

Escopo:
- `src/features/favorites/`: `FavoriteSellerList.tsx`, `AddSellerForm.tsx`, `hooks.ts`.
- Input de URL com validação Zod (`https://shopee.com.br/<username>` / `https://www.tiktok.com/@<username>`).
- Status visual: offline, ao vivo (com tempo desde `last_live_at`).
- Limite por plano com CTA upgrade.

Fora de escopo:
- Polling de status (T-070/T-071).
- Envio de alerta (T-060/T-071).

Implementação:
- Arquivos/módulos: `src/features/favorites/*.tsx`, `src/app/(app)/favoritos/page.tsx`.
- Regras e validações: extrair `seller_username` e `platform` da URL; normalizar para minúsculas; bloquear duplicatas (`UNIQUE (user_id, platform, seller_username)`).

Critérios de pronto:
- Cadastro via URL Shopee/TikTok cria favorito válido.
- Quarto favorito em FREE bloqueado (CA-22).
- Lista reflete status em tempo real da tabela.

**Test Strategy:**

Cenários de teste:
- [ ] Adicionar URL Shopee válida cria favorito.
- [ ] FREE: 4º favorito bloqueia com CTA upgrade.
- [ ] URL inválida mostra erro inline.

Validações técnicas:
- [ ] Zod valida domínio e path.
- [ ] Duplicata retorna erro amigável.

## Subtasks

### 16.1. Criar Formulário de Adição de Vendedor (`AddSellerForm`) com Validação de URL

**Status:** pending  
**Dependencies:** None  

Implementar o componente `AddSellerForm.tsx` para permitir que usuários adicionem vendedores favoritos via URL da Shopee ou TikTok. A validação do formato da URL será feita com Zod.

**Details:**

O formulário deve conter um campo de texto para a URL. Utilizar Zod para validar o input, garantindo que a URL corresponda aos formatos `https://shopee.com.br/<username>` ou `https://www.tiktok.com/@<username>`. Implementar a extração do `seller_username` e `platform` da URL.

### 16.2. Desenvolver a Lista de Vendedores Favoritos (`FavoriteSellerList`) com Status

**Status:** pending  
**Dependencies:** 16.1  

Criar o componente `FavoriteSellerList.tsx` que busca e exibe a lista de vendedores favoritos do usuário. Cada item deve mostrar o nome do vendedor, plataforma e status (offline ou ao vivo, com o tempo desde `last_live_at`).

**Details:**

O componente usará um hook `useFavoriteSellers` para buscar os dados. O status 'ao vivo' deve ser destacado e exibir há quanto tempo a live começou. Implementar um botão de remoção para cada vendedor.

### 16.3. Implementar Lógica de UI para Limites de Plano e Estado Vazio

**Status:** pending  
**Dependencies:** 16.1, 16.2  

Integrar a lógica de limite de plano no formulário e na lista. Desabilitar o formulário quando o limite for atingido (ex: 3 no plano FREE) com um CTA para upgrade. Mostrar um estado vazio quando não houver vendedores.

**Details:**

O hook de favoritos deve retornar a contagem atual e o limite do plano. Com base nisso, o `AddSellerForm` será desabilitado e exibirá um CTA. O `FavoriteSellerList` renderizará um componente de estado vazio se a lista estiver vazia.
