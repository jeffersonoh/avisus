---
status: pending
title: Validar experiência integrada e acessibilidade da landing
type: frontend
complexity: medium
dependencies:
  - task_02
  - task_03
  - task_04
  - task_05
---

# Tarefa 6: Validar experiência integrada e acessibilidade da landing

## Visão Geral
Esta tarefa fecha a entrega com validação integrada da experiência pública, ajustes finais de acessibilidade e endurecimento dos testes de comportamento. Ela não cria uma suíte isolada de testes: consolida a landing implementada, corrige lacunas encontradas e garante que os critérios de aceite do PRD estejam verificáveis.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- `src/__tests__/features/marketing/SalesLandingPage.test.tsx` DEVE cobrir render, CTAs, login, planos, FAQ, claims e analytics.
- A landing DEVE ter hierarquia semântica de títulos, links com nomes acessíveis e textos alternativos para logo/imagens.
- Os testes DEVEM usar consultas semânticas (`getByRole`, `getByText`) conforme padrões do projeto.
- Os mocks DEVEM cobrir `next/link`, `@/components/AppIcon` e `@vercel/analytics` quando necessário.
- Qualquer ajuste de UI necessário para passar critérios de acessibilidade DEVE ser aplicado nos componentes da feature, não em hacks de teste.
</requirements>

## Subtarefas
- [ ] 6.1 Criar ou completar `SalesLandingPage.test.tsx` com cenários do PRD e Tech Spec.
- [ ] 6.2 Validar links de CTA: PRO, STARTER, FREE e login.
- [ ] 6.3 Validar presença das seções Must have: hero, funcionalidades, planos, prova social, FAQ e CTA final.
- [ ] 6.4 Validar eventos de analytics com mock de `track`.
- [ ] 6.5 Revisar acessibilidade observável: headings, roles, labels e alt text.
- [ ] 6.6 Aplicar ajustes mínimos nos componentes da feature quando os testes revelarem lacunas.
- [ ] 6.7 Rodar verificações finais definidas na Tech Spec.

## Detalhes de Implementação
Criar ou atualizar `src/__tests__/features/marketing/SalesLandingPage.test.tsx` seguindo `docs/agents/15-testing-standards.md`. Se os testes revelarem lacunas, ajustar `SalesLandingPage`, `PublicPlanComparison`, `MarketingAnalytics` ou `content.ts` de forma mínima.

### Arquivos Relevantes
- `src/__tests__/features/marketing/SalesLandingPage.test.tsx` — suíte principal da landing.
- `src/features/marketing/SalesLandingPage.tsx` — alvo de validação integrada.
- `src/features/marketing/PublicPlanComparison.tsx` — validação dos planos públicos.
- `src/features/marketing/MarketingAnalytics.tsx` — validação de eventos.
- `src/features/marketing/content.ts` — validação dos textos críticos.
- `docs/agents/15-testing-standards.md` — padrão de testes de interface.

### Arquivos Dependentes
- `vitest.config.ts` — configuração de ambiente `jsdom` e alias `@`.
- `src/test/setup.ts` — setup de matchers DOM.
- `package.json` — scripts `test`, `typecheck` e `build` usados na verificação final.

### ADRs Relacionadas
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](../../docs/adrs/003_migracao_nextjs_app_router.md) — validação em App Router e TypeScript strict.

## Entregáveis
- `src/__tests__/features/marketing/SalesLandingPage.test.tsx` cobrindo critérios críticos.
- Ajustes mínimos de acessibilidade na feature, se necessários.
- Evidência de execução dos comandos de verificação da Tech Spec.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para a landing pública completa **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [ ] Confirmar que a headline comercial comunica monitoramento de ofertas e margem estimada.
  - [ ] Confirmar que o link **Assinar PRO** aponta para `/registro?plan=pro`.
  - [ ] Confirmar que o link de login aponta para `/login`.
  - [ ] Confirmar que FREE, STARTER e PRO aparecem com preços e limites principais.
  - [ ] Confirmar que o FAQ menciona garantia de 7 dias, cancelamento e ausência de lucro garantido.
  - [ ] Confirmar que cliques em CTAs chamam `track` com evento esperado.
- Testes de integração:
  - [ ] Executar `npm test -- SalesLandingPage` e confirmar zero falhas.
  - [ ] Executar `npm run typecheck` e confirmar zero erros TypeScript.
  - [ ] Executar `npm run build` e confirmar build da rota `/`.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- CA-01 a CA-09 do PRD estão cobertos por testes ou verificação manual documentada.
- A landing permanece pública, acessível e sem regressão nas rotas `/login` e `/registro`.
