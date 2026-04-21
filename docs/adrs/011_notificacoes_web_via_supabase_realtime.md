# ADR 011: Notificações web e badge de não-lidos via Supabase Realtime

## Status

Aceita

## Data

2026-04-21

## Contexto

O canal `web` estava declarado em [`profiles.alert_channels`](../../supabase/migrations/0001_init.sql) e registrado em `alerts.channel`, mas não havia entrega real ao navegador: o usuário `jeffersonoh` tinha 60 alertas persistidos e nenhum toast/notificação nativa havia disparado. A tela `/alertas` também não sinalizava itens novos — era preciso entrar manualmente para perceber.

A equipe precisava de dois comportamentos para fechar o canal web sem introduzir infra nova (SSE, WebSocket próprio, service worker com push):

1. **Notificação nativa do navegador** (`new Notification()`) disparada quando um `alerts` é inserido para o usuário logado.
2. **Badge de não-lidos** ao lado de "Alertas" na `AppHeader`, reativo em tempo real, com política simples de "marcar como lido" (visitar `/alertas`).

Supabase Realtime já está contratado no projeto (ADR 002) e suporta `postgres_changes` com filtros por RLS. A restrição descoberta em validação é que o cliente só recebe eventos se o canal Realtime estiver autenticado com o JWT do usuário (claims_role ≠ `anon`), caso contrário o servidor filtra tudo via RLS e o cliente recebe zero eventos.

Uma segunda restrição surgiu do padrão de auth do repo: [`src/lib/supabase/server.ts`](../../src/lib/supabase/server.ts) escreve cookies Supabase com `httpOnly: true`. Isso protege o refresh token contra XSS, mas também impede `supabase.auth.getSession()` no cliente de recuperar o access token — o que é exigido por `supabase.realtime.setAuth(token)`.

## Decisão

Entregar o canal `web` combinando três peças, todas serverless, sem service worker e sem fila:

### 1. Realtime autenticado com access token injetado via prop

- [`src/app/(app)/layout.tsx`](../../src/app/(app)/layout.tsx) lê `supabase.auth.getSession()` no Server Component, extrai `access_token` e passa como prop para os clientes.
- [`AlertNotifier`](../../src/features/notifications/AlertNotifier.tsx) e [`UnreadAlertsProvider`](../../src/features/notifications/UnreadAlertsProvider.tsx) chamam `await supabase.realtime.setAuth(accessToken)` **antes** de `.subscribe()`. Sem isso, o socket conecta com `claims_role: anon` e o RLS bloqueia todos os eventos.
- Mantemos `httpOnly: true` nos cookies (sem abrir brecha a XSS para o refresh token).

### 2. Notificação nativa por INSERT em `alerts`

- `AlertNotifier` assina `postgres_changes` INSERT em `public.alerts` filtrando por `user_id=eq.${userId}` e `channel === "web"`.
- No callback, faz fetch da `opportunities` para montar título/corpo e dispara `new Notification(title, { body, icon, tag })`.
- Renderiza um banner "Ativar" enquanto `Notification.permission === "default"`; some em qualquer outro estado.

### 3. Badge de não-lidos com política "visita zera"

- Status considerado **não-lido**: `alerts.status IN ('pending','sent')` e `live_alerts.status = 'sent'`.
- `UnreadAlertsProvider` mantém o contador em Context; inicializa com valor vindo do servidor (`getUnreadAlertsCount` server action) e recalcula via debounce (150 ms) ao receber qualquer `postgres_changes` em `alerts` / `live_alerts`.
- `AppHeader` consome o contador via `useUnreadAlertsCount()` e renderiza o pill vermelho ao lado do link `/alertas` (clamp `99+`, `aria-label` acessível).
- [`MarkAlertsOnMount`](../../src/features/notifications/MarkAlertsOnMount.tsx) chama a server action `markAlertsAsRead` no `useEffect` da página `/alertas` — promove `pending/sent` → `read` para ambas as tabelas.

### Migrations envolvidas

