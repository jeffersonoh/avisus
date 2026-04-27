---
status: pending
title: Integrar cupom ao cadastro por e-mail e OAuth
type: backend
complexity: high
dependencies:
  - task_02
  - task_03
---

# Tarefa 4: Integrar cupom ao cadastro por e-mail e OAuth

## Visão Geral
Esta tarefa conecta o core de referral aos fluxos reais de criação de conta. O cadastro por e-mail deve consumir o campo manual ou cookie, enquanto o callback OAuth deve consumir o cookie após sessão criada, sem impedir cadastro quando o usuário optar por seguir sem cupom.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE estender `RegisterSchema` e `AuthFormState` para aceitar erro de `referralCode` sem quebrar os campos existentes.
- DEVE fazer `signUpWithEmail` priorizar `referralCode` manual quando preenchido e usar cookie apenas quando o campo estiver vazio.
- DEVE validar cupom no servidor antes de registrar associação; cupom inválido deve retornar erro amigável removível.
- DEVE registrar referral após signup bem-sucedido usando o `userId` retornado pelo Supabase.
- DEVE limpar o cookie de referral após consumo bem-sucedido ou cadastro explicitamente sem código.
- DEVE adaptar `signInWithGoogle`/callback OAuth para preservar e consumir cookie após `exchangeCodeForSession` bem-sucedido.
- DEVE manter `getPostAuthRedirectPath` e redirects atuais quando não houver referral.
</requirements>

## Subtarefas
- [ ] 4.1 Atualizar schemas e tipos de estado de formulário para incluir `referralCode` opcional.
- [ ] 4.2 Integrar leitura de campo manual e fallback para cookie em `signUpWithEmail`.
- [ ] 4.3 Registrar associação de cadastro indicado após signup bem-sucedido.
- [ ] 4.4 Limpar cookie de referral nos cenários definidos pela Tech Spec.
- [ ] 4.5 Ajustar fluxo OAuth para carregar referral do cookie no callback autenticado.
- [ ] 4.6 Criar testes unitários e integração dos fluxos de cadastro com e sem cupom.

## Detalhes de Implementação
O estado atual de `signUpWithEmail` lê apenas `email` e `password`. A tarefa deve preservar mensagens existentes de erro/configuração e acrescentar retorno específico para cupom inválido, inativo ou expirado. Para OAuth, a associação só pode ocorrer após `exchangeCodeForSession` retornar uma sessão válida.

### Arquivos Relevantes
- `src/lib/auth/actions.ts` — contém `signUpWithEmail`, `signInWithGoogle`, `AuthFormState` e mapeamento de erros Zod.
- `src/lib/auth/schemas.ts` — contém `RegisterSchema`, atualmente apenas com e-mail e senha.
- `src/app/auth/callback/route.ts` — troca OAuth code por sessão e redireciona.
- `src/features/referrals/server.ts` — fornece validação e `recordSignupReferral`.
- `src/features/referrals/cookies.ts` — fornece leitura/limpeza do cookie `avisus_referral_code`.

### Arquivos Dependentes
- `src/components/auth/RegisterForm.tsx` — dependerá de `AuthFormState.fieldErrors.referralCode` e do schema atualizado.
- `src/app/(auth)/registro/page.tsx` — passará `initialReferralCode` para o formulário.
- `src/__tests__/features/auth/RegisterForm.test.tsx` — deve cobrir estados de erro e envio com cupom.
- `tests/integration/onboarding.test.ts` — pode precisar ajustar fixtures se dependerem do schema de cadastro.

### ADRs Relacionadas
- [ADR 002: Supabase como Auth + Banco + RLS](docs/adrs/002_supabase_como_auth_db_rls.md) — orienta Auth Supabase e sessão via cookies.
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](docs/adrs/003_migracao_nextjs_app_router.md) — orienta Server Actions e Route Handlers.
- [ADR 011: Notificações web e badge de não-lidos via Supabase Realtime](docs/adrs/011_notificacoes_web_via_supabase_realtime.md) — reforça cuidado com cookies HTTP-only no servidor.

## Entregáveis
- `RegisterSchema`, `AuthFormState` e mapeamento de field errors atualizados com `referralCode`.
- `signUpWithEmail` consumindo cupom manual ou cookie conforme precedência definida.
- OAuth callback consumindo referral após autenticação bem-sucedida.
- Cookie de referral limpo nos cenários apropriados.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para cadastro por e-mail e OAuth com referral **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [ ] `RegisterSchema` aceita cadastro sem `referralCode`.
  - [ ] `RegisterSchema` normaliza `referralCode` válido quando informado.
  - [ ] `mapZodFieldErrors` mapeia erro de `referralCode` sem perder erros de e-mail/senha.
  - [ ] `signUpWithEmail` prioriza campo manual sobre cookie quando ambos existem.
- Testes de integração:
  - [ ] Cadastro por e-mail com cupom válido cria usuário e linha em `referral_conversions`.
  - [ ] Cadastro por e-mail com cupom inválido retorna erro amigável em `referralCode` e não cria associação.
  - [ ] Cadastro por e-mail sem cupom continua criando usuário sem conversão referral.
  - [ ] OAuth callback com cookie válido registra associação para o usuário autenticado.
  - [ ] OAuth callback sem cookie mantém redirect atual e não cria conversão.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- Código manual substitui referência capturada por link.
- Usuário consegue continuar cadastro sem cupom quando remove código inválido.
- Cadastro e OAuth continuam funcionando sem referral.
