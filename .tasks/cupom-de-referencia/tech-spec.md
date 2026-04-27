# Tech Spec — Cupom de Referência

## Contexto

- PRD correspondente: [`prd.md`](./prd.md) — Cupom de Referência.
- Stack real do projeto: Next.js 15 App Router, React, TypeScript strict, Supabase PostgreSQL/Auth/RLS e Stripe.
- Estado atual: não há tabelas, rotas ou componentes de cupom/referral no codebase. O cadastro vive em `src/components/auth/RegisterForm.tsx` e `src/lib/auth/actions.ts`; o checkout pago vive em `src/features/plans/actions.ts`; o webhook Stripe atual está em `src/app/api/stripe/webhook/route.ts` e processa `customer.subscription.*` e `invoice.payment_failed`.
- Decisões de clarificação: autorização admin por campo em `profiles`; UI em `/admin/cupons`; código manual substitui referência do link; `?ref=` será preservado em cookie first-party; primeira conversão paga será registrada via webhook Stripe.

O objetivo técnico é introduzir atribuição de cadastro e primeira conversão paga sem alterar preços de planos, sem rastrear cliques/impressões e sem criar programa de afiliados multinível.

## Escopo Técnico

Será construído/modificado:

| Área | Ação |
|------|------|
| Banco Supabase | Criar `referral_coupons`, `referral_conversions`; adicionar `profiles.is_admin`, `profiles.referral_coupon_id`, `profiles.referral_source`; ajustar RLS de `profiles` para impedir autoelevação/admin e alteração manual de referral |
| Middleware | Capturar `?ref=` e gravar cookie `avisus_referral_code` de curta duração |
| Auth/cadastro | Adicionar campo opcional de cupom em `RegisterForm`; validar e consumir cupom em `signUpWithEmail`; suportar OAuth no callback |
| Stripe | Adicionar tratamento idempotente de `invoice.paid` para registrar primeira conversão paga |
| Admin | Criar `/admin/cupons` com listagem, formulário de criação/edição, ativação/desativação e métricas simples de comissão |
| Feature module | Criar `src/features/referrals/` para schemas, actions, componentes e regras de normalização |
| Tipos | Regenerar `src/types/database.ts` após migration |

Não será alterado:

- Preço dos planos, Stripe coupons ou descontos no Checkout.
- Fluxo de scanner, alertas, favoritos, interesses ou margem.
- Pagamento automático de comissões.
- Dashboard público de parceiros.
- Analytics de clique/impressão.
- Comissão recorrente de pagamentos posteriores.

## Arquitetura e Design

### Visão Geral da Solução

A solução usa três pontos de integração:

1. `src/lib/supabase/middleware.ts` detecta `ref` em qualquer página pública/autenticada coberta pelo matcher, normaliza o código e grava `avisus_referral_code` no response cookie com `httpOnly`, `sameSite=lax`, `secure` em produção e `maxAge` de 24h.
2. O cadastro consome o código manual ou o cookie, valida contra `referral_coupons` e cria uma linha idempotente em `referral_conversions` com `plan_selected='free'`. O campo manual tem precedência quando preenchido.
3. O webhook Stripe processa `invoice.paid`, resolve o `user_id` da assinatura e atualiza a conversão existente somente se `first_paid_date IS NULL`, registrando plano pago, valor, moeda, invoice e subscription.

Fluxo principal:

```text
avisus.app/?ref=PARCEIRO_2026
  -> middleware grava cookie avisus_referral_code
  -> /registro exibe campo opcional preenchido
  -> signUpWithEmail valida cupom e cria usuário
  -> recordSignupReferral(userId, code) cria referral_conversions
  -> usuário faz upgrade em /planos
  -> Stripe envia invoice.paid
  -> recordFirstPaidReferral(userId, plan, amount, invoice) atualiza primeira conversão paga
  -> /admin/cupons calcula comissão = paid_amount * commission_rate_pct / 100
```

### Componentes Envolvidos

