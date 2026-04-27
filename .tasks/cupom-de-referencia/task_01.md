---
status: done
title: Criar modelo Supabase de referrals e admin
type: infra
complexity: high
dependencies: []
---

# Tarefa 1: Criar modelo Supabase de referrals e admin

## Visão Geral
Esta tarefa cria a base persistente da funcionalidade de Cupom de Referência no Supabase. Ela adiciona tabelas, colunas privilegiadas, constraints, índices e policies RLS para permitir atribuição comercial sem expor dados de parceiros ou permitir autoelevação de admin.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE criar a migration `supabase/migrations/0009_referral_coupons.sql` conforme a seção "Modelo de Dados" da Tech Spec.
- DEVE criar `referral_coupons` com código único, dados mínimos do parceiro, taxa de comissão, status, expiração opcional, observações e auditoria de criação/atualização.
- DEVE criar `referral_conversions` com uma conversão por usuário, dados de cadastro FREE e campos opcionais de primeiro pagamento confirmado.
- DEVE adicionar `profiles.is_admin`, `profiles.referral_coupon_id` e `profiles.referral_source` sem quebrar usuários existentes.
- DEVE substituir a policy ampla `profiles_own` por policies que bloqueiem autoelevação admin e alteração manual de referral pelo usuário comum.
- DEVE habilitar RLS nas novas tabelas e restringir leitura/escrita a admin autenticado via função SQL ou service role.
- DEVE atualizar `src/types/database.ts` após aplicar a migration localmente.
</requirements>

## Subtarefas
- [x] 1.1 Criar a migration `0009_referral_coupons.sql` com tabelas, colunas, constraints, índices e triggers.
- [x] 1.2 Adicionar funções SQL auxiliares para verificação de admin e proteção de updates privilegiados em `profiles`.
- [x] 1.3 Recriar as policies de `profiles` para preservar leitura/update do próprio perfil sem permitir alteração de `is_admin` ou referral.
- [x] 1.4 Criar policies RLS das tabelas de cupons e conversões restritas a administradores.
- [x] 1.5 Aplicar a migration no Supabase local e regenerar os tipos de banco.
- [x] 1.6 Criar testes de integração para RLS, constraints e defaults de dados existentes.

## Detalhes de Implementação
Use a seção "Modelo de Dados" da Tech Spec como fonte de verdade para nomes de tabelas, colunas, constraints e policies. A migration deve partir do estado atual em que `profiles_own` permite `FOR ALL` para o próprio usuário e precisa ser substituída por policies mais restritas.

### Arquivos Relevantes
- `supabase/migrations/0001_init.sql` — define `profiles`, `subscriptions`, `handle_new_user`, `set_updated_at` e `sync_profile_plan`.
- `supabase/migrations/0002_rls_policies.sql` — contém a policy atual `profiles_own` que será substituída.
- `supabase/migrations/0008_alerts_per_channel.sql` — última migration existente antes da nova `0009`.
- `src/types/database.ts` — tipos gerados que precisam refletir `referral_coupons`, `referral_conversions` e novas colunas de `profiles`.
- `tests/integration/setup.ts` — helpers atuais para service client, anon client e usuários de teste.

### Arquivos Dependentes
- `src/features/referrals/server.ts` — dependerá dos tipos e constraints criados nesta tarefa.
- `src/lib/auth/admin.ts` — dependerá de `profiles.is_admin` e/ou da função SQL de admin.
- `src/lib/supabase/middleware.ts` — dependerá de `profiles.is_admin` para proteção de `/admin`.
- `src/app/api/stripe/webhook/route.ts` — dependerá de `referral_conversions` para registrar primeira conversão paga.

### ADRs Relacionadas
- [ADR 002: Supabase como Auth + Banco + RLS](docs/adrs/002_supabase_como_auth_db_rls.md) — fundamenta uso de Supabase, RLS e tipos gerados.
- [ADR 007: Modelo freemium com enforcement exclusivamente no backend](docs/adrs/007_modelo_freemium_com_enforcement_backend.md) — reforça que regras sensíveis devem ser autoritativas no backend.

## Entregáveis
- Migration `supabase/migrations/0009_referral_coupons.sql` criada e aplicável em ambiente local.
- `src/types/database.ts` regenerado com as novas tabelas e colunas.
- Policies RLS impedindo acesso comum a dados administrativos de cupons e conversões.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para migration, RLS e constraints de referral **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [ ] Validar que os tipos gerados aceitam `profiles.is_admin`, `profiles.referral_coupon_id` e `profiles.referral_source` sem uso de `any`.
  - [ ] Validar que fixtures ou builders de perfil usam `referral_source='direct'` por padrão quando necessário.
- Testes de integração:
  - [ ] Usuário comum autenticado não consegue inserir linha em `referral_coupons` via anon client.
  - [ ] Usuário comum autenticado não consegue selecionar dados de `referral_conversions` via anon client.
  - [ ] Usuário comum não consegue atualizar `profiles.is_admin` para `true`.
  - [ ] Usuário comum não consegue alterar `profiles.referral_coupon_id` ou `profiles.referral_source` diretamente.
  - [ ] Service role consegue criar cupom válido e falha ao criar código duplicado.
  - [ ] Código fora do formato `^[A-Z0-9_]{5,30}$` falha por constraint no banco.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- `npm run db:types` atualiza `src/types/database.ts` sem erro.
- As novas tabelas têm RLS habilitado e policies restritivas.
- Usuários existentes permanecem com `is_admin=false`, `referral_source='direct'` e sem cupom associado.
