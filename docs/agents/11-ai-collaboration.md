# 11-ai-collaboration.md: Colaboração com IA

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [04-coding-standards.md](04-coding-standards.md) | [07-security.md](07-security.md)

## Visão Geral

Diretrizes para assistentes de IA trabalhando no repositório Avisus. O objetivo é garantir que código gerado respeite a arquitetura serverless-first, o modelo freemium e as convenções do projeto.

## Contexto do Projeto

- **Fase:** Migração de protótipo (React 19 + Vite) para produção (Next.js 15 + Supabase)
- **Desenvolvedor:** Solo dev, prazo de 4 semanas
- **Idioma do código:** Inglês (variáveis, funções, tipos)
- **Idioma da UI:** Português do Brasil
- **Design system:** `docs/design-system.md` (Montserrat, paleta Navy/Teal/Lime/Purple)

## Regras Obrigatórias

### TypeScript

- **strict mode** — sem `any`, sem `@ts-ignore`
- Tipos do banco gerados por `supabase gen types typescript`
- Usar tipos de domínio existentes em `src/lib/plan-limits.ts` e `src/types/`

### React / Next.js

- Server Components por padrão; `'use client'` apenas quando interatividade é necessária
- Server Actions para mutações com validação Zod
- Feature modules em `src/features/<nome>/` (componentes + hooks colocados)
- Componentes shared em `src/components/`

### Supabase

- Usar o client correto conforme o contexto:
  - Server Components → `createServerClient()` (cookies)
  - Client Components → `createBrowserClient()`
  - Scanner Functions → `createClient()` com `SERVICE_ROLE_KEY`
- **NUNCA** importar `SERVICE_ROLE_KEY` em código client-side
- **NUNCA** bypassar RLS sem justificativa (apenas Scanner Functions)

### Segurança

- Validar toda entrada com Zod antes de processar
- Verificar limites de plano **no backend** (Server Actions, não componentes)
- Sem hardcode de secrets — variáveis de ambiente
- Sem dados pessoais em logs ou respostas de erro
- Endpoints cron protegidos com `CRON_SECRET`

### Estilização

- Tailwind CSS utility classes — sem CSS modules, sem styled-components
- Mobile-first (`sm:`, `md:`, `lg:`)
- Dark mode via `dark:` prefix
- Componentes do design system: Badge, Toggle, Chip, StatCard, BottomSheet, Toast

## Padrões a Seguir

### Cálculo de Margem

```
custo_aquisição = price + freight
margem_líquida = ((market_price × (1 - fee_pct/100)) - custo_aquisição) / custo_aquisição × 100
```

Percentuais sempre em formato `15.00 = 15%`, nunca `0.15`.

### Limites de Plano

Sempre consultar `PLAN_LIMITS` de `src/lib/plan-limits.ts`. Verificar no backend:
- Interesses: `COUNT(*) WHERE active = TRUE` vs `maxInterests`
- Alertas: `alerts_sent_today(user_id)` vs `maxAlertsPerDay`
- Favoritos: `COUNT(*)` vs `maxFavoriteSellers`

### Alertas de Live (F14)

- Lives em horário de silêncio são **descartados** (não enfileirados) — CA-24
- Alertas de live contam no limite FREE (5/dia) junto com ofertas
- Transição `is_live: false → true` dispara alerta (não polling contínuo de true)

## Anti-patterns

- **NUNCA** usar `any` — usar `unknown` com type guards
- **NUNCA** verificar plano apenas no frontend
- **NUNCA** concatenar SQL — usar Supabase client
- **NUNCA** expor `SERVICE_ROLE_KEY` ou `CRON_SECRET` ao browser
- **NUNCA** adicionar dependências sem justificativa
- **NUNCA** criar processos long-running (arquitetura é serverless)
- **NUNCA** usar OFFSET pagination (usar keyset com `detected_at` + `id`)

## Configuração de IA Existente

O projeto utiliza regras em:
- `.cursor/rules/` — Regras de engenharia, segurança, taskmaster
- `.cursor/skills/` — Skills especializadas (interface design, PRD, tech spec, etc.)

Essas regras devem ser seguidas em conjunto com este documento. Em caso de conflito, as regras mais específicas prevalecem.

## Documentos de Contexto

| Documento | Caminho | Quando consultar |
|-----------|---------|-----------------|
| PRD | `.tasks/avisus-mvp/prd.md` | Requisitos de negócio, user stories |
| Tech Spec | `.tasks/avisus-mvp/tech-spec.md` | Decisões técnicas, schema DDL, contratos |
| Design System | `docs/design-system.md` | Tokens visuais, componentes, paleta |
| Protótipo | `src/prototype.jsx` | Referência de UI (será migrado) |

## Checklist para Código Gerado

- [ ] TypeScript strict sem `any`
- [ ] Validação Zod em toda entrada de usuário
- [ ] Limites de plano verificados no backend
- [ ] Client Supabase correto para o contexto
- [ ] Sem secrets no código ou logs
- [ ] Componentes React seguem convenção Server/Client
- [ ] Tailwind utility classes (sem CSS inline)
- [ ] Testes unitários para lógica de negócio nova

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [10-data-management.md](10-data-management.md) | Próximo: [12-troubleshooting.md](12-troubleshooting.md)*
