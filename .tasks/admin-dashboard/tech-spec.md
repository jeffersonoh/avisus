# Tech Spec — Dashboard Administrativo

## Contexto

- **PRD**: [`prd.md`](./prd.md) — Dashboard Administrativo
- **AGENTS.md**: [`docs/agents/AGENTS.md`](../../docs/agents/AGENTS.md)
- **Tech Spec MVP**: [`.tasks/avisus-mvp/tech-spec.md`](../avisus-mvp/tech-spec.md)
- **Migrations vigentes**: [`supabase/migrations/`](../../supabase/migrations/)

O Dashboard Administrativo é uma área interna do Avisus restrita ao administrador da plataforma (Jefferson, solo dev). Centraliza métricas operacionais agregadas (usuários, planos, termos, engajamento), permite consultar o detalhe de qualquer usuário e executa ações de gestão (alterar plano, banir/reativar, exportar CSV) sem depender do Supabase Studio ou de painéis externos.

A entrega é integrada ao MVP — junto com as features Must Have do PRD do Avisus — pois o admin é dependência operacional para o lançamento (resolver suporte, conceder cortesia, validar adoção).

**Estado atual do sistema**:
- Next.js 15 (App Router) + TypeScript strict + Tailwind CSS
- Supabase (PostgreSQL 15, Auth, RLS) com migrations 0001–0004 já aplicadas
- Middleware ([`middleware.ts`](../../middleware.ts)) protege rotas autenticadas via [`src/lib/supabase/middleware.ts`](../../src/lib/supabase/middleware.ts)
- Client Supabase server em [`src/lib/supabase/server.ts`](../../src/lib/supabase/server.ts) e service-role em [`src/lib/supabase/service.ts`](../../src/lib/supabase/service.ts)
- Tabelas relevantes existentes: `profiles`, `interests`, `alerts`, `subscriptions`, `user_opportunity_status` (todas com RLS habilitado em [`0002_rls_policies.sql`](../../supabase/migrations/0002_rls_policies.sql))

---

## Escopo Técnico

### O que será construído

| # | Entrega | RFs do PRD |
|---|---------|-----------|
| 1 | Tabela `admin_users` + tabela `admin_audit_log` (migration 0005) | CA-01, CA-02, RF-06, RF-07 |
| 2 | Coluna `banned_at` e `last_active_at` em `profiles` (migration 0005) | RF-06, RF-07, RF-08, RF-01 |
| 3 | Helper `requireAdmin()` em `src/lib/auth/admin.ts` | CA-01, CA-02 |
| 4 | Bloqueio de usuários banidos no middleware existente | RF-06 |
| 5 | Rota `/admin` com painel de métricas agregadas | RF-01, RF-02 |
| 6 | Rota `/admin/usuarios` com lista, busca e ordenação | RF-03, RF-04 |
| 7 | Rota `/admin/usuarios/[id]` com detalhe e ações | RF-05, RF-06, RF-07, RF-08 |
| 8 | Route Handlers `/admin/api/export/{users,alerts,interests}` | RF-09 |
| 9 | Server Actions de gestão (alterar plano, banir/reativar) | RF-06, RF-07, RF-08 |
| 10 | Hook de `last_active_at` em layout autenticado | RF-01 |

### O que NÃO será construído nesta entrega

- Gestão financeira do Stripe (reembolsos, cancelamentos) — permanece no painel do Stripe
- Ingestão e visualização de logs de scanner ou erros de infra — Vercel/Sentry
- Múltiplos roles ou permissões granulares — `admin_users` é binário
- Notificações automáticas para o admin (email/Telegram) — fora do PRD
- Gráficos e séries temporais — apenas totais agregados
- Criação de usuários pelo admin — somente gestão de existentes
- Edição/reenvio de alertas existentes — fora de escopo

### Módulos e camadas

| Camada | Tecnologia | Ação |
|--------|-----------|------|
| Banco | PostgreSQL via Supabase | Migration 0005 (admin_users, admin_audit_log, colunas em profiles) |
| Auth | Supabase Auth + middleware Next.js | Estender middleware para validar admin/banned |
| Server queries | `@supabase/supabase-js` (service-role) | Novo módulo `src/lib/admin/` |
| Frontend | Next.js App Router + React Server Components | Criar `src/app/(admin)/` |
| Exportação | Route Handlers (`Response` + `text/csv`) | Streaming server-side |

---

## Arquitetura e Design

### Visão Geral da Solução

