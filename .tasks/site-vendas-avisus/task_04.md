---
status: done
title: Configurar Vercel Analytics e tracking de conversão
type: infra
complexity: medium
dependencies:
  - task_01
---

# Tarefa 4: Configurar Vercel Analytics e tracking de conversão

## Visão Geral
Esta tarefa adiciona a instrumentação externa obrigatória para medir conversão da landing. O objetivo é registrar page views e eventos de clique/visualização sem bloquear navegação, renderização ou build local.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- A dependência `@vercel/analytics` DEVE ser adicionada a `package.json` e `package-lock.json`.
- `src/app/layout.tsx` DEVE renderizar `<Analytics />` de `@vercel/analytics/next` no root layout.
- `src/features/marketing/MarketingAnalytics.tsx` DEVE ser Client Component e usar eventos definidos em `content.ts`.
- O tracking DEVE ser best-effort e não deve impedir navegação se analytics estiver indisponível.
- A visualização da seção de planos DEVE disparar `plans_section_view` no máximo uma vez por carregamento.
</requirements>

## Subtarefas
- [x] 4.1 Adicionar `@vercel/analytics` às dependências do projeto.
- [x] 4.2 Configurar `<Analytics />` em `src/app/layout.tsx`.
- [x] 4.3 Criar `MarketingAnalytics.tsx` com tracking de CTAs e seção de planos.
- [x] 4.4 Garantir que eventos usem nomes e metadados definidos em `content.ts`.
- [x] 4.5 Garantir comportamento seguro quando analytics não estiver ativo em desenvolvimento.

## Detalhes de Implementação
Seguir Tech Spec seções "Integrações" e "Contratos e Interfaces". A dependência deve ser instalada via gerenciador do projeto para manter `package-lock.json` consistente.

### Arquivos Relevantes
- `package.json` — lista dependências e scripts de verificação.
- `package-lock.json` — lockfile a atualizar junto com a dependência.
- `src/app/layout.tsx` — root layout onde `<Analytics />` deve ser renderizado.
- `src/features/marketing/content.ts` — define eventos e metadados.
- `.tasks/site-vendas-avisus/tech-spec.md` — define contrato de analytics.

### Arquivos Dependentes
- `src/features/marketing/SalesLandingPage.tsx` — deve usar wrappers/atributos de tracking nos CTAs.
- `src/__tests__/features/marketing/SalesLandingPage.test.tsx` — deve mockar `@vercel/analytics` e validar eventos.

### ADRs Relacionadas
- [ADR 001: Arquitetura serverless-first com Vercel + Supabase](../../docs/adrs/001_arquitetura_serverless_first.md) — Vercel é plataforma de deploy e observabilidade da aplicação.
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](../../docs/adrs/003_migracao_nextjs_app_router.md) — orienta integração no App Router.

## Entregáveis
- Dependência `@vercel/analytics` adicionada.
- `<Analytics />` configurado no root layout.
- `src/features/marketing/MarketingAnalytics.tsx` criado.
- Eventos de CTA e `plans_section_view` disponíveis para a landing.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para eventos de CTA **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [x] Mockar `@vercel/analytics` e confirmar que clique em CTA PRO dispara `hero_assinar_pro_click`.
  - [x] Confirmar que clique em login dispara `header_login_click`.
  - [x] Simular `IntersectionObserver` e confirmar que `plans_section_view` dispara apenas uma vez.
  - [x] Confirmar que ausência de analytics ativo não remove links do DOM.
- Testes de integração:
  - [x] Renderizar a landing com `MarketingAnalytics` e confirmar que CTAs seguem navegáveis por `href`.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- `npm run typecheck` reconhece `@vercel/analytics` sem erro de tipos.
- Eventos definidos no PRD/Tech Spec ficam rastreáveis sem afetar UX.