| Componente | Tipo | Ação | Descrição |
|------------|------|------|-----------|
| `supabase/migrations/0009_referral_coupons.sql` | Migration | Criar | Modelo de referral, RLS, constraints, índices e ajustes em `profiles` |
| `src/types/database.ts` | Tipos gerados | Modificar | Incluir novas tabelas/colunas após `npm run db:types` |
| `src/lib/supabase/middleware.ts` | Middleware | Modificar | Capturar `?ref=`, gravar cookie, proteger `/admin` por `profiles.is_admin` |
| `src/lib/auth/admin.ts` | Lib server | Criar | `requireAdmin()` e `isAdmin()` usando `profiles.is_admin` |
| `src/lib/auth/actions.ts` | Server Actions | Modificar | Ler `referralCode` do form/cookie em `signUpWithEmail`; limpar cookie após consumo |
| `src/app/auth/callback/route.ts` | Route Handler | Modificar | Consumir cookie de referral após OAuth callback bem-sucedido |
| `src/components/auth/RegisterForm.tsx` | Client Component | Modificar | Campo opcional de cupom, validação client-side básica e feedback |
| `src/app/(auth)/registro/page.tsx` | Server Component | Modificar | Ler cookie inicial e passar `initialReferralCode` para `RegisterForm` |
| `src/features/referrals/schemas.ts` | Lib | Criar | Zod schemas para código, coupon admin e filtros |
| `src/features/referrals/server.ts` | Lib server | Criar | `validateReferralCode`, `recordSignupReferral`, `recordFirstPaidReferral` |
| `src/features/referrals/cookies.ts` | Lib server | Criar | Constante do cookie e helpers de leitura/limpeza |
| `src/features/referrals/actions.ts` | Server Actions | Criar | Validação pública de cupom e CRUD admin |
| `src/features/referrals/ReferralCodeField.tsx` | Client Component | Criar | Campo reutilizável para cadastro |
| `src/features/referrals/admin/ReferralCouponForm.tsx` | Client Component | Criar | Formulário admin de criar/editar cupom |
| `src/features/referrals/admin/ReferralCouponTable.tsx` | Client Component | Criar | Tabela de cupons com ações de ativar/desativar |
| `src/app/(admin)/admin/cupons/page.tsx` | Server Component | Criar | Página admin com listagem e métricas simples |
| `src/app/(admin)/admin/cupons/novo/page.tsx` | Server Component | Criar | Página de criação |
| `src/app/(admin)/admin/cupons/[id]/page.tsx` | Server Component | Criar | Página de edição/detalhe |
| `src/app/api/stripe/webhook/route.ts` | Route Handler | Modificar | Adicionar `invoice.paid` e chamada idempotente a `recordFirstPaidReferral` |
| `src/lib/profile-cache.ts` | Lib server | Modificar | Incluir `is_admin` se for necessário exibir navegação admin |

### Contratos e Interfaces

Constantes e schemas:

```ts
// src/features/referrals/schemas.ts
export const REFERRAL_CODE_REGEX = /^[A-Z0-9_]{5,30}$/;
export function normalizeReferralCode(input: string): string;

export const referralCodeSchema = z
  .string()
  .trim()
  .transform((value) => normalizeReferralCode(value))
  .refine((value) => REFERRAL_CODE_REGEX.test(value), "Cupom inválido.");

export const referralCouponAdminSchema = z.object({
  code: referralCodeSchema,
  partnerName: z.string().trim().min(2).max(120),
  partnerEmail: z.string().trim().email().optional().or(z.literal("")),
  commissionRatePct: z.number().min(0).max(100),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(1000).optional(),
});
```

Server helpers:

```ts
// src/features/referrals/server.ts
export type ReferralValidationResult =
  | { ok: true; coupon: { id: string; code: string } }
  | { ok: false; reason: "not_found" | "inactive" | "expired" | "invalid_format" };

export async function validateReferralCode(code: string): Promise<ReferralValidationResult>;

export async function recordSignupReferral(input: {
  userId: string;
  code: string;
  source: "coupon";
}): Promise<{ ok: true } | { ok: false; reason: ReferralValidationResult["reason"] }>;

export async function recordFirstPaidReferral(input: {
  userId: string;
  plan: "starter" | "pro";
  paidAmount: number;
  currency: string;
  stripeInvoiceId: string;
  stripeSubscriptionId: string | null;
  paidAt: string;
}): Promise<void>;
```

Admin auth:

```ts
// src/lib/auth/admin.ts
export async function isAdmin(userId: string): Promise<boolean>;
export async function requireAdmin(): Promise<{ userId: string }>;
```

Admin actions:

```ts
// src/features/referrals/actions.ts
export async function validateReferralCodeAction(code: string): Promise<ReferralValidationResult>;
export async function createReferralCouponAction(input: ReferralCouponAdminInput): Promise<ActionResult>;
export async function updateReferralCouponAction(id: string, input: ReferralCouponAdminInput): Promise<ActionResult>;
export async function toggleReferralCouponAction(id: string, isActive: boolean): Promise<ActionResult>;
```

