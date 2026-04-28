---
status: done
title: Criar UI admin de cupons e métricas
type: frontend
complexity: high
dependencies:
  - task_06
  - task_07
---

# Tarefa 8: Criar UI admin de cupons e métricas

## Visão Geral
Esta tarefa cria a interface administrativa em `/admin/cupons` para operar cupons sem depender do Supabase Studio. A UI deve exibir lista, filtros, formulário de criação/edição, ações de ativar/desativar e métricas simples de conversão/comissão.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE criar páginas `src/app/(admin)/admin/cupons/page.tsx`, `novo/page.tsx` e `[id]/page.tsx`.
- DEVE criar componentes admin em `src/features/referrals/admin/` para formulário e tabela.
- DEVE exibir status do cupom, dados do parceiro, comissão, expiração, cadastros, conversões pagas e valor comissionável.
- DEVE permitir filtros simples por status ativo/inativo.
- DEVE permitir criar, editar e ativar/desativar cupom com feedback de loading/erro.
- DEVE usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` para valores.
- DEVE seguir Tailwind/design system e funcionar em desktop e mobile.
</requirements>

## Subtarefas
- [x] 8.1 Criar página de listagem `/admin/cupons` com métricas e filtros simples.
- [x] 8.2 Criar `ReferralCouponTable` com badges de status e ação de ativar/desativar.
- [x] 8.3 Criar `ReferralCouponForm` para criação e edição com validação visual.
- [x] 8.4 Criar página `/admin/cupons/novo` conectada à action de criação.
- [x] 8.5 Criar página `/admin/cupons/[id]` para edição/detalhe.
- [x] 8.6 Criar estados vazios, loading pending e mensagens de erro em Português do Brasil.
- [x] 8.7 Criar testes de componente e rota para tabela, formulário e páginas admin.

## Detalhes de Implementação
Server Components devem buscar dados após `requireAdmin()`; Client Components devem receber apenas dados necessários e chamar Server Actions. Evite gráficos avançados, pois o PRD/Tech Spec pedem apenas totais agregados no MVP.

### Arquivos Relevantes
- `src/app/(admin)/admin/layout.tsx` — base admin e navegação criada na tarefa 6.
- `src/features/referrals/actions.ts` — actions e queries admin criadas na tarefa 7.
- `src/components/StatCard.tsx` — componente existente para métricas resumidas.
- `src/components/Badge.tsx` — componente compartilhado possível para status.
- `src/components/AppHeader.tsx` — referência de navegação/visual atual.

### Arquivos Dependentes
- `src/features/referrals/admin/ReferralCouponForm.tsx` — dependerá dos schemas e actions admin.
- `src/features/referrals/admin/ReferralCouponTable.tsx` — dependerá da shape da listagem.
- `src/__tests__/features/referrals/ReferralCouponForm.test.tsx` — deve validar formulário admin.
- `src/__tests__/features/referrals/ReferralCouponTable.test.tsx` — deve validar listagem e ações.

### ADRs Relacionadas
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](docs/adrs/003_migracao_nextjs_app_router.md) — orienta Server Components e Client Components pontuais.
- [ADR 008: Tailwind CSS no lugar de CSS inline do protótipo](docs/adrs/008_tailwind_css_no_lugar_de_css_inline.md) — orienta UI com Tailwind e responsividade.

## Entregáveis
- Rotas `/admin/cupons`, `/admin/cupons/novo` e `/admin/cupons/[id]` criadas.
- Componentes `ReferralCouponForm` e `ReferralCouponTable` criados.
- Métricas simples de cadastros, conversões pagas e valor comissionável exibidas.
- Filtros de status ativo/inativo e ações de ativar/desativar funcionais.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração/componentes para UI admin de cupons **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [x] `ReferralCouponForm` renderiza campos código, parceiro, e-mail, comissão, expiração, ativo e observações.
  - [x] `ReferralCouponForm` mostra erro para comissão acima de 100%.
  - [x] `ReferralCouponTable` renderiza badge "Ativo" para cupom ativo e "Inativo" para cupom desativado.
  - [x] `ReferralCouponTable` dispara action de toggle com o ID correto.
  - [x] Valores monetários são formatados em BRL pt-BR.
- Testes de integração/componentes:
  - [x] `/admin/cupons` renderiza lista vazia com CTA para criar cupom.
  - [x] `/admin/cupons` renderiza métricas agregadas quando há conversões.
  - [x] `/admin/cupons/novo` envia dados válidos para criação e mostra sucesso/redirect.
  - [x] `/admin/cupons/[id]` carrega dados existentes para edição.
  - [x] Layout permanece utilizável em viewport mobile.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- Admin consegue operar cupons sem usar Supabase Studio.
- Dados sensíveis aparecem apenas dentro de `/admin` validado.
- UI comunica claramente status, validade e comissão dos cupons.