O dashboard admin é uma sub-árvore isolada de rotas em Next.js — `src/app/(admin)/admin/*` — com layout próprio, validação de admin no servidor (em todo Server Component e Server Action) e uso exclusivo do **service-role client** para queries que cruzam usuários.

A escolha do service-role é consciente: o painel admin precisa agregar dados de toda a base (métricas e detalhe arbitrário de usuário), e adicionar políticas RLS específicas para admin em todas as tabelas multiplicaria a complexidade do RLS. A trava de segurança é feita em camada de aplicação via `requireAdmin()` chamado **antes** de qualquer query, e o cliente service-role nunca é exposto ao browser (somente em Server Components, Server Actions e Route Handlers).

Banimento usa coluna `banned_at` em `profiles` + verificação no middleware. O middleware redireciona qualquer usuário banido para `/banido` independente da rota solicitada — bloqueia uso da plataforma sem precisar invalidar o token Supabase.

```
┌──────────────────────────────────────────────────────────────┐
│                       VERCEL                                  │
│  Next.js 15 — App Router                                     │
│                                                              │
│  middleware.ts                                               │
│  ├── updateSession (existente)                               │
│  └── ensureNotBanned + ensureAdminForAdminRoutes (novo)      │
│                                                              │
│  /app/(admin)/admin/                                         │
│  ├── layout.tsx          → requireAdmin() + AdminNav         │
│  ├── page.tsx            → painel de métricas (RSC)          │
│  ├── usuarios/                                               │
│  │   ├── page.tsx        → lista + busca + sort              │
│  │   └── [id]/page.tsx   → detalhe + ações                   │
│  └── api/export/                                             │
│      ├── users/route.ts                                      │
│      ├── alerts/route.ts                                     │
│      └── interests/route.ts                                  │
│                                                              │
│  /lib/admin/                                                 │
│  ├── client.ts           → wraps service-role + requireAdmin │
│  ├── metrics.ts          → queries do painel                 │
│  ├── users.ts            → list/get/update                   │
│  ├── audit.ts            → log de ações                      │
│  └── csv.ts              → serializador CSV streaming        │
│                                                              │
│  /lib/auth/admin.ts      → requireAdmin / isAdmin            │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                       SUPABASE                                │
│  Tabelas novas: admin_users, admin_audit_log                 │
│  Colunas novas em profiles: banned_at, banned_reason,        │
│                              last_active_at                  │
└──────────────────────────────────────────────────────────────┘
```

### Componentes Envolvidos

| Componente | Tipo | Ação | Descrição |
|------------|------|------|-----------|
| `supabase/migrations/0005_admin.sql` | Migration | Criar | Cria `admin_users`, `admin_audit_log`, colunas `banned_at`, `banned_reason`, `last_active_at` |
| `src/lib/auth/admin.ts` | Lib | Criar | `isAdmin(userId)` e `requireAdmin()` (lança redirect 403) |
| `src/lib/admin/client.ts` | Lib | Criar | Cria service-role client; export `assertAdmin()` antes de qualquer query |
| `src/lib/admin/metrics.ts` | Lib | Criar | Queries agregadas para o painel (counts, top terms, engagement) |
| `src/lib/admin/users.ts` | Lib | Criar | `listUsers`, `getUserDetail`, `updateUserPlan`, `banUser`, `unbanUser` |
| `src/lib/admin/audit.ts` | Lib | Criar | `logAdminAction(action, target_user_id, payload)` |
| `src/lib/admin/csv.ts` | Lib | Criar | Streaming serializer para `Response` (`text/csv`, `Content-Disposition`) |
| `src/lib/supabase/middleware.ts` | Lib | Modificar | Adicionar `ensureNotBanned` e bloqueio de `/admin` para não-admins |
| `src/lib/supabase/service.ts` | Lib | Verificar | Reutilizar (já existe) — confirmar que aceita schema `Database` |
| `src/app/(admin)/admin/layout.tsx` | RSC | Criar | Header + navegação interna; chama `requireAdmin()` |
| `src/app/(admin)/admin/page.tsx` | RSC | Criar | Painel de métricas (cards) |
| `src/app/(admin)/admin/usuarios/page.tsx` | RSC | Criar | Tabela paginada de usuários |
| `src/app/(admin)/admin/usuarios/[id]/page.tsx` | RSC | Criar | Detalhe + dialogs de ação |
| `src/app/(admin)/admin/usuarios/_actions.ts` | Server Action | Criar | `updatePlanAction`, `banAction`, `unbanAction` (Zod + audit) |
| `src/app/(admin)/admin/api/export/users/route.ts` | Route Handler | Criar | GET → CSV |
| `src/app/(admin)/admin/api/export/alerts/route.ts` | Route Handler | Criar | GET → CSV (query string `range=today\|7d\|30d`) |
| `src/app/(admin)/admin/api/export/interests/route.ts` | Route Handler | Criar | GET → CSV |
| `src/app/(app)/layout.tsx` | RSC | Modificar | Disparar `touchLastActive()` em background no carregamento |
| `src/app/banido/page.tsx` | RSC | Criar | Página de aviso para usuários banidos (sem nav, com motivo opcional) |
| `src/components/admin/MetricCard.tsx` | Componente | Criar | Card padronizado de métrica |
| `src/components/admin/ConfirmDialog.tsx` | Componente | Criar | Dialog de confirmação reutilizável |