Form fields:

- `RegisterForm` adiciona `name="referralCode"` opcional.
- `signUpWithEmail` usa `referralCode` do `FormData` quando preenchido; caso contrário usa cookie `avisus_referral_code`.
- Cupom inválido retorna erro amigável no estado do formulário, mas deve permitir remover o código e cadastrar sem cupom.

Stripe webhook:

- Novo case `invoice.paid` em `src/app/api/stripe/webhook/route.ts`.
- Resolver `stripe_subscription_id` por `invoice.parent?.subscription_details?.subscription` conforme padrão já usado em `handleInvoicePaymentFailed`.
- Valor base: `invoice.amount_paid / 100`; moeda: `invoice.currency.toUpperCase()`.
- Apenas registrar se assinatura interna estiver ativa ou o evento indicar pagamento confirmado. Recorrências são ignoradas por `first_paid_date IS NOT NULL` ou `stripe_invoice_id` já registrado.

## Modelo de Dados

Migration proposta: `supabase/migrations/0009_referral_coupons.sql`.

```sql
-- ========================================
-- PROFILES — admin + referral attribution
-- ========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ========================================
-- REFERRAL_COUPONS
-- ========================================
CREATE TABLE public.referral_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  partner_email TEXT,
  commission_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (commission_rate_pct >= 0 AND commission_rate_pct <= 100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_coupons_code_format CHECK (code ~ '^[A-Z0-9_]{5,30}$')
);

CREATE UNIQUE INDEX uq_referral_coupons_code ON public.referral_coupons (code);
CREATE INDEX idx_referral_coupons_active ON public.referral_coupons(is_active, expires_at);

CREATE TRIGGER tr_referral_coupons_updated BEFORE UPDATE ON public.referral_coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- PROFILES — FK depois de referral_coupons
-- ========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_coupon_id UUID,
  ADD COLUMN IF NOT EXISTS referral_source TEXT NOT NULL DEFAULT 'direct';

DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_referral_coupon_id_fkey
    FOREIGN KEY (referral_coupon_id) REFERENCES public.referral_coupons(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_referral_source_check
    CHECK (referral_source IN ('direct', 'coupon'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_coupon ON public.profiles(referral_coupon_id);

-- ========================================
-- REFERRAL_CONVERSIONS
-- ========================================
CREATE TABLE public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.referral_coupons(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_selected VARCHAR(10) NOT NULL DEFAULT 'free'
    CHECK (plan_selected IN ('free', 'starter', 'pro')),
  signup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_paid_date TIMESTAMPTZ,
  paid_amount NUMERIC(12,2),
  paid_currency CHAR(3) NOT NULL DEFAULT 'BRL',
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_conversions_one_per_user UNIQUE (user_id),
  CONSTRAINT referral_paid_fields_consistent CHECK (
    (first_paid_date IS NULL AND paid_amount IS NULL)
    OR (first_paid_date IS NOT NULL AND paid_amount IS NOT NULL AND paid_amount >= 0)
  )
);

CREATE INDEX idx_referral_conversions_coupon_signup
  ON public.referral_conversions(coupon_id, signup_date DESC);

CREATE INDEX idx_referral_conversions_coupon_paid
  ON public.referral_conversions(coupon_id, first_paid_date DESC)
  WHERE first_paid_date IS NOT NULL;

CREATE UNIQUE INDEX uq_referral_conversions_invoice
  ON public.referral_conversions(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

CREATE TRIGGER tr_referral_conversions_updated BEFORE UPDATE ON public.referral_conversions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- RLS helpers
-- ========================================
CREATE OR REPLACE FUNCTION public.profile_is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = p_user_id), FALSE);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.profile_self_update_allowed(
  p_user_id UUID,
  p_is_admin BOOLEAN,
  p_referral_coupon_id UUID,
  p_referral_source TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles current_profile
    WHERE current_profile.id = p_user_id
      AND current_profile.is_admin IS NOT DISTINCT FROM p_is_admin
      AND current_profile.referral_coupon_id IS NOT DISTINCT FROM p_referral_coupon_id
      AND current_profile.referral_source IS NOT DISTINCT FROM p_referral_source
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Recria policy ampla atual para bloquear autoelevação e alteração manual de referral.
DROP POLICY IF EXISTS profiles_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND public.profile_self_update_allowed(
      (SELECT auth.uid()), is_admin, referral_coupon_id, referral_source
    )
  );

ALTER TABLE public.referral_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_coupons_admin_all ON public.referral_coupons
  FOR ALL TO authenticated
  USING (public.profile_is_admin((SELECT auth.uid())))
  WITH CHECK (public.profile_is_admin((SELECT auth.uid())));

CREATE POLICY referral_conversions_admin_all ON public.referral_conversions
  FOR ALL TO authenticated
  USING (public.profile_is_admin((SELECT auth.uid())))
  WITH CHECK (public.profile_is_admin((SELECT auth.uid())));
```

