---
status: done
title: Capturar referência no middleware e proteger `/admin`
type: backend
complexity: medium
dependencies:
  - task_01
  - task_02
---

# Tarefa 3: Capturar referência no middleware e proteger `/admin`

## Visão Geral
Esta tarefa faz o middleware capturar `?ref=` em qualquer rota coberta e preservar o código em cookie first-party para cadastro posterior. Ela também passa a tratar `/admin` como área protegida e bloqueada para usuários sem `profiles.is_admin`.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE detectar `ref` na query string antes dos retornos antecipados atuais do middleware.
- DEVE normalizar e gravar apenas códigos com formato válido no cookie `avisus_referral_code`.
- DEVE preservar cookies de sessão Supabase e cookie de referral em respostas `NextResponse.next()` e redirects.
- DEVE usar cookie `httpOnly`, `sameSite='lax'`, `secure` em produção, `path='/'` e `maxAge=86400`.
- DEVE adicionar `/admin` aos caminhos protegidos e exigir usuário autenticado.
- DEVE negar acesso a `/admin` quando `profiles.is_admin` não for `true`, sem expor service role ao browser.
- DEVE manter o redirecionamento atual de `/` sem perder o cookie de referral quando a URL tiver `?ref=`.
</requirements>

## Subtarefas
- [x] 3.1 Atualizar `PROTECTED_PREFIXES` para incluir `/admin`.
- [x] 3.2 Capturar, normalizar e validar `ref` antes de redirects ou respostas antecipadas.
- [x] 3.3 Criar aplicação centralizada de cookies pendentes para responses e redirects.
- [x] 3.4 Consultar `profiles.is_admin` no middleware para rotas `/admin` autenticadas.
- [x] 3.5 Definir destino seguro para não-admins, como `/dashboard?error=403` ou equivalente documentado.
- [x] 3.6 Criar testes que cubram cookie, redirects e proteção admin.

## Detalhes de Implementação
O arquivo atual retorna redirect em `pathname === "/"` antes de criar a response final, então a captura de referral precisa ser aplicada também a esses redirects. Use a seção "Next.js middleware/cookies" da Tech Spec para evitar perda de cookies pendentes.

### Arquivos Relevantes
- `src/lib/supabase/middleware.ts` — ponto central de refresh de sessão, redirects e headers de usuário.
- `src/middleware.ts` — delega para `updateSession` e depende do comportamento do middleware.
- `src/features/referrals/cookies.ts` — deve fornecer nome e opções do cookie.
- `src/features/referrals/schemas.ts` — deve fornecer normalização/validação do código.
- `src/lib/auth/admin.ts` — pode expor helper server-side de admin para reaproveitamento fora do middleware.

### Arquivos Dependentes
- `src/app/(auth)/registro/page.tsx` — lerá o cookie gravado pelo middleware.
- `src/lib/auth/actions.ts` — consumirá e limpará o cookie no cadastro por e-mail.
- `src/app/(admin)/admin/cupons/page.tsx` — dependerá do bloqueio de `/admin` para acesso inicial.
- `src/app/auth/callback/route.ts` — dependerá do cookie preservado durante OAuth.

### ADRs Relacionadas
- [ADR 002: Supabase como Auth + Banco + RLS](docs/adrs/002_supabase_como_auth_db_rls.md) — fundamenta sessão via cookies HTTP-only.
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](docs/adrs/003_migracao_nextjs_app_router.md) — orienta uso do App Router e middleware.
- [ADR 011: Notificações web e badge de não-lidos via Supabase Realtime](docs/adrs/011_notificacoes_web_via_supabase_realtime.md) — reforça manter cookies Supabase HTTP-only.

## Entregáveis
- `src/lib/supabase/middleware.ts` atualizado para capturar `?ref=` e proteger `/admin`.
- Helper interno para aplicar cookies pendentes em qualquer resposta do middleware.
- Comportamento de redirect preservando cookies de sessão e referral.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração ou middleware para captura de ref e bloqueio admin **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [x] URL `/?ref=parceiro_2026` grava cookie com valor `PARCEIRO_2026` mesmo quando redireciona para `/login` ou `/dashboard`.
  - [x] URL com `ref=abc` não grava cookie por formato inválido.
  - [x] Response final preserva cookies Supabase pendentes junto com o cookie de referral.
- Testes de integração:
  - [x] Usuário não autenticado em `/admin/cupons` é redirecionado para `/login?next=/admin/cupons`.
  - [x] Usuário autenticado com `is_admin=false` não acessa `/admin/cupons`.
  - [x] Usuário autenticado com `is_admin=true` acessa `/admin/cupons` sem redirect pelo middleware.
  - [x] Acesso a rota protegida existente, como `/dashboard`, mantém o comportamento anterior.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- `?ref=` é preservado em cookie sem quebrar refresh de sessão Supabase.
- `/admin` passa a ser rota protegida e restrita a admin.
- O fluxo atual de login e rotas protegidas não sofre regressão.