### Contratos e Interfaces

**`requireAdmin()` (server)**
```ts
// src/lib/auth/admin.ts
export async function requireAdmin(): Promise<{ userId: string }> {
  // 1. createServerClient → auth.getUser()
  // 2. SELECT 1 FROM admin_users WHERE user_id = $userId
  // 3. Se não admin → throw redirect("/dashboard?error=403")
  // 4. Retorna { userId }
}

export async function isAdmin(userId: string): Promise<boolean>;
```

**`adminClient()` (server-only)**
```ts
// src/lib/admin/client.ts — NUNCA importar em Client Component
import "server-only";
export function adminClient(): SupabaseClient<Database>; // service-role
```

**Server Actions** (Zod-validated, audit logged)
```ts
// src/app/(admin)/admin/usuarios/_actions.ts
"use server";
export async function updatePlanAction(input: {
  targetUserId: string;
  plan: "free" | "starter" | "pro";
  reason: string; // mínimo 10 chars
}): Promise<{ ok: true } | { ok: false; error: string }>;

export async function banAction(input: {
  targetUserId: string;
  reason: string; // mínimo 10 chars
}): Promise<{ ok: true } | { ok: false; error: string }>;

export async function unbanAction(input: {
  targetUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }>;
```

**Route Handlers de exportação**
```
GET /admin/api/export/users
  → 200 text/csv; charset=utf-8
  → Content-Disposition: attachment; filename="users-YYYYMMDD.csv"

GET /admin/api/export/alerts?range=today|7d|30d
  → idem

GET /admin/api/export/interests
  → idem

Todos: 403 se não-admin (validado por requireAdmin no início).
```

**Middleware (extensão)**
- Antes de retornar `response`, se `user` autenticado:
  1. Buscar `banned_at, last_active_at` da `profiles` por `user.id`
  2. Se `banned_at IS NOT NULL` e rota ≠ `/banido` ou `/api/auth/sign-out` → redirect `/banido`
  3. Se rota `/admin*` e `user.id NOT IN (SELECT user_id FROM admin_users)` → redirect `/dashboard?error=403`

---

## Modelo de Dados

Migration única: `supabase/migrations/0005_admin.sql`

```sql
-- ========================================
-- ADMIN_USERS
-- ========================================
CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- RLS: nenhuma policy pública. Acesso somente via service-role.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ADMIN_AUDIT_LOG
-- ========================================
CREATE TABLE public.admin_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action VARCHAR(40) NOT NULL
    CHECK (action IN ('plan_change', 'user_ban', 'user_unban', 'export_users',
                      'export_alerts', 'export_interests')),
  reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_target ON public.admin_audit_log(target_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_admin ON public.admin_audit_log(admin_user_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PROFILES — colunas novas
-- ========================================
ALTER TABLE public.profiles
  ADD COLUMN banned_at TIMESTAMPTZ,
  ADD COLUMN banned_reason TEXT,
  ADD COLUMN last_active_at TIMESTAMPTZ;

CREATE INDEX idx_profiles_banned ON public.profiles(banned_at)
  WHERE banned_at IS NOT NULL;
CREATE INDEX idx_profiles_last_active ON public.profiles(last_active_at DESC)
  WHERE banned_at IS NULL;
```

**Impacto em queries existentes**
- Nenhum. As novas colunas em `profiles` são nullable e têm default implícito `NULL`.
- `last_active_at` é atualizado em background — nunca bloqueia request crítico.

**Métricas do painel — queries de referência** (executadas pelo service-role)

