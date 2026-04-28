---
status: done
title: Implementar CRUD admin de cupons
type: backend
complexity: high
dependencies:
  - task_02
  - task_06
---

# Tarefa 7: Implementar CRUD admin de cupons

## Visão Geral
Esta tarefa entrega as Server Actions e queries administrativas para criar, consultar, editar e ativar/desativar cupons. Ela também calcula métricas simples de comissão no servidor para que a UI admin não precise manipular dados sensíveis além do necessário.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE criar `src/features/referrals/actions.ts` com Server Actions públicas/admin conforme a Tech Spec.
- DEVE exigir `requireAdmin()` em toda ação ou query administrativa.
- DEVE validar inputs admin com Zod antes de qualquer write.
- DEVE mapear violação de código duplicado para mensagem "Já existe um cupom com este código.".
- DEVE preservar histórico de conversões ao desativar ou expirar cupom.
- DEVE calcular comissão com base em `paid_amount * commission_rate_pct / 100` no servidor.
- DEVE listar cupons com filtros simples de ativo/inativo e paginação padrão de 50 itens.
</requirements>

## Subtarefas
- [x] 7.1 Criar tipos e schemas admin para formulário, filtros e resultados de ações.
- [x] 7.2 Criar query de listagem de cupons com agregados de cadastros, conversões pagas e comissão.
- [x] 7.3 Criar query de detalhe por cupom com histórico preservado de conversões.
- [x] 7.4 Criar `createReferralCouponAction` e `updateReferralCouponAction`.
- [x] 7.5 Criar `toggleReferralCouponAction` para ativar/desativar sem apagar dados.
- [x] 7.6 Criar `validateReferralCodeAction` para feedback público seguro quando necessário.
- [x] 7.7 Criar testes unitários e integração das ações admin.

## Detalhes de Implementação
As operações admin devem usar service role somente no servidor e sempre após `requireAdmin()`. As queries de comissão devem agregar no banco/servidor e retornar apenas dados necessários para a interface administrativa.

### Arquivos Relevantes
- `src/features/referrals/schemas.ts` — base para schema admin de cupom.
- `src/features/referrals/server.ts` — validação de cupom e regras de conversão já existentes.
- `src/lib/auth/admin.ts` — autorização obrigatória para ações e queries admin.
- `src/lib/supabase/service.ts` — cliente privilegiado para consultar todas as conversões.
- `src/features/plans/actions.ts` — referência de padrão de Server Action com retorno `{ ok, error }`.

### Arquivos Dependentes
- `src/features/referrals/admin/ReferralCouponForm.tsx` — dependerá das actions de criar/editar.
- `src/features/referrals/admin/ReferralCouponTable.tsx` — dependerá de listagem e toggle.
- `src/app/(admin)/admin/cupons/page.tsx` — dependerá de queries de listagem e métricas.
- `src/app/(admin)/admin/cupons/[id]/page.tsx` — dependerá da query de detalhe.
- `src/app/(admin)/admin/api/export/commissions/route.ts` — dependerá das queries ou serialização dos dados.

### ADRs Relacionadas
- [ADR 001: Arquitetura serverless-first com Vercel + Supabase](docs/adrs/001_arquitetura_serverless_first.md) — orienta queries serverless e sem processos persistentes.
- [ADR 002: Supabase como Auth + Banco + RLS](docs/adrs/002_supabase_como_auth_db_rls.md) — orienta service role isolado e RLS.
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](docs/adrs/003_migracao_nextjs_app_router.md) — orienta Server Actions para mutações.

## Entregáveis
- `src/features/referrals/actions.ts` com validação pública segura e Server Actions admin.
- Queries server-side para listagem, detalhe e métricas simples de comissão.
- Tratamento claro de erro para duplicidade, formato inválido, comissão inválida e expiração inválida.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para CRUD admin, filtros e agregados de comissão **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [x] Schema admin aceita `commissionRatePct=0` e `commissionRatePct=100`.
  - [x] Schema admin rejeita `commissionRatePct=-1` e `commissionRatePct=101`.
  - [x] Schema admin normaliza código para uppercase.
  - [x] Mapeamento de erro unique retorna "Já existe um cupom com este código.".
- Testes de integração:
  - [x] Admin cria cupom com dados válidos e ele aparece na listagem.
  - [x] Admin edita nome do parceiro, e-mail, comissão, expiração e observações.
  - [x] Admin desativa cupom usado e conversões históricas continuam consultáveis.
  - [x] Não-admin não consegue executar create/update/toggle action.
  - [x] Listagem filtra cupons ativos e inativos corretamente.
  - [x] Métrica de comissão soma apenas conversões com `first_paid_date` e `paid_amount` preenchidos.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- CRUD admin funciona sem expor dados a usuários comuns.
- Código duplicado e formato inválido retornam mensagens claras.
- Desativação/expiração não apaga nem invalida histórico.
