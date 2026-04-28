---
status: done
title: Registrar primeira conversão paga via Stripe
type: backend
complexity: high
dependencies:
  - task_02
---

# Tarefa 9: Registrar primeira conversão paga via Stripe

## Visão Geral
Esta tarefa estende o webhook Stripe para transformar pagamento confirmado em comissão de referral. O evento `invoice.paid` deve resolver o usuário, registrar apenas o primeiro pagamento de STARTER/PRO e ignorar recorrências ou duplicidades de forma idempotente.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE adicionar `invoice.paid` ao switch de `src/app/api/stripe/webhook/route.ts`.
- DEVE manter verificação de assinatura Stripe com `stripe.webhooks.constructEvent()`.
- DEVE resolver `stripe_subscription_id` por `invoice.parent?.subscription_details?.subscription` conforme padrão atual.
- DEVE resolver `user_id` via assinatura interna, customer/subscription metadata ou fallback seguro documentado.
- DEVE registrar apenas pagamentos STARTER ou PRO, ignorando FREE e eventos sem usuário resolvível.
- DEVE usar `invoice.amount_paid / 100` como base e `invoice.currency.toUpperCase()` como moeda.
- DEVE retornar 200 para evento irrelevante/duplicado e 500 para erro temporário de banco que deve ser reprocessado.
</requirements>

## Subtarefas
- [x] 9.1 Criar handler interno para `invoice.paid` no webhook Stripe.
- [x] 9.2 Resolver assinatura e usuário a partir do invoice sem depender de dados do browser.
- [x] 9.3 Mapear plano pago para `starter` ou `pro` usando dados da assinatura/subscription.
- [x] 9.4 Chamar `recordFirstPaidReferral` com valor, moeda, invoice, subscription e data paga.
- [x] 9.5 Garantir logs sem PII para invoice sem usuário ou sem referral.
- [x] 9.6 Criar testes para invoice pago, duplicidade, recorrência e usuário sem referral.

## Detalhes de Implementação
O webhook atual já trata `customer.subscription.created/updated/deleted` e `invoice.payment_failed`. Esta tarefa deve preservar esses cases e adicionar o novo comportamento sem alterar preços, Stripe Coupons ou Promotion Codes.

### Arquivos Relevantes
- `src/app/api/stripe/webhook/route.ts` — webhook Stripe atual e handlers de subscription/payment failed.
- `src/features/referrals/server.ts` — fornece `recordFirstPaidReferral` idempotente.
- `src/features/plans/actions.ts` — cria checkout com metadata `user_id` e `target_plan`.
- `src/lib/stripe.ts` — cria cliente Stripe e lê webhook secret.
- `tests/integration/stripe-webhook.test.ts` — padrão atual de testes de integração Stripe/subscription.

### Arquivos Dependentes
- `tests/integration/referral-webhook.test.ts` — novo teste recomendado para `invoice.paid` com referrals.
- `src/features/referrals/actions.ts` — métricas admin dependerão do preenchimento de `first_paid_date` e `paid_amount`.
- `src/app/(admin)/admin/cupons/page.tsx` — exibirá comissão calculada a partir dos dados preenchidos.

### ADRs Relacionadas
- [ADR 001: Arquitetura serverless-first com Vercel + Supabase](docs/adrs/001_arquitetura_serverless_first.md) — orienta Route Handlers serverless e idempotentes.
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](docs/adrs/003_migracao_nextjs_app_router.md) — orienta Route Handlers para webhooks.
- [ADR 007: Modelo freemium com enforcement exclusivamente no backend](docs/adrs/007_modelo_freemium_com_enforcement_backend.md) — reforça `profiles.plan` como resultado do webhook/assinatura.

## Entregáveis
- `src/app/api/stripe/webhook/route.ts` com handler de `invoice.paid`.
- Registro idempotente da primeira conversão paga conectado a `recordFirstPaidReferral`.
- Logs seguros para invoice sem usuário, sem subscription ou sem referral.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para webhook `invoice.paid` e idempotência **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [ ] Helper de extração de subscription ID retorna ID quando `invoice.parent.subscription_details.subscription` é string.
  - [ ] Helper de extração retorna ID quando subscription é objeto com `id`.
  - [ ] Valor `amount_paid=1990` é convertido para `19.90` e moeda `brl` para `BRL`.
  - [ ] Evento com plano não pago não chama `recordFirstPaidReferral`.
- Testes de integração:
  - [ ] Webhook `invoice.paid` para usuário indicado STARTER preenche `first_paid_date`, `paid_amount`, `paid_currency` e `stripe_invoice_id`.
  - [ ] Segundo webhook com o mesmo invoice retorna sucesso sem alterar a primeira conversão.
  - [ ] Segundo pagamento recorrente com outro invoice não altera `first_paid_date` nem `paid_amount` do primeiro pagamento.
  - [ ] Webhook para usuário sem referral retorna 200 e não cria `referral_conversions`.
  - [ ] Erro temporário de banco durante atualização retorna 500 para permitir retry do Stripe.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- `invoice.paid` registra somente primeira conversão paga confirmada.
- Recorrências e duplicidades não geram comissão adicional.
- Nenhum preço de Checkout, Stripe Coupon ou Promotion Code é alterado.
