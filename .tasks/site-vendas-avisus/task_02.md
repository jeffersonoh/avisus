---
status: done
title: Implementar cards públicos de planos
type: frontend
complexity: medium
dependencies:
  - task_01
---

# Tarefa 2: Implementar cards públicos de planos

## Visão Geral
Esta tarefa cria a comparação pública de planos da landing sem acoplar a página pública ao checkout autenticado. O componente deve apresentar FREE, STARTER e PRO com destaque visual para PRO, usando o conteúdo estático aprovado.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- O componente `src/features/marketing/PublicPlanComparison.tsx` DEVE renderizar os planos públicos a partir de `content.ts`.
- O componente NÃO DEVE importar `CheckoutButton`, `usePlanCheckout` ou `createCheckoutSession`.
- O plano PRO DEVE receber destaque visual e CTA principal para `/registro?plan=pro`.
- Cada card DEVE mostrar preço, período, subtítulo, principais benefícios e CTA.
- Os cards DEVEM respeitar o design system atual com tokens CSS e responsividade mobile-first.
</requirements>

## Subtarefas
- [x] 2.1 Criar `PublicPlanComparison` consumindo os planos de `content.ts`.
- [x] 2.2 Renderizar FREE, STARTER e PRO com hierarquia visual clara.
- [x] 2.3 Garantir CTAs corretos para cadastro gratuito, STARTER e PRO.
- [x] 2.4 Exibir mensagens de confiança: garantia de 7 dias, pagamento seguro e cancelamento.
- [x] 2.5 Garantir que o componente não dependa de sessão, Supabase ou Stripe.

## Detalhes de Implementação
Criar `src/features/marketing/PublicPlanComparison.tsx` conforme Tech Spec seção "Arquitetura e Design". Usar `next/link` para navegação interna e `AppIcon` apenas quando necessário para reforço visual.

### Arquivos Relevantes
- `src/features/marketing/content.ts` — fonte dos planos públicos e CTAs.
- `src/features/plans/PlanComparison.tsx` — referência visual e textual, mas não deve ser reutilizada diretamente.
- `src/features/plans/CheckoutButton.tsx` — referência do que não deve ser usado na landing pública.
- `docs/agents/14-design-system.md` — padrões de cards, badges, botões e cores de plano.

### Arquivos Dependentes
- `src/features/marketing/SalesLandingPage.tsx` — incorporará a seção de planos.
- `src/__tests__/features/marketing/SalesLandingPage.test.tsx` — validará links e conteúdo dos cards.

### ADRs Relacionadas
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](../../docs/adrs/003_migracao_nextjs_app_router.md) — orienta feature modules e Server Components.

## Entregáveis
- `src/features/marketing/PublicPlanComparison.tsx` criado.
- Cards públicos de planos desacoplados do checkout autenticado.
- CTAs de planos com rotas internas corretas.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para renderização dos três planos **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [x] Renderizar `PublicPlanComparison` e confirmar presença dos planos FREE, STARTER e PRO.
  - [x] Confirmar que STARTER mostra preço `R$49/mês`.
  - [x] Confirmar que PRO mostra preço `R$99/mês` e destaque visual acessível por texto/badge.
  - [x] Confirmar que o CTA do PRO possui `href="/registro?plan=pro"`.
- Testes de integração:
  - [x] Renderizar a seção dentro da landing e confirmar que todos os links continuam disponíveis por role `link`.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- Nenhum import de checkout autenticado aparece no componente público.
- Os cards atendem RF-13 a RF-16 e CA-04 a CA-05 do PRD.