Impacto em dados existentes:

- Usuários atuais recebem `is_admin=false`, `referral_source='direct'` e `referral_coupon_id=NULL`.
- O admin inicial deve ser promovido manualmente via SQL controlado: `UPDATE public.profiles SET is_admin = TRUE WHERE id = '<uuid>';`.
- `profiles_own` será substituída por policies mais restritas; actions existentes de perfil continuam válidas porque não alteram `is_admin`, `referral_coupon_id` ou `referral_source`.

## Integrações

Stripe:

- Adicionar o evento `invoice.paid` ao webhook configurado no Dashboard Stripe.
- Manter verificação de assinatura via `stripe.webhooks.constructEvent()` em `src/app/api/stripe/webhook/route.ts`.
- Não usar Stripe Coupons nem Promotion Codes. O cupom Avisus é interno e não altera preço.
- `customer.subscription.created/updated` continuam sincronizando `subscriptions` e `profiles.plan`.
- `invoice.paid` será a fonte de verdade para valor pago e data da primeira comissão.

Supabase:

- Server Actions comuns usam `createServerClient()` quando operam no usuário autenticado.
- Operações de signup referral, OAuth callback, admin CRUD e webhook usam `createServiceRoleClient()` no servidor porque precisam escrever dados fora do contexto RLS do usuário ou após signup sem sessão.
- O service role nunca será importado em Client Components.

Next.js middleware/cookies:

- `src/lib/supabase/middleware.ts` já centraliza session refresh e redirects. A captura de `ref` deve ocorrer antes dos retornos antecipados para `/` e rotas protegidas.
- Criar helper interno `applyResponseCookies(response, pendingCookies, referralCookie)` para não perder cookies em redirects.

## Segurança

- Validar todo código de cupom com Zod e regex `^[A-Z0-9_]{5,30}$` após normalização para uppercase.
- Não confiar no `referralCode` enviado pelo cliente; sempre revalidar existência, status ativo e expiração no servidor.
- Proteger `/admin` no middleware e chamar `requireAdmin()` em todo Server Component, Server Action e Route Handler admin.
- `profiles.is_admin`, `profiles.referral_coupon_id` e `profiles.referral_source` são campos privilegiados; RLS deve impedir alteração pelo próprio usuário via anon key.
- `referral_coupons` contém e-mail de parceiro e deve ter acesso restrito a admin.
- `referral_conversions` associa usuário a parceiro e deve ser visível apenas a admin/serviço.
- Logs do webhook não devem incluir e-mails completos, nomes de parceiros ou payloads Stripe integrais.
- Cookie `avisus_referral_code`: `httpOnly=true`, `sameSite='lax'`, `secure` em produção, `path='/'`, `maxAge=86400`.
- A UI não deve expor ao usuário dados pessoais ou comerciais do parceiro.

## Performance

- Volume esperado é baixo no MVP: dezenas de cupons, centenas/milhares de conversões.
- Índices principais: `referral_coupons(code)`, `referral_conversions(user_id)`, `referral_conversions(coupon_id, signup_date DESC)`, `referral_conversions(coupon_id, first_paid_date DESC)`.
- Validação de cupom por código usa índice único e uma única query.
- Admin listagem de cupons deve usar paginação simples por `created_at DESC` com limite padrão 50. Se crescer, migrar para keyset pagination conforme padrão do projeto.
- Cálculo de comissão deve ser agregado no servidor com `SUM(paid_amount * commission_rate_pct / 100)` e não no browser.
- Webhook Stripe deve responder 200 para eventos duplicados/irrelevantes e usar constraints únicas para idempotência.

## Internacionalização (i18n)

