# 07-security.md: Segurança

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [06-domain-model.md](06-domain-model.md) | [04-coding-standards.md](04-coding-standards.md)

## Visão Geral

Estratégia de segurança do Avisus cobrindo autenticação, autorização (RLS), validação de entrada, proteção de endpoints cron, LGPD e gestão de secrets. Toda verificação de permissão acontece no servidor.

## Autenticação

- **Supabase Auth:** signup, login, OAuth (Email + Google), reset de senha, sessões JWT
- **Pacote:** `@supabase/ssr` para Next.js 15 (client + server + middleware)
- **Sessão:** Cookie-based HTTP-only, refresh automático via `middleware.ts`
- **Confirmação de e-mail:** Habilitada (configuração no dashboard Supabase)
- **Profile automático:** Trigger `on_auth_user_created` cria row em `profiles`
- **Cookies `httpOnly`:** [`src/lib/supabase/server.ts`](../../src/lib/supabase/server.ts) força `httpOnly: true` ao escrever cookies Supabase. Consequência: `supabase.auth.getSession()` no browser não recupera o token. Quando o cliente precisa do access token (ex.: `supabase.realtime.setAuth()` para canais autenticados), ler no Server Component (`(app)/layout.tsx`) e passar via prop — nunca relaxar o flag. Ver [ADR 011](../adrs/011_notificacoes_web_via_supabase_realtime.md)

## Autorização — Row Level Security (RLS)

RLS habilitado em **todas as tabelas**. Policies baseadas em `auth.uid()`:

| Tabela | Policy | Regra |
|--------|--------|-------|
| `profiles` | `profiles_own` | ALL — `auth.uid() = id` |
| `interests` | `interests_own` | ALL — `auth.uid() = user_id` |
| `opportunities` | `opps_read` | SELECT — público (dados não sensíveis) |
| `channel_margins` | `cm_read` | SELECT — público |
| `products` | `products_read` | SELECT — público |
| `price_history` | `ph_read` | SELECT — público |
| `marketplace_fees` | `mf_read` | SELECT — público |
| `alerts` | `alerts_select` / `alerts_update` | SELECT + UPDATE — `auth.uid() = user_id` |
| `subscriptions` | `subs_own` | SELECT — `auth.uid() = user_id` |
| `user_opportunity_status` | `uos_own` | ALL — `auth.uid() = user_id` |
| `favorite_sellers` | `fav_sellers_own` | ALL — `auth.uid() = user_id` |
| `live_alerts` | `live_alerts_select` / `live_alerts_update` | SELECT + UPDATE — `auth.uid() = user_id` |

### Scanner Functions e RLS

As Scanner Functions (`/api/cron/*`) usam `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS em operações batch (INSERT oportunidades, alertas, price_history). Essa chave **nunca** é exposta ao browser.

## Limites de Plano — Verificação no Backend

Todos os limites são verificados no servidor, nunca apenas no frontend:

```typescript
// Interesses
const { count } = await supabase
  .from('interests').select('*', { count: 'exact', head: true })
  .eq('user_id', user.id).eq('active', true);
if (count >= PLAN_LIMITS[plan].maxInterests) throw new Error('LIMIT_REACHED');

// Alertas (ofertas + lives)
const sentToday = await supabase.rpc('alerts_sent_today', { p_user_id: user.id });
if (sentToday >= PLAN_LIMITS[plan].maxAlertsPerDay) // skip alert

// Vendedores favoritos
const { count: favCount } = await supabase
  .from('favorite_sellers').select('*', { count: 'exact', head: true })
  .eq('user_id', user.id);
if (favCount >= PLAN_LIMITS[plan].maxFavoriteSellers) throw new Error('LIMIT_REACHED');
```

## Validação de Entrada (Zod)

Toda entrada de usuário validada com Zod em Server Actions e Route Handlers:

| Campo | Schema |
|-------|--------|
| Telegram username | `z.string().regex(/^@?[a-zA-Z0-9_]{5,32}$/)` |
| Termo de interesse | `z.string().trim().min(2).max(100)` |
| Seller URL (F14) | `z.string().url()` + validação domínio (`shopee.com.br` / `tiktok.com`) |
| Seller username | `z.string().regex(/^[a-zA-Z0-9._-]{2,50}$/)` |

## Proteção de Endpoints Cron

Os Route Handlers de cron (`/api/cron/*`) são URLs públicas na Vercel. Proteção via header:

```typescript
const authHeader = request.headers.get('Authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

O Vercel Cron envia automaticamente o `CRON_SECRET` como header de autorização.

## Webhook Stripe

Validação de assinatura do payload via `stripe.webhooks.constructEvent()`:

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

Payloads com assinatura inválida são rejeitados. Idempotência: verifica `stripe_subscription_id` existente antes de processar.

## Dados Sensíveis

- **Senhas:** Gerenciadas pelo Supabase Auth (bcrypt interno)
- **Tokens de API:** Variáveis de ambiente Vercel (nunca no código)
  - `TELEGRAM_BOT_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SCRAPINGBEE_API_KEY`, `APIFY_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
- **Logs:** Não contêm dados pessoais completos (CPF, telefone, senha)
- **Respostas de erro:** Mensagens genéricas ao usuário; detalhes apenas no log do servidor
- **Padrão de retorno seguro:**
  - Server Actions: `{ error: string, code: string }` (nunca expõe stack ou mensagem interna)
  - Route Handlers: respostas HTTP semânticas (`400` / `401` / `403` / `500`) com corpo JSON
  - Scanner/Live Monitor: erros isolados por marketplace/plataforma (falha em um não bloqueia outro)

## LGPD

- **Consentimento no onboarding** (RF-49): Texto informando uso de dados para alertas e cálculo de frete/margem
- **Coleta mínima:** Nome, e-mail, telefone (opcional), estado, cidade, canais de alerta
- **Exclusão de conta:** `DELETE` no Supabase Auth → cascade para todas as tabelas (via FK `ON DELETE CASCADE`)
- **Texto de conformidade:** Visível na tela de perfil
- **Dados pessoais ausentes em:** Logs, respostas de erro, URLs

## Checklist de Segurança

- [ ] Nenhuma credencial hardcoded
- [ ] Queries via Supabase client (prepared statements)
- [ ] Validação Zod presente em todas as Server Actions
- [ ] Dados pessoais ausentes em logs e respostas de erro
- [ ] RLS ativo em todas as tabelas
- [ ] Limites de plano verificados no backend
- [ ] `SUPABASE_SERVICE_ROLE_KEY` usado apenas em Vercel Functions (nunca no browser)
- [ ] `CRON_SECRET` validado em todos os endpoints cron
- [ ] Webhook Stripe com verificação de assinatura e idempotência (`stripe_subscription_id` existente antes de processar)
- [ ] `NEXT_PUBLIC_*` não contém secrets

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [06-domain-model.md](06-domain-model.md) | Próximo: [08-performance.md](08-performance.md)*
