# Task ID: 18

**Title:** Feature plans com Stripe Checkout

**Status:** done

**Dependencies:** 12

**Priority:** high

**Description:** Página comparativa FREE/STARTER/PRO com botões que abrem Stripe Checkout usando `STRIPE_PRICE_STARTER_MONTHLY` e `STRIPE_PRICE_PRO_MONTHLY`.

**Details:**

Contexto:
- Equivalente a T-036 (tasks.md). F06 do PRD (RF-16/17/17.1/18).

Escopo:
- `src/features/plans/`: `PlanComparison.tsx`, `hooks.ts`.
- Botões por plano abrem Stripe Checkout (modo test em staging).
- Exibir limites de cada plano de forma didática.

Fora de escopo:
- Webhook e sync de plano (T-082).

Implementação:
- Arquivos/módulos: `src/features/plans/*.tsx`, `src/app/(app)/planos/page.tsx`, Server Action `createCheckoutSession`.
- Regras e validações: criar Stripe Customer por usuário se não existir; anexar `user_id` no metadata.

Critérios de pronto:
- Fluxo test mode documentado no README.
- Após checkout bem-sucedido, usuário volta a `/dashboard` com plano atualizado (via webhook).

**Test Strategy:**

Cenários de teste:
- [ ] Clicar em STARTER abre Stripe Checkout no modo test.
- [ ] Usuário PRO não vê botão "Fazer upgrade".
- [ ] Sessão Stripe carrega com dados pré-preenchidos (email).

Validações técnicas:
- [ ] `STRIPE_SECRET_KEY` apenas no servidor.
- [ ] `metadata.user_id` presente na sessão para o webhook.

## Subtasks

### 18.1. Criar UI de Comparação de Planos (Free, Starter, Pro)

**Status:** done  
**Dependencies:** None  

Desenvolver o componente React `PlanComparison.tsx` que exibe uma tabela ou cartões comparando os recursos e limites dos planos Free, Starter e Pro, com botões de ação correspondentes.

**Details:**

Criar o arquivo em `src/features/plans/PlanComparison.tsx`. A UI deve ser responsiva e apresentar didaticamente os limites de cada plano, como vendedores favoritos e alertas. Utilizar dados estáticos ou de um arquivo de configuração para preencher os detalhes dos planos.

### 18.2. Implementar Server Action `createCheckoutSession` para o Stripe

**Status:** done  
**Dependencies:** None  

Criar uma Server Action segura que recebe o ID do plano, interage com a API do Stripe para criar uma sessão de checkout e retorna a URL de redirecionamento para o pagamento.

**Details:**

A Server Action deve obter o usuário autenticado, criar ou buscar um Stripe Customer ID associado, usar as variáveis de ambiente `STRIPE_PRICE_*_MONTHLY` para iniciar a sessão e anexar o `user_id` nos metadados da sessão Stripe para rastreamento.

### 18.3. Conectar Botões da UI de Planos à Server Action de Checkout

**Status:** done  
**Dependencies:** 18.1, 18.2  

Integrar os botões 'Fazer upgrade' do componente `PlanComparison.tsx` para que invoquem a Server Action `createCheckoutSession` e redirecionem o usuário para a página de checkout do Stripe.

**Details:**

Adicionar um manipulador de eventos `onClick` aos botões na UI. Este manipulador chamará a Server Action, passando o ID do plano selecionado. Após receber a URL de checkout, o cliente deve ser redirecionado para a página do Stripe.