- O projeto não usa i18n no MVP; todos os textos de UI serão em Português do Brasil.
- Mensagens novas:
  - Cadastro: "Cupom de parceiro", "Este código identifica uma parceria e não altera o preço do plano.", "Cupom reconhecido.", "Cupom inválido, inativo ou expirado."
  - Admin: "Cupons", "Parceiro", "Comissão", "Ativo", "Expira em", "Conversões pagas", "Valor comissionável".
- Moeda em BRL com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Datas em `pt-BR`, mantendo armazenamento em `TIMESTAMPTZ`.

## Tratamento de Erros

- Cupom com formato inválido: erro inline no campo, sem chamada ao banco.
- Cupom inexistente/inativo/expirado: `validateReferralCode` retorna reason específico; UI mostra mensagem única amigável.
- Falha ao registrar referral após signup: não deve impedir criação da conta; registrar `console.warn` sem PII e limpar cookie apenas se a tentativa foi concluída com sucesso ou o usuário removeu o código.
- Falha no CRUD admin: retornar `{ ok: false, error: string }` e manter dados do formulário.
- Violação de unique `code`: mapear para "Já existe um cupom com este código.".
- Webhook `invoice.paid` sem usuário resolvível: log warning com `stripe_invoice_id` e retornar 200 para evitar retry infinito; criar alerta operacional manual se Sentry estiver ativo.
- Webhook com erro de banco temporário: retornar 500 para permitir retry do Stripe.
- Eventos recorrentes ou duplicados: não alterar `first_paid_date`; retornar sucesso idempotente.

## Plano de Testes

Testes unitários/componentes:

- `src/__tests__/features/auth/RegisterForm.test.tsx`: renderiza campo de cupom, aceita edição, mostra feedback inválido e preserva envio sem cupom.
- `src/__tests__/features/referrals/ReferralCodeField.test.tsx`: normalização uppercase, validação e mensagens acessíveis.
- `src/__tests__/features/referrals/ReferralCouponForm.test.tsx`: criação/edição admin, validação de comissão, data de expiração e estado loading.
- `src/__tests__/features/referrals/ReferralCouponTable.test.tsx`: listagem, badges ativo/inativo e ação de desativar.

Testes de integração Supabase:

- Criar cupom e validar que usuário comum não consegue selecionar/inserir `referral_coupons` diretamente.
- Verificar que usuário comum não consegue atualizar `profiles.is_admin`, `profiles.referral_coupon_id` ou `profiles.referral_source` via anon client.
- `recordSignupReferral` cria uma conversão FREE e atualiza `profiles.referral_coupon_id/source`.
- `recordSignupReferral` é idempotente para o mesmo `user_id`.
- `recordFirstPaidReferral` atualiza apenas uma vez, ignora recorrência e respeita `stripe_invoice_id` único.

Testes do webhook:

- Estender `tests/integration/stripe-webhook.test.ts` ou criar `tests/integration/referral-webhook.test.ts` para simular `invoice.paid` usando service client e verificar atualização de conversão.
- Testar duplicidade do mesmo invoice.
- Testar usuário sem referral: webhook não cria conversão.

Teste manual/E2E mínimo:

- Acessar `/registro?ref=CUPOM_TESTE`, confirmar campo preenchido, cadastrar usuário, verificar `referral_conversions`.
- Acessar `/?ref=CUPOM_TESTE`, confirmar cookie e redirecionamento sem perder atribuição.
- Fazer upgrade em ambiente Stripe test e confirmar `first_paid_date`/`paid_amount`.
- Acessar `/admin/cupons` com `is_admin=false` e confirmar 403/redirect; repetir com `is_admin=true`.

Comandos de validação esperados:

```bash
npm run typecheck
npm test
npm run test:integration
npm run build
```

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Usuário malicioso tentar autoatribuir cupom ou admin via Supabase client | Média | Alto | RLS restritiva em `profiles` + writes privilegiados apenas via service role server-side |
| `invoice.paid` chegar antes da linha de `subscriptions` estar atualizada | Média | Médio | Resolver `user_id` por customer/subscription metadata e manter handler idempotente; logar quando impossível |
| Cookie `ref` expirar antes de o usuário confirmar e-mail | Média | Baixo | Registrar referral no momento do signup, não após confirmação de e-mail |
| Conflito com futura implementação de admin dashboard | Média | Médio | Usar `/admin/cupons` e `profiles.is_admin`; documentar alternativa descartada `admin_users` |
| Comissão registrada para pagamento recorrente | Baixa | Alto | Condição `first_paid_date IS NULL` + unique parcial em `stripe_invoice_id` |
| Código de cupom em lowercase ou com caracteres inválidos em campanhas | Média | Baixo | Normalizar uppercase e restringir regex; admin recebe erro antes de salvar |

