# ADR 002: Supabase como Auth + Banco + RLS

## Status

Aceita

## Data

2026-04-16

## Contexto

O Avisus precisa de:

- Autenticação com e-mail/senha e Google OAuth
- Banco relacional (Postgres) para perfis, interesses, oportunidades, alertas, histórico de preços, assinaturas Stripe e vendedores favoritos
- Autorização por linha (cada usuário vê apenas seus próprios registros) com enforcement no próprio banco
- Tipagem TypeScript consistente entre schema e código da aplicação
- Setup rápido, compatível com solo dev e gratuito no MVP

Implementar auth customizado ou integrar pacotes separados (Neon + Auth.js + ORM + lib de RLS manual) aumentaria a superfície de integração sem benefício claro para o MVP.

## Decisão

Adotar **Supabase** como solução integrada para autenticação, Postgres e Row Level Security.

- **Auth:** Supabase Auth com Email/senha e Google OAuth, sessão via cookie HTTP-only gerenciada por `@supabase/ssr` e refresh em `middleware.ts`
- **Banco:** Postgres 15+ com migrações versionadas em `supabase/migrations/` aplicadas via `supabase db push`
- **Autorização:** RLS habilitado em **todas** as tabelas; policies baseadas em `auth.uid()`
- **Tipos:** `npx supabase gen types typescript --local > src/types/database.ts` gera tipos do schema automaticamente
- **Scanner:** funções de cron usam `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS em operações batch (nunca exposta ao browser)
- **Extensões:** `pg_trgm` para matching de interesses por similaridade textual

Sem ORM (Drizzle/Prisma): queries são feitas diretamente pelo cliente Supabase, com tipagem derivada do schema.

## Alternativas Consideradas

- **Neon + Auth.js + Drizzle/Prisma** → descartada por exigir três pacotes integrados manualmente, sem RLS nativa; ORM adiciona cold start e, no caso do Prisma, binário de ~2 MB no bundle
- **Clerk (auth) + Neon (DB)** → descartada pelo custo (US$ 25/mês no plano pago, contra Free tier do Supabase) e fragmentação de fornecedores
- **Auth customizado (JWT próprio + bcrypt) sobre Postgres puro** → descartada pelo tempo de desenvolvimento e risco de segurança em solo dev
- **Firebase/Firestore** → descartada por falta de SQL relacional e por dificultar o cálculo de margem e joins entre oportunidades, canais e alertas

## Consequências

**Positivas:**

- Auth + DB + RLS em um único fornecedor, com SDK único (`@supabase/supabase-js`)
- Tipos gerados mantêm frontend e backend alinhados com o schema
- RLS elimina toda uma categoria de bugs de autorização (vazamento cruzado entre usuários)
- Free tier (500 MB DB, 50 K MAU) cobre o MVP sem custo adicional
- Local dev (`supabase start`) com Docker reproduz o ambiente remoto

**Negativas:**

- Acoplamento forte ao Supabase; migrar para outro provider exigiria reescrever auth + RLS
- `SERVICE_ROLE_KEY` deve ser isolada com rigor (usada apenas em funções serverless, nunca no browser)
- Políticas RLS mal escritas podem bloquear leituras legítimas — exige testes cruzados

**Neutras:**

- Sem ORM: queries ganham simplicidade, mas migrações de schema exigem SQL direto

## Referências

- Tech Spec: `.tasks/avisus-mvp/tech-spec.md` (seção Stack e Decisões)
- Modelo de domínio: `docs/agents/06-domain-model.md`
- Segurança e políticas RLS: `docs/agents/07-security.md`
- Integração Supabase Auth: `docs/agents/09-integrations.md`

> Todo ADR deve ter no máximo uma página.