```sql
-- Total e novos
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS new_this_month
  FROM public.profiles WHERE banned_at IS NULL;

-- Ativos 7d / 30d
SELECT COUNT(*) FILTER (WHERE last_active_at >= NOW() - INTERVAL '7 days')  AS active_7d,
       COUNT(*) FILTER (WHERE last_active_at >= NOW() - INTERVAL '30 days') AS active_30d
  FROM public.profiles WHERE banned_at IS NULL;

-- Distribuição de planos + MRR estimado
SELECT plan, COUNT(*) FROM public.profiles
  WHERE banned_at IS NULL GROUP BY plan;

-- Top 10 termos
SELECT LOWER(term) AS term, COUNT(DISTINCT user_id) AS users
  FROM public.interests WHERE active = TRUE
  GROUP BY LOWER(term) ORDER BY users DESC LIMIT 10;

-- Engajamento de alertas (últimos 30d)
SELECT COUNT(*) AS sent,
       COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) AS clicked,
       COUNT(*) FILTER (WHERE bought_at IS NOT NULL) AS bought,
       COUNT(*) FILTER (WHERE dismissed_at IS NOT NULL) AS dismissed
  FROM public.alerts WHERE sent_at >= NOW() - INTERVAL '30 days';
```

---

## Integrações

Não há novas integrações externas. Reutiliza:
- **Supabase Auth Admin API** — apenas para casos futuros (não no MVP); banimento é resolvido em `profiles.banned_at`
- **Stripe** — somente leitura indireta via tabela `subscriptions` já existente; nenhuma chamada à API do Stripe nesta entrega

---

## Segurança

**Autenticação e autorização**
- `requireAdmin()` é chamado **explicitamente** no topo de:
  - Todo Server Component em `src/app/(admin)/`
  - Toda Server Action em `_actions.ts`
  - Todo Route Handler em `src/app/(admin)/admin/api/`
- Defesa em camadas: middleware redireciona, mas a página/handler **também** valida (nunca confiar apenas no middleware)
- Service-role client (`SUPABASE_SERVICE_ROLE_KEY`) é importado com `import "server-only"` para falhar build se vazar para Client Component

**Validação de entrada**
- Todas as Server Actions validam payload com Zod antes de qualquer query
- `targetUserId` validado como UUID
- `plan` validado contra enum `["free", "starter", "pro"]`
- `reason` mínimo 10 caracteres em ações destrutivas
- Busca de usuário por e-mail/nome usa `ilike '%termo%'` com parametrização (Supabase JS já parametriza)

**Dados sensíveis em CSV**
- Lista explícita de campos por export (allowlist), nunca `SELECT *`
- **Users**: `id, name, email, plan, created_at, last_active_at, banned_at`
- **Alerts**: `id, user_email, opportunity_id, sent_at, clicked_at, bought_at, dismissed_at, channel`
- **Interests**: `user_email, term, active, created_at`
- Nunca incluir: hash de senha, telegram_username completo (mascarar), tokens, payloads de webhook

**Conformidade LGPD**
- Export "dados do usuário" (RF-04 do PRD) atende pedido de portabilidade
- Banimento não apaga dados; exclusão definitiva continua via cascade do `auth.users` (já existente)
- `admin_audit_log.payload` jamais armazena PII bruta — apenas IDs e enums

**Configuração**
- `SUPABASE_SERVICE_ROLE_KEY` deve estar configurado em Vercel (Production + Preview)
- Adicionar variável `ADMIN_BOOTSTRAP_EMAIL` opcional para script `scripts/grant-admin.mjs` que insere em `admin_users` o usuário inicial

---

## Performance

**Volume esperado (MVP)**
- < 500 usuários totais nos primeiros meses
- < 50.000 alertas/mês
- < 5.000 termos de interesse

**Painel de métricas**
- Todas as queries de RF-01 são `COUNT(*)` ou `COUNT(*) FILTER` em tabelas pequenas (< 100k linhas)
- Tempo esperado: < 200ms total por carga do painel
- Sem cache no MVP; revisitar se p95 ultrapassar 1s

**Lista de usuários**
- Paginação keyset por `created_at DESC, id` (50 itens/página) — segue padrão do projeto
- Busca por `ilike` em `name`/`email` com índice GIN trigram opcional se ficar lento (não criado nesta entrega)

**Exportações CSV**
- Streaming via `Response(stream, { headers })` — memória O(1) independente do tamanho
- Limite implícito: timeout de 60s do Route Handler em Vercel; suficiente para volumes do MVP

