---
status: done
title: Criar conteúdo comercial estático da landing
type: ux-copy
complexity: medium
dependencies: []
---

# Tarefa 1: Criar conteúdo comercial estático da landing

## Visão Geral
Esta tarefa cria a fonte única de conteúdo comercial da landing pública do Avisus. O objetivo é centralizar copy, planos, CTAs, FAQ, depoimentos e nomes de eventos para que os componentes renderizem a página sem espalhar texto comercial pelo JSX.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- O módulo `src/features/marketing/content.ts` DEVE centralizar textos da landing, planos públicos, FAQs, depoimentos, CTAs e nomes de eventos de analytics.
- O conteúdo DEVE usar os preços e claims atuais aprovados: STARTER R$49/mês, PRO R$99/mês, garantia de 7 dias, pagamento seguro e cancelamento quando quiser.
- Os claims comerciais DEVEM evitar promessa de lucro garantido e incluir linguagem de apoio à decisão.
- Os CTAs DEVEM apontar para `/registro`, `/registro?plan=starter`, `/registro?plan=pro` e `/login` conforme Tech Spec.
- Os tipos exportados DEVEM ser estritos e não usar `any`.
</requirements>

## Subtarefas
- [x] 1.1 Definir estruturas tipadas para planos, CTAs, funcionalidades, FAQ, depoimentos e eventos.
- [x] 1.2 Registrar copy do hero com dor, proposta de valor, CTA principal **Assinar PRO** e CTA secundário.
- [x] 1.3 Registrar conteúdo de funcionalidades cobrindo scanner, interesses, margem, dashboard, alertas, lives, histórico, tendências, score, sazonalidade e volume.
- [x] 1.4 Registrar cards dos planos FREE, STARTER e PRO com limites, preços, benefícios e CTAs.
- [x] 1.5 Registrar FAQs sobre alertas, marketplaces, planos, garantia, cancelamento, segurança e ausência de lucro garantido.
- [x] 1.6 Registrar depoimentos/prova social usando apenas claims atuais aprovados.

## Detalhes de Implementação
Criar `src/features/marketing/content.ts` seguindo a Tech Spec nas seções "Componentes Envolvidos" e "Contratos e Interfaces". O conteúdo deve ser consumível por Server Components e Client Components sem depender de browser APIs.

### Arquivos Relevantes
- `.tasks/site-vendas-avisus/prd.md` — define requisitos RF-01 a RF-19 e critérios CA-01 a CA-08.
- `.tasks/site-vendas-avisus/tech-spec.md` — define tipos, contratos de links e eventos de analytics.
- `src/features/plans/PlanComparison.tsx` — referência atual de preços, claims, depoimentos e trust items.
- `src/lib/plan-limits.ts` — fonte atual de limites técnicos por plano.

### Arquivos Dependentes
- `src/features/marketing/PublicPlanComparison.tsx` — consumirá cards e CTAs de planos.
- `src/features/marketing/SalesLandingPage.tsx` — consumirá copy da landing, funcionalidades, FAQ e prova social.
- `src/features/marketing/MarketingAnalytics.tsx` — consumirá nomes de eventos e metadados de CTA.
- `src/__tests__/features/marketing/SalesLandingPage.test.tsx` — validará conteúdo crítico renderizado.

### ADRs Relacionadas
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](../../docs/adrs/003_migracao_nextjs_app_router.md) — orienta App Router, TypeScript strict e feature modules.

## Entregáveis
- `src/features/marketing/content.ts` criado com tipos e constantes exportadas.
- Conteúdo comercial rastreável aos requisitos do PRD.
- Nenhum uso de `any` ou dado sensível em query string.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para renderização dos consumidores deste conteúdo **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [x] Validar que todos os planos públicos possuem `id`, `name`, `price`, `features` e `cta.href` preenchidos.
  - [x] Validar que o CTA do PRO aponta para `/registro?plan=pro`.
  - [x] Validar que a entrada de login aponta para `/login`.
  - [x] Validar que o FAQ contém uma resposta explícita sobre ausência de lucro garantido.
- Testes de integração:
  - [x] Renderizar um componente consumidor simples com `content.ts` e confirmar que os textos críticos aparecem no DOM.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- `content.ts` cobre RF-01 a RF-19 do PRD no nível de conteúdo.
- Os CTAs definidos no conteúdo respeitam integralmente os contratos da Tech Spec.
