# Task ID: 45

**Title:** Webhook `/api/stripe/webhook` com verificação e idempotência

**Status:** pending

**Dependencies:** 4, 18

**Priority:** high

**Description:** Receber eventos Stripe (subscription created/updated/deleted), validar assinatura, tratar idempotência e atualizar `subscriptions` → trigger `sync_profile_plan` ajusta `profiles.plan`.

**Details:**

Contexto:
- Equivalente a T-082 (tasks.md). F06.

Escopo:
- `src/app/api/stripe/webhook/route.ts`.
- Verificar assinatura com `STRIPE_WEBHOOK_SECRET`.
- Eventos suportados: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Upsert em `subscriptions` com `stripe_subscription_id` como chave; idempotência por `event.id` em tabela auxiliar opcional (ou ON CONFLICT).

Fora de escopo:
- Portal do cliente (pós-MVP).

Implementação:
- Arquivos/módulos: `src/app/api/stripe/webhook/route.ts`, `src/lib/stripe.ts`.
- Regras e validações: responder 200 rapidamente; trabalho pesado assíncrono se possível; nunca re-processar mesmo evento.

Critérios de pronto:
- Testes com Stripe CLI (`stripe listen`) ou mocks passam.
- Upgrade/downgrade reflete em `profiles.plan`.

**Test Strategy:**

Cenários de teste:
- [ ] `subscription.updated` com plano STARTER → `profiles.plan = 'starter'`.
- [ ] `subscription.deleted` → volta para FREE.
- [ ] Assinatura inválida → 400.

Validações técnicas:
- [ ] `constructEvent` usado para verificar.
- [ ] Logs sem PAN/PII.

## Subtasks

### 45.1. Configurar Route Handler e Verificação de Assinatura do Webhook Stripe

**Status:** pending  
**Dependencies:** None  

Criar o endpoint `/api/stripe/webhook/route.ts` e implementar a lógica fundamental para receber eventos do Stripe, validando a assinatura de cada requisição com o `STRIPE_WEBHOOK_SECRET` para garantir a autenticidade.

**Details:**

O arquivo `src/app/api/stripe/webhook/route.ts` deve ser criado para lidar com requisições POST. A função `stripe.webhooks.constructEvent` deve ser usada para analisar o corpo da requisição e verificar a assinatura no header `stripe-signature`. Requisições com assinatura inválida devem retornar imediatamente um status HTTP 400.

### 45.2. Implementar Estratégia de Idempotência para Eventos do Webhook

**Status:** pending  
**Dependencies:** 45.1  

Desenvolver um mecanismo para previnir o processamento duplicado de eventos do Stripe. Cada evento recebido deve ser processado apenas uma vez, salvando e verificando o `event.id` antes de executar a lógica de negócio.

**Details:**

Criar ou utilizar uma tabela (`stripe_events`) para armazenar os IDs dos eventos já processados. Antes de processar um evento, realizar uma consulta para verificar se o `event.id` já existe na tabela. Se existir, a requisição deve ser ignorada com uma resposta 200. Caso contrário, o ID deve ser inserido e o processamento continua.

### 45.3. Implementar Handler para Evento 'checkout.session.completed'

**Status:** pending  
**Dependencies:** 45.2  

Criar a lógica específica para tratar o evento `checkout.session.completed`, que é disparado quando um cliente conclui um fluxo de pagamento. Esta lógica deve extrair os dados da sessão e criar o registro inicial da assinatura no banco de dados.

**Details:**

Dentro do webhook, após a verificação de idempotência, adicionar um `switch` para `event.type`. No caso `checkout.session.completed`, extrair `subscription`, `customer` e `user_id` (dos metadados). Realizar um `upsert` na tabela `subscriptions` usando o `stripe_subscription_id` como chave para criar a nova assinatura.

### 45.4. Implementar Handlers para 'customer.subscription.updated' e 'deleted'

**Status:** pending  
**Dependencies:** 45.3  

Desenvolver a lógica para gerenciar o ciclo de vida da assinatura, tratando eventos de upgrade, downgrade e cancelamento. Isso garante que o status do plano do usuário no sistema esteja sempre sincronizado com o status no Stripe.

**Details:**

Adicionar `case`s para `customer.subscription.updated` e `customer.subscription.deleted` no `switch` do webhook. Para `updated`, atualizar o status, o plano atual e o período de faturamento na tabela `subscriptions`. Para `deleted`, atualizar o status para 'canceled' ou remover o registro, acionando a lógica para reverter o plano do usuário para 'FREE'.
