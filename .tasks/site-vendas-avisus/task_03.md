---
status: done
title: Implementar landing pública de vendas
type: frontend
complexity: high
dependencies:
  - task_01
  - task_02
---

# Tarefa 3: Implementar landing pública de vendas

## Visão Geral
Esta tarefa cria a composição principal do site público de vendas em `SalesLandingPage`. A landing deve explicar o produto, apresentar funcionalidades, exibir prova social, responder objeções e oferecer CTAs claros para cadastro e login.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- `src/features/marketing/SalesLandingPage.tsx` DEVE compor header público, hero, funcionalidades, planos, prova social, FAQ e CTA final.
- O header DEVE conter entrada de login visível apontando para `/login`.
- O CTA principal **Assinar PRO** DEVE apontar para `/registro?plan=pro`.
- A seção de funcionalidades DEVE cobrir scanner, interesses, margem, dashboard, alertas, lives, histórico, tendências, score, sazonalidade e volume.
- A página DEVE funcionar em desktop e mobile sem depender de dados externos.
- O design DEVE seguir `docs/agents/14-design-system.md`; em conflito com ADR 008, o AGENTS/design system atual prevalece.
</requirements>

## Subtarefas
- [x] 3.1 Criar estrutura de página pública com header, hero e CTAs primário/secundário.
- [x] 3.2 Criar seção de funcionalidades completas conforme PRD.
- [x] 3.3 Integrar `PublicPlanComparison` como seção de planos.
- [x] 3.4 Criar blocos de prova social e confiança com claims atuais aprovados.
- [x] 3.5 Criar FAQ com objeções comerciais e ausência de lucro garantido.
- [x] 3.6 Criar CTA final reforçando assinatura PRO e cadastro gratuito.
- [x] 3.7 Garantir hierarquia semântica de títulos e links acessíveis.

## Detalhes de Implementação
Criar `src/features/marketing/SalesLandingPage.tsx` como componente de apresentação majoritariamente server-rendered. Referenciar Tech Spec seções "Visão Geral da Solução" e "Componentes Envolvidos" para composição.

### Arquivos Relevantes
- `src/features/marketing/content.ts` — fonte de copy e dados renderizados.
- `src/features/marketing/PublicPlanComparison.tsx` — seção pública de planos.
- `src/components/AppIcon.tsx` — ícones permitidos para cards e CTAs.
- `src/app/(auth)/registro/page.tsx` — referência visual de branding e claims atuais.
- `src/app/(auth)/login/page.tsx` — referência para entrada de usuários existentes.
- `docs/agents/14-design-system.md` — fonte atual de UI.

### Arquivos Dependentes
- `src/app/page.tsx` — renderizará `SalesLandingPage` na tarefa posterior.
- `src/features/marketing/MarketingAnalytics.tsx` — será integrado aos CTAs e seção de planos.
- `src/__tests__/features/marketing/SalesLandingPage.test.tsx` — validará comportamento observável.

### ADRs Relacionadas
- [ADR 001: Arquitetura serverless-first com Vercel + Supabase](../../docs/adrs/001_arquitetura_serverless_first.md) — reforça página pública sem servidores adicionais.
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](../../docs/adrs/003_migracao_nextjs_app_router.md) — orienta App Router e Server Components.
- [ADR 008: Tailwind CSS 4 no lugar de CSS inline do protótipo](../../docs/adrs/008_tailwind_css_no_lugar_de_css_inline.md) — registrar como contexto histórico; o design system atual do AGENTS prevalece em caso de conflito.

## Entregáveis
- `src/features/marketing/SalesLandingPage.tsx` criado.
- Landing renderizando todas as seções Must have do PRD.
- Login público para `/login` e CTA PRO para `/registro?plan=pro`.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para composição da landing **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [x] Renderizar a landing e confirmar a headline comercial principal.
  - [x] Confirmar que há link `Assinar PRO` com `href="/registro?plan=pro"`.
  - [x] Confirmar que há link de login com `href="/login"`.
  - [x] Confirmar que a seção de funcionalidades contém textos sobre scanner, margem, alertas e lives.
  - [x] Confirmar que o FAQ contém garantia, cancelamento e ausência de lucro garantido.
- Testes de integração:
  - [x] Renderizar a landing completa com `PublicPlanComparison` e confirmar que não há erro de renderização.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- A landing atende RF-01 a RF-23 e CA-01 a CA-09 do PRD no nível de UI.
- A landing não altera nem importa componentes da área autenticada para iniciar checkout.