- [`0005_realtime_alerts.sql`](../../supabase/migrations/0005_realtime_alerts.sql) — `ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts`.
- [`0006_alerts_read_status.sql`](../../supabase/migrations/0006_alerts_read_status.sql) — adiciona `'read'` ao check de `live_alerts.status` e publica a tabela no mesmo canal.

## Alternativas Consideradas

- **Service worker + Web Push (VAPID)** — entregaria notificações com app fechado, mas introduz chaves VAPID, endpoint/subscription por device, expiração e opt-in do SO. Over-engineering para um MVP onde o usuário tipicamente está com a aba aberta durante o trabalho; reavaliar pós-MVP.
- **SSE/WebSocket próprio** — exigiria um worker persistente (contra o princípio serverless-first da ADR 001).
- **Long polling via server action** — simples, mas perde a latência ~instantânea e o efeito "empurra" do Realtime.
- **Contar não-lidos por timestamp (`last_seen_at` no profile)** — flexível, mas salva uma coluna extra, exige update em todo render de `/alertas` e não modela bem "eu já vi mas quero manter como pendente". A abordagem de status explícito é auditável e reutiliza a coluna existente.
- **Tornar cookies Supabase `httpOnly: false`** — simplificaria o client (chamaria `getSession()` direto no browser) mas expõe o refresh token a XSS. Descartada por segurança.

## Consequências

**Positivas:**

- Fecha o canal `web` com infra que já temos (Supabase Realtime + Postgres).
- Notificação nativa + badge reagem em ~1-2 s após o INSERT.
- Política de leitura ("entrou em `/alertas` → zerou") é simples e discoverable — nenhum usuário precisa aprender a "marcar como lido".
- Refresh token continua protegido por `httpOnly`.

**Negativas:**

- Sem service worker, o canal só entrega enquanto a aba está aberta. Se o usuário fecha o Chrome, o alerta fica apenas persistido no banco até o próximo login (Telegram cobre off-line).
- Access token tem TTL de ~1 h; em sessões muito longas sem refresh no servidor, o canal Realtime pode cair silenciosamente até um reload. Aceito no MVP; se virar dor, revisar mid-session refresh.
- Estender auth Realtime para outros recursos (presence, broadcast) exige replicar o padrão "prop do server". Documentado em [`09-integrations.md`](../agents/09-integrations.md).
- Qualquer nova tabela que precise participar do contador precisa ser publicada em `supabase_realtime` + listada em `getUnreadAlertsCount`.

**Neutras:**

- Status `'read'` agora é comum a `alerts` e `live_alerts`. `alerts_sent_today(user_id)` continua contando ofertas+lives do dia independentemente do status — sem impacto no enforcement do plano FREE.
- Dois scripts puppeteer novos cobrem o fluxo ponta-a-ponta: [`scripts/browser-alert-notifier-test.mjs`](../../scripts/browser-alert-notifier-test.mjs) e [`scripts/browser-alerts-badge-test.mjs`](../../scripts/browser-alerts-badge-test.mjs).

## Referências

- Código cliente: [`src/features/notifications/AlertNotifier.tsx`](../../src/features/notifications/AlertNotifier.tsx), [`UnreadAlertsProvider.tsx`](../../src/features/notifications/UnreadAlertsProvider.tsx), [`MarkAlertsOnMount.tsx`](../../src/features/notifications/MarkAlertsOnMount.tsx), [`actions.ts`](../../src/features/notifications/actions.ts)
- Injeção de token: [`src/app/(app)/layout.tsx`](../../src/app/(app)/layout.tsx)
- Badge: [`src/components/AppHeader.tsx`](../../src/components/AppHeader.tsx)
- Migrations: [`0005_realtime_alerts.sql`](../../supabase/migrations/0005_realtime_alerts.sql), [`0006_alerts_read_status.sql`](../../supabase/migrations/0006_alerts_read_status.sql)
- Integrações: [`../agents/09-integrations.md`](../agents/09-integrations.md)
- ADR 002 (Supabase): [`./002_supabase_como_auth_db_rls.md`](./002_supabase_como_auth_db_rls.md)

> Todo ADR deve ter no máximo uma página.
