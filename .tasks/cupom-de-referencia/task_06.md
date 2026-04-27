---
status: pending
title: Criar base administrativa e autenticação admin
type: backend
complexity: medium
dependencies:
  - task_01
  - task_03
---

# Tarefa 6: Criar base administrativa e autenticação admin

## Visão Geral
Esta tarefa estabelece a fundação de `/admin` para a gestão de cupons. Ela cria helpers server-side de autorização, layout administrativo mínimo e garantias de que todo acesso admin dependa de `profiles.is_admin`.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE criar `src/lib/auth/admin.ts` com `isAdmin(userId)` e `requireAdmin()`.
- DEVE usar `profiles.is_admin` como fonte de autorização, conforme decisão da Tech Spec desta feature.
- DEVE chamar `requireAdmin()` em todo Server Component administrativo criado nesta base.
- DEVE criar subárvore `src/app/(admin)/admin/` com layout próprio e rota inicial mínima.
- DEVE evitar exposição de service role ou dados administrativos em Client Components.
- DEVE definir comportamento consistente para usuário não autenticado e não-admin.
- DEVE preparar a navegação para `/admin/cupons` sem implementar ainda o CRUD completo.
</requirements>

## Subtarefas
- [ ] 6.1 Criar `src/lib/auth/admin.ts` com helpers server-only de admin.
- [ ] 6.2 Criar `src/app/(admin)/admin/layout.tsx` com validação admin e estrutura visual mínima.
- [ ] 6.3 Criar `src/app/(admin)/admin/page.tsx` com redirect ou entrada para `/admin/cupons`.
- [ ] 6.4 Criar navegação administrativa mínima apontando para "Cupons".
- [ ] 6.5 Atualizar cache/perfil se necessário para exibir navegação admin no app autenticado.
- [ ] 6.6 Criar testes para helper admin e proteção server-side.

## Detalhes de Implementação
Não use a abordagem `admin_users` da Tech Spec do dashboard administrativo anterior; esta feature definiu `profiles.is_admin`. O middleware da tarefa 3 já protege a borda, mas esta tarefa deve repetir a verificação em Server Components e futuras Server Actions admin.

### Arquivos Relevantes
- `src/lib/supabase/server.ts` — cliente com sessão para descobrir usuário atual.
- `src/lib/supabase/service.ts` — cliente service role para consulta privilegiada quando necessário.
- `src/lib/profile-cache.ts` — cache atual de `plan` e `name`, possível ponto para incluir `is_admin`.
- `src/app/(app)/layout.tsx` — referência de layout autenticado com headers e dados de usuário.
- `src/components/AppHeader.tsx` — possível ponto de link discreto para admin quando `is_admin=true`.

### Arquivos Dependentes
- `src/app/(admin)/admin/cupons/page.tsx` — dependerá de layout e `requireAdmin()`.
- `src/features/referrals/actions.ts` — dependerá de `requireAdmin()` para CRUD.
- `src/app/(admin)/admin/cupons/novo/page.tsx` — dependerá da base administrativa.
- `src/app/(admin)/admin/cupons/[id]/page.tsx` — dependerá da base administrativa.

### ADRs Relacionadas
- [ADR 002: Supabase como Auth + Banco + RLS](docs/adrs/002_supabase_como_auth_db_rls.md) — orienta Auth e isolamento por RLS.
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](docs/adrs/003_migracao_nextjs_app_router.md) — orienta Server Components por padrão.
- [ADR 008: Tailwind CSS no lugar de CSS inline do protótipo](docs/adrs/008_tailwind_css_no_lugar_de_css_inline.md) — orienta layout com Tailwind.

## Entregáveis
- `src/lib/auth/admin.ts` com helpers de autorização admin.
- `src/app/(admin)/admin/layout.tsx` com validação server-side e navegação mínima.
- `src/app/(admin)/admin/page.tsx` com entrada ou redirect para cupons.
- Cache/perfil ajustado se necessário para link admin no produto.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para acesso admin e não-admin **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [ ] `isAdmin` retorna `true` quando `profiles.is_admin=true`.
  - [ ] `isAdmin` retorna `false` quando perfil não existe ou `is_admin=false`.
  - [ ] `requireAdmin` redireciona ou bloqueia quando não há usuário autenticado.
- Testes de integração:
  - [ ] Usuário comum autenticado não renderiza conteúdo de `/admin`.
  - [ ] Usuário admin renderiza layout administrativo e link "Cupons".
  - [ ] Nenhum dado de partner/cupom é enviado a Client Component antes da verificação admin.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- `/admin` existe e é inacessível para não-admins.
- Todo Server Component admin chama `requireAdmin()` direta ou indiretamente via layout.
- A base admin fica pronta para o CRUD de cupons.