**`last_active_at`**
- Atualizado por chamada `fire-and-forget` no layout autenticado
- Throttle: só atualiza se `last_active_at < NOW() - INTERVAL '1 hour'` (lógica em `touchLastActive`)
- Sem lock; UPDATE simples por `id`

---

## Tratamento de Erros

**Não-admin tentando acessar `/admin`**
- Middleware: redirect para `/dashboard?error=admin_required`
- Server Component: se middleware falhar, `requireAdmin()` lança `redirect("/dashboard?error=403")` (Next.js)
- Route Handler: retorna `403 Forbidden` JSON `{ error: "admin_required" }`

**Usuário banido tentando acessar qualquer rota autenticada**
- Middleware: redirect para `/banido` exibindo `banned_reason` (sanitizado)
- Logout permanece acessível em `/api/auth/sign-out`

**Erros em Server Actions**
- Try/catch ao redor da query principal
- Falha de validação Zod → retorna `{ ok: false, error: "validation_failed" }` com detalhes para a UI exibir
- Falha de banco → log no Sentry com `tags: { area: "admin", action: <nome> }` e retorna `{ ok: false, error: "internal" }`

**Falhas em exportação CSV**
- Se erro durante streaming: encerrar stream e o browser recebe arquivo truncado (aceitável)
- Sentry capture com `extra: { range, count_so_far }`

**Logging**
- Toda ação destrutiva (`updatePlanAction`, `banAction`, `unbanAction`) grava em `admin_audit_log` **antes** de retornar
- Exportações também são logadas (auditoria de saída de dados)
- Console logs estruturados serão capturados pelo Sentry conforme [`sentry.server.config.ts`](../../sentry.server.config.ts)

---

## Plano de Testes

**Testes unitários (Vitest)**
- `src/lib/auth/admin.ts` — `isAdmin(uuid)` retorna true/false correto
- `src/lib/admin/csv.ts` — serialização de linhas com vírgulas, aspas, quebras de linha
- Schemas Zod das Server Actions — payloads válidos e inválidos
- `requireAdmin` — comportamento de redirect (mock do helper de redirect)

**Testes de integração (Vitest contra Supabase local)**
- Inserir usuário em `admin_users` e validar `isAdmin(id) === true`
- `updateUserPlan` altera plano e grava em `admin_audit_log`
- `banUser` define `banned_at` e `banned_reason`
- Métricas: inserir 5 profiles, 10 alertas mockados, validar contagens

**Testes E2E (Playwright)**
- **Smoke admin**: login como admin → `/admin` → ver painel com cards renderizados
- **Bloqueio**: login como usuário comum → tentar `/admin` → ser redirecionado
- **Banimento**: admin bane usuário → fazer login com esse usuário → cair em `/banido`
- **Export**: clicar "Exportar Usuários" → arquivo CSV é baixado com header esperado

**Dados de teste**
- Reaproveitar `0004_sample_data.sql` + script `scripts/grant-admin.mjs` para o usuário dev

**Critérios de aceitação técnica**
- Lighthouse sem regressão nas rotas existentes
- Coverage mínimo de 70% nos módulos `src/lib/admin/`
- Type-check (`npm run typecheck`) sem erros
- Lint (`npm run lint`) sem warnings novos

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Service-role key vazar para client bundle | Baixa | Crítico | `import "server-only"` em todos os módulos `src/lib/admin/`; revisar build size; CI grep "SERVICE_ROLE" em `.next/static` |
| Admin executar ação destrutiva por engano | Média | Alto | Confirm dialog obrigatório com texto do impacto; campo motivo (≥10 chars); audit log retroativo permite reverter |
| Bypass do middleware em rotas admin | Baixa | Crítico | Defesa em camada: `requireAdmin()` chamado dentro do RSC e Route Handler — middleware é apenas conveniência |
| Banimento via `banned_at` não invalidar sessão ativa imediatamente | Média | Médio | Middleware roda em toda navegação e API call; bloqueio efetivo na próxima request (segundos). Para invalidação dura adicionar `supabase.auth.admin.signOut(userId)` em `banAction` |
| Plano alterado manualmente desincroniza com Stripe | Alta | Médio | Audit log obrigatório; mensagem do dialog avisa "esta ação não cancela cobranças no Stripe"; documentar fluxo de reconciliação manual |
| CSV grande estourar timeout de 60s | Baixa (MVP) | Baixo | Streaming nativo + paginação por cursor interno; log em Sentry se acontecer; revisar quando base crescer |
| Esquecer `requireAdmin()` em novo arquivo `(admin)/` | Média | Crítico | Adicionar regra ESLint custom (`no-unguarded-admin-route`) ou template snippet; revisão obrigatória em PR |