## Alternativas Consideradas

- **Usar Stripe Promotion Codes**: descartado porque o PRD exige cupom apenas de atribuição, sem desconto ou mudança de preço.
- **Persistir referência em `localStorage`**: descartado porque Server Actions e OAuth callback precisam ler o valor no servidor; cookie first-party atende SSR e redirects.
- **Tabela `admin_users` separada**: descartada para esta feature porque a decisão de clarificação foi usar campo em `profiles`. A Tech Spec do dashboard admin anterior propõe `admin_users`, mas o PRD de admin também assume controle binário e esta feature adotará `profiles.is_admin` para reduzir tabelas no MVP.
- **Registrar conversão apenas quando `profiles.plan` muda**: descartado porque não fornece valor pago nem invoice; `invoice.paid` é a fonte confirmada de pagamento.
- **Criar conversão somente no primeiro pagamento**: descartado porque o PRD exige contabilizar cadastros FREE indicados.
- **Expor validação de cupom via Route Handler público**: descartado por enquanto; Server Action reduz superfície pública e reaproveita validação server-side.

## Plano de Rollout

Pré-requisitos:

- Confirmar que Supabase local está atualizado até `0008`.
- Adicionar `invoice.paid` na configuração do webhook Stripe em ambiente test/prod.
- Definir o usuário admin inicial após migration (`profiles.is_admin=true`).

Ordem de deploy:

1. Criar migration `0009_referral_coupons.sql` e aplicar localmente.
2. Rodar `npm run db:types` para atualizar `src/types/database.ts`.
3. Implementar helpers server, middleware e actions de referral.
4. Implementar campo de cupom no cadastro e consumo no OAuth callback.
5. Implementar admin `/admin/cupons`.
6. Estender webhook Stripe com `invoice.paid`.
7. Rodar testes unitários, integração, typecheck e build.
8. Aplicar migration em produção antes do deploy da aplicação.
9. Promover admin inicial no banco de produção.
10. Configurar evento `invoice.paid` no webhook Stripe de produção.

Rollback:

- Se a UI/admin falhar: ocultar link de `/admin/cupons` e manter tabelas sem perda de dados.
- Se o webhook falhar: remover temporariamente o case `invoice.paid` do deploy ou desabilitar evento no Stripe; cadastros FREE permanecem preservados.
- Não dropar tabelas em rollback imediato; preservar histórico de atribuição para conciliação manual.
- Se RLS de `profiles` bloquear perfil, restaurar policy anterior temporariamente somente após remover permissões de update direto para campos privilegiados via hotfix seguro.

Checklist pós-deploy:

- Criar cupom teste em `/admin/cupons`.
- Validar `/registro?ref=CUPOM_TESTE` e cadastro FREE.
- Validar bloqueio de `/admin/cupons` para usuário comum.
- Validar upgrade Stripe test e preenchimento de `first_paid_date`.
- Conferir ausência de desconto no Checkout.

## Referências

- PRD: [`./prd.md`](./prd.md)
- Arquitetura Avisus: [`docs/agents/03-architecture.md`](../../docs/agents/03-architecture.md)
- Padrões de código: [`docs/agents/04-coding-standards.md`](../../docs/agents/04-coding-standards.md)
- Modelo de domínio: [`docs/agents/06-domain-model.md`](../../docs/agents/06-domain-model.md)
- Segurança: [`docs/agents/07-security.md`](../../docs/agents/07-security.md)
- Integrações: [`docs/agents/09-integrations.md`](../../docs/agents/09-integrations.md)
- Testes: [`docs/agents/15-testing-standards.md`](../../docs/agents/15-testing-standards.md)
- Cadastro atual: [`src/components/auth/RegisterForm.tsx`](../../src/components/auth/RegisterForm.tsx), [`src/lib/auth/actions.ts`](../../src/lib/auth/actions.ts)
- Checkout atual: [`src/features/plans/actions.ts`](../../src/features/plans/actions.ts)
- Webhook atual: [`src/app/api/stripe/webhook/route.ts`](../../src/app/api/stripe/webhook/route.ts)
- Supabase RLS: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Stripe subscription webhooks: <https://docs.stripe.com/billing/subscriptions/webhooks>
- Next.js middleware/cookies: <https://nextjs.org/docs/app/api-reference/file-conventions/middleware>
