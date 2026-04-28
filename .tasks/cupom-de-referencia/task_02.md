---
status: done
title: Implementar regras server-side de referral
type: backend
complexity: high
dependencies:
  - task_01
---

# Tarefa 2: Implementar regras server-side de referral

## Visão Geral
Esta tarefa cria o módulo de domínio de referrals usado por cadastro, OAuth, admin e Stripe. Ela centraliza normalização, validação, associação de cadastro e registro idempotente da primeira conversão paga para evitar regras duplicadas em pontos sensíveis.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE criar `src/features/referrals/` com schemas, helpers server-side e helpers de cookie conforme Tech Spec.
- DEVE normalizar códigos para uppercase e validar o regex `^[A-Z0-9_]{5,30}$` antes de qualquer consulta ao banco.
- DEVE validar cupom existente, ativo e não expirado retornando reasons sem expor dados do parceiro.
- DEVE registrar cadastro indicado de forma idempotente para um `user_id`, atualizando `profiles.referral_coupon_id` e `profiles.referral_source` via service role.
- DEVE registrar primeira conversão paga apenas uma vez, ignorando recorrências e eventos duplicados.
- DEVE garantir que falha de referral no pós-signup não impeça criação da conta, mas retorne/logue erro sem PII.
- DEVE manter service role isolado em módulos server-only e nunca importado por Client Components.
</requirements>

## Subtarefas
- [x] 2.1 Criar schemas e utilitários de normalização em `src/features/referrals/schemas.ts`.
- [x] 2.2 Criar constantes e helpers de cookie em `src/features/referrals/cookies.ts`.
- [x] 2.3 Criar `validateReferralCode` com reasons `not_found`, `inactive`, `expired` e `invalid_format`.
- [x] 2.4 Criar `recordSignupReferral` para inserir conversão FREE e atualizar `profiles` de forma idempotente.
- [x] 2.5 Criar `recordFirstPaidReferral` para atualizar primeira conversão paga de forma idempotente.
- [x] 2.6 Cobrir o módulo com testes unitários e integração Supabase.

## Detalhes de Implementação
Referencie as seções "Contratos e Interfaces", "Segurança", "Performance" e "Tratamento de Erros" da Tech Spec. O módulo deve usar `createServiceRoleClient()` para writes privilegiados e não deve criar rota pública de validação.

### Arquivos Relevantes
- `src/lib/supabase/service.ts` — factory service role já existente para operações privilegiadas no servidor.
- `src/lib/supabase/server.ts` — cliente de sessão usado nos pontos autenticados.
- `src/features/plans/actions.ts` — referência de Server Action com Zod e retorno tipado.
- `tests/integration/setup.ts` — base para testes de integração com service client e usuário autenticado.
- `.tasks/cupom-de-referencia/tech-spec.md` — contratos esperados para `validateReferralCode`, `recordSignupReferral` e `recordFirstPaidReferral`.

### Arquivos Dependentes
- `src/lib/auth/actions.ts` — consumirá `recordSignupReferral` no cadastro por e-mail.
- `src/app/auth/callback/route.ts` — consumirá referral no fluxo OAuth.
- `src/features/referrals/actions.ts` — reutilizará schemas e validação no admin e na UI pública.
- `src/app/api/stripe/webhook/route.ts` — chamará `recordFirstPaidReferral` para `invoice.paid`.

### ADRs Relacionadas
- [ADR 001: Arquitetura serverless-first com Vercel + Supabase](docs/adrs/001_arquitetura_serverless_first.md) — orienta funções stateless e idempotentes.
- [ADR 002: Supabase como Auth + Banco + RLS](docs/adrs/002_supabase_como_auth_db_rls.md) — orienta service role server-side e RLS.
- [ADR 007: Modelo freemium com enforcement exclusivamente no backend](docs/adrs/007_modelo_freemium_com_enforcement_backend.md) — reforça validação autoritativa no backend.

## Entregáveis
- `src/features/referrals/schemas.ts` com normalização e Zod schemas de referral.
- `src/features/referrals/cookies.ts` com nome e opções do cookie de referência.
- `src/features/referrals/server.ts` com validação e registros idempotentes de cadastro e pagamento.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para validação de cupom, cadastro indicado e primeira conversão paga **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [ ] `normalizeReferralCode` transforma ` parceiro_avisus ` em `PARCEIRO_AVISUS`.
  - [ ] `referralCodeSchema` rejeita código com menos de 5 caracteres.
  - [ ] `referralCodeSchema` rejeita caracteres fora de letras maiúsculas, números e underscore após normalização.
  - [ ] Helper de cookie define `httpOnly`, `sameSite='lax'`, `path='/'` e `maxAge=86400`.
- Testes de integração:
  - [ ] `validateReferralCode` retorna `ok: true` para cupom ativo e não expirado.
  - [ ] `validateReferralCode` retorna `inactive` para cupom desativado.
  - [ ] `validateReferralCode` retorna `expired` para cupom com `expires_at` no passado.
  - [ ] `recordSignupReferral` cria uma conversão com `plan_selected='free'` e atualiza `profiles.referral_source='coupon'`.
  - [ ] `recordSignupReferral` chamado duas vezes para o mesmo usuário não cria conversões duplicadas.
  - [ ] `recordFirstPaidReferral` preenche `first_paid_date`, `paid_amount`, `paid_currency`, invoice e subscription apenas na primeira chamada.
  - [ ] `recordFirstPaidReferral` para usuário sem referral não cria conversão nova.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- Código de cupom é validado sempre no servidor antes de uso.
- Registro de cadastro FREE e primeiro pagamento são idempotentes.
- Nenhum Client Component importa `createServiceRoleClient` ou módulo server-only.