---

## Alternativas Consideradas

- **Coluna `is_admin` em `profiles`** → descartada porque mistura PII de usuário com flag de privilégio interno; tabela separada deixa mais explícito o que é "conta do produto" vs "permissão operacional".
- **Custom claim no JWT (`app_metadata.is_admin`)** → descartada porque exige refresh de sessão para revogar, e o ganho de "validação sem query" é irrelevante no volume atual; tabela `admin_users` mantém revogação imediata.
- **Políticas RLS para admin em todas as tabelas** → descartada por explosão de policies (12+ tabelas × 4 operações) e por dificultar queries agregadas que precisam ser puramente server-side; service-role centraliza a confiança em um único helper.
- **Banimento via `auth.users.banned_until` (Admin API)** → descartada como mecanismo único porque exige chamadas extras à Admin API e não permite armazenar `banned_reason` legível; pode ser adicionado como reforço futuro.
- **Painel embarcado (Metabase / Supabase Studio compartilhado)** → descartada porque exige expor dashboard externo, não permite ações de gestão integradas e quebra a continuidade de UX para o solo dev.
- **Server Action retornando string CSV** → descartada porque Server Actions têm payload limit de 1MB; Route Handler com streaming escala melhor.
- **Audit log apenas no Sentry** → descartada porque audit precisa ser consultável internamente (ex.: "qual o último motivo de banimento do usuário X?"); tabela é simples e pequena.

---

## Plano de Rollout

**Pré-requisitos**
- `SUPABASE_SERVICE_ROLE_KEY` configurado em Vercel (Production + Preview)
- Migration 0005 aplicada em todos os ambientes (`npx supabase db push`)
- Script `scripts/grant-admin.mjs --email jeffersonoh@gmail.com` executado em Production após deploy

**Ordem de deploy**
1. **PR 1 — Banco**: migration 0005 + tipos regenerados (`npm run db:types`)
2. **PR 2 — Auth/Middleware**: `requireAdmin`, extensão do middleware, página `/banido`, hook `last_active_at` (sem rotas admin ainda)
3. **PR 3 — Painel + Lista**: `/admin` e `/admin/usuarios` somente leitura
4. **PR 4 — Ações**: detalhe do usuário, Server Actions, audit log
5. **PR 5 — Exportações**: Route Handlers de CSV

Cada PR atravessa CI (typecheck, lint, vitest, playwright smoke) antes do merge.

**Feature toggle**
- Variável `ADMIN_DASHBOARD_ENABLED` (default `true` em prod) — permite desabilitar rotas admin via 404 em emergência sem precisar de revert

**Rollback**
- Reverter PR via `git revert` + redeploy
- Migration 0005 é aditiva — rollback do banco não é necessário; basta deixar colunas/tabelas sem uso
- Se necessário desfazer migration: drop tables `admin_audit_log`, `admin_users` e drop colunas `banned_at`, `banned_reason`, `last_active_at`

**Checklist pós-deploy**
- [ ] Login como admin → `/admin` carrega painel com métricas
- [ ] Login como usuário comum → `/admin` redireciona para `/dashboard?error=admin_required`
- [ ] Banir usuário de teste → confirmar redirect para `/banido` no próximo request
- [ ] Reativar usuário de teste → acesso normal restaurado
- [ ] Exportar usuários → CSV baixado com headers e dados corretos
- [ ] `admin_audit_log` recebe entrada para cada ação executada acima
- [ ] Sentry sem novos erros relacionados ao módulo admin

---

## Referências

- PRD: [`./prd.md`](./prd.md)
- Tech Spec do MVP: [`../avisus-mvp/tech-spec.md`](../avisus-mvp/tech-spec.md)
- AGENTS.md: [`../../docs/agents/AGENTS.md`](../../docs/agents/AGENTS.md)
- Migrations atuais: [`../../supabase/migrations/`](../../supabase/migrations/)
- Supabase Auth Admin API: https://supabase.com/docs/reference/javascript/auth-admin-api
- Padrão de RLS aplicado no projeto: [`../../supabase/migrations/0002_rls_policies.sql`](../../supabase/migrations/0002_rls_policies.sql)
- Design System: [`../../docs/agents/14-design-system.md`](../../docs/agents/14-design-system.md)
- Padrões de teste: [`../../docs/agents/15-testing-standards.md`](../../docs/agents/15-testing-standards.md)
