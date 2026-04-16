# ADR 003: Migração do protótipo Vite/React para Next.js 15

## Status

Aceita

## Data

2026-04-16

## Contexto

O protótipo atual (`src/prototype.jsx`) tem cerca de 5.200 linhas em um único arquivo JSX, rodando sobre Vite 8 e React 19 apenas como SPA cliente. Ele cumpriu seu papel de validar fluxos, design system e interações, mas não atende aos requisitos do MVP em produção:

- Não há BFF — todas as chamadas precisariam expor secrets ao browser
- Scanner, webhook Stripe e cron exigem código server-side
- SEO e SSR são desejáveis para páginas públicas futuras
- TypeScript strict, com tipos gerados do Supabase, não se integra bem ao monolito JSX atual
- A manutenção de um arquivo de 5 K linhas é impeditiva

## Decisão

Migrar o protótipo para **Next.js 15 com App Router** + **TypeScript strict**, mantendo React 19 como biblioteca de UI.

- **App Router** para rotas, layouts, Server Components (padrão) e Client Components quando necessário
- **Route Handlers** (`/api/...`) para webhook Stripe e endpoints de cron
- **Server Actions** para mutações (CRUD interesses, perfil, favoritos) com validação Zod
- **Server Components** por padrão; `'use client'` apenas em partes interativas
- **TypeScript strict** obrigatório (sem `any`)
- **Feature modules** em `src/features/<nome>/` com componentes + hooks colocados; lógica de negócio em `src/lib/`
- Mapeamento protótipo → produção documentado em `docs/agents/03-architecture.md`

O protótipo permanece no repositório durante a migração como referência visual e comportamental.

## Alternativas Consideradas

- **Manter Vite/React SPA + BFF separado (Fastify/Hono)** → descartada por exigir dois repositórios, dois deploys e roteamento cruzado; conflita com a ADR 001 (serverless-first) e duplica ops
- **Remix** → descartada por menor integração com Vercel Cron e menor alinhamento com o ecossistema Supabase + Stripe em exemplos públicos
- **Astro** → descartada por foco em conteúdo estático, inadequado para um app com sessão autenticada e mutações constantes
- **Continuar no protótipo e gradualmente partir o arquivo** → descartada por não resolver a ausência de BFF e de SSR

## Consequências

**Positivas:**

- BFF e frontend em um único projeto, com deploy unificado na Vercel
- Server Components eliminam waterfall de dados e reduzem JavaScript no cliente
- Cron Functions nativas via `vercel.json`, com `maxDuration` configurável por rota
- TypeScript strict + tipos gerados do Supabase pegam bugs em tempo de compilação
- Estrutura modular (`src/features/`) substitui o monolito JSX

**Negativas:**

- Curva de aprendizado: Server Actions, React Server Components e cache do App Router são paradigmas novos
- Reescrita de todas as telas (login, onboarding, dashboard, interesses, alertas, favoritos, perfil, planos) com novo roteamento
- CSS inline do protótipo precisa ser portado para Tailwind (ADR 008)
- Mocks do protótipo são descartados — dados passam a vir de queries reais ao Supabase

**Neutras:**

- Rotas em kebab-case **em português** (`interesses/`, `alertas/`, `favoritos/`, `perfil/`, `planos/`) por convenção de UI em pt-BR

## Referências

- Protótipo atual: `src/prototype.jsx` (~5.200 linhas)
- Arquitetura e mapa protótipo → produção: `docs/agents/03-architecture.md`
- Padrões de código: `docs/agents/04-coding-standards.md`
- Tech Spec: `.tasks/avisus-mvp/tech-spec.md`

> Todo ADR deve ter no máximo uma página.
