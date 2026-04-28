---
status: pending
title: Substituir a home pública e metadata
type: frontend
complexity: medium
dependencies:
  - task_03
  - task_04
---

# Tarefa 5: Substituir a home pública e metadata

## Visão Geral
Esta tarefa conecta a landing comercial à rota pública `/`, substituindo o placeholder técnico atual. Também ajusta metadata global para melhorar apresentação pública e compartilhamento básico sem criar páginas editoriais.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- `src/app/page.tsx` DEVE renderizar `SalesLandingPage` na rota `/`.
- A rota `/` DEVE permanecer pública e sem exigência de sessão.
- `src/app/layout.tsx` DEVE manter `ThemeScript`, fonte Montserrat e renderização dos children.
- A metadata DEVE descrever o Avisus como inteligência de preços para revendedores brasileiros.
- A mudança NÃO DEVE alterar `/login`, `/registro`, `/planos`, dashboard ou demais rotas autenticadas.
</requirements>

## Subtarefas
- [ ] 5.1 Substituir conteúdo placeholder de `src/app/page.tsx` por `SalesLandingPage`.
- [ ] 5.2 Revisar metadata global em `src/app/layout.tsx`.
- [ ] 5.3 Manter `<Analytics />` configurado no layout sem interferir em `ThemeScript`.
- [ ] 5.4 Confirmar que `/login` e `/registro` continuam sendo destinos dos links da landing.
- [ ] 5.5 Garantir que `/` não importe Supabase, Stripe ou lógica autenticada.

## Detalhes de Implementação
Alterar apenas a camada pública conforme Tech Spec seções "Escopo Técnico" e "Plano de Rollout". Não modificar middlewares, layouts autenticados ou ações de checkout.

### Arquivos Relevantes
- `src/app/page.tsx` — home pública atual a substituir.
- `src/app/layout.tsx` — metadata, fonte, theme script e analytics.
- `src/features/marketing/SalesLandingPage.tsx` — componente principal da landing.
- `src/middleware.ts` — referência para confirmar que `/` continua coberta apenas por atualização de sessão, não proteção de rota.

### Arquivos Dependentes
- `src/__tests__/features/marketing/SalesLandingPage.test.tsx` — deve validar render da landing conectada.
- `package.json` — scripts `typecheck`, `test` e `build` validam a integração.

### ADRs Relacionadas
- [ADR 001: Arquitetura serverless-first com Vercel + Supabase](../../docs/adrs/001_arquitetura_serverless_first.md) — mantém deploy unificado em Vercel.
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](../../docs/adrs/003_migracao_nextjs_app_router.md) — orienta rota App Router e Server Component.

## Entregáveis
- `src/app/page.tsx` renderizando a landing comercial.
- `src/app/layout.tsx` com metadata atualizada e analytics preservado.
- Rota `/` pública e funcional.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para renderização da rota pública **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [ ] Renderizar `HomePage` e confirmar que a headline comercial da landing aparece.
  - [ ] Confirmar que `HomePage` não exige props, sessão ou dados externos.
  - [ ] Confirmar que metadata global contém título e descrição adequados ao site de vendas.
- Testes de integração:
  - [ ] Executar `npm run typecheck` e confirmar imports de `SalesLandingPage` e analytics sem erro.
  - [ ] Executar `npm run build` e confirmar que a rota `/` compila como página pública.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- Acessar `/` mostra a landing em vez da página técnica "Base Next.js pronta".
- Área logada e páginas de auth permanecem sem alteração funcional.
