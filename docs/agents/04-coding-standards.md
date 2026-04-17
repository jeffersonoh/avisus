# 04-coding-standards.md: Padrões de Código

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [03-architecture.md](03-architecture.md) | [11-ai-collaboration.md](11-ai-collaboration.md)

## Visão Geral

Convenções de código para o Avisus, aplicáveis a todo código novo gerado durante a migração do protótipo para Next.js 15 + TypeScript strict.

## TypeScript

### Configuração

- **strict mode** habilitado no `tsconfig.json`
- Sem `any` — usar `unknown` com type guards quando necessário
- Tipos do banco gerados por `supabase gen types typescript` em `src/types/database.ts`
- Tipos de domínio derivados em arquivos dedicados (ver [06-domain-model.md](06-domain-model.md))

### Tipos de Domínio

```typescript
type Plan = 'free' | 'starter' | 'pro';
type Marketplace = 'Mercado Livre' | 'Magazine Luiza';
type LivePlatform = 'shopee' | 'tiktok';
type Quality = 'exceptional' | 'great' | 'good';
type AlertChannel = 'telegram' | 'web';
type AlertStatus = 'pending' | 'sent' | 'read' | 'silenced' | 'failed';
type AlertType = 'opportunity' | 'live'; // apenas UI, não existe como coluna
```

### Convenção de Percentuais

Todas as colunas `*_pct` e valores JSONB usam **formato percentual**: `15.00 = 15%`, nunca fração decimal (`0.15`). Aplica-se a: `discount_pct`, `fee_pct`, `resale_fee_pct`, `min_discount_pct`.

## React / Next.js

### Server vs. Client Components

- **Server Components** (padrão): data fetching, listas, layouts
- **Client Components** (`'use client'`): interatividade — filtros, formulários, modais, toggles
- Nunca importar Server Component dentro de Client Component

### Server Actions

```typescript
async function createInterest(term: string) {
  'use server';
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Validar com Zod antes de persistir
  // Verificar limites de plano no backend
}
```

### Organização de Features

Cada feature em `src/features/<nome>/` com:

- Componentes React (PascalCase)
- `hooks.ts` — custom hooks da feature
- Sem lógica de negócio nos componentes — delegar para hooks ou Server Actions

### Naming

| Tipo              | Convenção                             | Exemplo                                                       |
| ----------------- | ------------------------------------- | ------------------------------------------------------------- |
| Componentes       | PascalCase                            | `ProductCard.tsx`, `FilterPanel.tsx`                          |
| Hooks             | camelCase com prefixo `use`           | `useOpportunities`, `useFavoriteSellers`                      |
| Utilitários / lib | kebab-case                            | `margin-calculator.ts`, `alert-sender.ts`                     |
| Tipos             | PascalCase (interfaces/types)         | `PlanLimits`, `Opportunity`                                   |
| Constantes        | UPPER_SNAKE_CASE                      | `PLAN_LIMITS`, `PAGE_SIZE`                                    |
| Arquivos de rota  | `page.tsx`, `layout.tsx`, `route.ts`  | Next.js convention                                            |
| Diretórios de rota| kebab-case, **português** (idioma UI) | `interesses/`, `alertas/`, `favoritos/`, `perfil/`, `planos/` |
| CSS               | Inline styles + `var(--)` (ver acima) | Sem CSS modules, sem styled-components                        |

## Estilização: Inline Styles + CSS Variables

O Avisus usa **inline styles com CSS custom properties** como sistema de design principal. Consulte [14-design-system.md](14-design-system.md) para o catálogo completo de padrões.

### Divisão de responsabilidades

| O que usar        | Quando                                                                          |
| ----------------- | ------------------------------------------------------------------------------- |
| **Inline styles** | Cores, sombras, tipografia, bordas decorativas, qualquer token do design system |
| **Tailwind**      | Responsividade (`md:`, `lg:`), estrutura (`flex`, `min-h-screen`, `hidden`)     |
| **CSS modules**   | Nunca                                                                           |

### Regras

- Toda cor vem de `var(--*)` definido em `globals.css` — nunca hex hardcoded exceto nas constantes de plano (`PLAN_COLOR`)
- Use `color-mix(in srgb, var(--X) Y%, var(--Z))` para tons derivados
- Propriedades CSS com tipo literal exigem `as const`: `textTransform`, `boxSizing`, `whiteSpace`, `position`
- Responsive: mobile-first via Tailwind (`sm:`, `md:`, `lg:`)

## Validação (Zod)

Toda entrada de usuário validada com Zod antes de processamento:

```typescript
// Exemplos de schemas
const telegramUsername = z.string().regex(/^@?[a-zA-Z0-9_]{5,32}$/);
const interestTerm = z.string().trim().min(2).max(100);
const sellerUrl = z.string().url(); // + validação de domínio shopee.com.br / tiktok.com
const sellerUsername = z.string().regex(/^[a-zA-Z0-9._-]{2,50}$/);
```

## Supabase Client

| Contexto | Função | Uso |
|----------|--------|-----|
| Server Components | `createServerClient()` | Leitura com RLS (cookies) |
| Client Components | `createBrowserClient()` | Leitura/escrita com RLS |
| Scanner Functions | `createClient()` + `SERVICE_ROLE_KEY` | Escrita batch (bypassa RLS) |
| Middleware | `createServerClient()` | Renovação de sessão |

## Paginação

Todas as listagens usam **keyset pagination** (cursor-based), nunca offset.

```typescript
const PAGE_SIZE = 20;

const query = supabase
  .from('opportunities')
  .select('*', { count: 'exact' })
  .order('detected_at', { ascending: false })
  .order('id')
  .limit(PAGE_SIZE);

if (cursor?.detectedAt) {
  query.lt('detected_at', cursor.detectedAt);
}
```

## Vercel Cron Functions

Toda Route Handler de cron (`/api/cron/*`) deve:

1. Exportar `maxDuration` compatível com o timeout necessário
2. Validar `CRON_SECRET` no header antes de executar

```typescript
export const maxDuration = 300; // scan: 300s, live: 60s, hot: 30s, cleanup: 60s

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // pipeline...
}
```

## Limites de Plano

Enforcement de limites **sempre no backend** via `PLAN_LIMITS`:

```typescript
import { PLAN_LIMITS } from '@/lib/plan-limits';

const limit = PLAN_LIMITS[profile.plan].maxInterests;
if (count >= limit) throw new Error('LIMIT_REACHED');
```

O frontend pode ler `PLAN_LIMITS` para exibir limites e CTAs de upgrade, mas a verificação autoritativa ocorre em Server Actions e Scanner Functions.

## Formatação e Localização

- Moeda: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Datas: `Intl.DateTimeFormat('pt-BR')`
- Textos de UI centralizados em constantes (sem i18n no MVP)
- Idioma do código: inglês (variáveis, funções, tipos)
- Idioma da UI: português do Brasil

## Commits

- Formato: `tipo(escopo): descrição` em PT-BR
- Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Exemplo: `feat(scanner): implementar pipeline de margem por canal`

## Anti-patterns

- **NUNCA** usar `any` — usar `unknown` + type guard
- **NUNCA** hardcodar secrets — variáveis de ambiente
- **NUNCA** verificar limites de plano apenas no frontend — sempre no backend
- **NUNCA** usar `dangerouslySetInnerHTML` sem sanitização
- **NUNCA** concatenar SQL — usar Supabase client (prepared statements)
- **NUNCA** importar `SUPABASE_SERVICE_ROLE_KEY` em código que roda no browser

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [03-architecture.md](03-architecture.md) | Próximo: [05-development-workflow.md](05-development-workflow.md)*
