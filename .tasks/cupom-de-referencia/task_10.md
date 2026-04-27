---
status: pending
title: Implementar exportação simples e mensagens could-have
type: frontend
complexity: medium
dependencies:
  - task_07
  - task_08
  - task_09
---

# Tarefa 10: Implementar exportação simples e mensagens could-have

## Visão Geral
Esta tarefa fecha o escopo completo aprovado incluindo itens could-have do PRD. Ela adiciona exportação simples para conciliação manual de comissão e mensagens de boas-vindas/uso de código sem expor dados comerciais do parceiro.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE criar exportação CSV simples de dados de comissão acessível apenas para admin.
- DEVE incluir no CSV apenas dados necessários para conciliação manual: cupom, parceiro, taxa, usuário/conversão minimizados, plano pago, valor base, moeda, comissão calculada e datas relevantes.
- DEVE proteger o Route Handler de exportação com `requireAdmin()`.
- DEVE adicionar CTA/link de exportação na UI `/admin/cupons` ou detalhe do cupom.
- DEVE adicionar mensagem de confirmação/boas-vindas quando um cupom for reconhecido ou usado, sem identificar dados pessoais/comerciais do parceiro.
- DEVE garantir que mensagens e exportação não sugiram desconto ou alteração de preço.
- DEVE manter todos os textos em Português do Brasil.
</requirements>

## Subtarefas
- [ ] 10.1 Criar serializador CSV simples para comissões de referral.
- [ ] 10.2 Criar Route Handler admin para exportação de comissões.
- [ ] 10.3 Adicionar ação/link de exportação na UI administrativa.
- [ ] 10.4 Adicionar mensagem de cupom reconhecido/usado no cadastro ou pós-cadastro.
- [ ] 10.5 Garantir que nenhum texto prometa desconto ou exponha parceiro ao usuário final.
- [ ] 10.6 Criar testes para CSV, autorização admin e mensagens could-have.

## Detalhes de Implementação
O PRD marca exportação simples e mensagem de boas-vindas como could-have, e o usuário aprovou escopo completo. A exportação deve ser pragmática, sem dashboard público de parceiros, sem pagamento automático e sem analytics de cliques/impressões.

### Arquivos Relevantes
- `src/features/referrals/actions.ts` — queries admin de cupons e comissões criadas na tarefa 7.
- `src/app/(admin)/admin/cupons/page.tsx` — local provável do link de exportação.
- `src/app/(admin)/admin/cupons/[id]/page.tsx` — local possível para exportar um cupom específico.
- `src/components/auth/RegisterForm.tsx` — local de mensagem de cupom reconhecido/usado.
- `src/app/(auth)/registro/page.tsx` — origem do formulário que exibe a mensagem de reconhecimento do cupom.
- `src/app/auth/callback/route.ts` — fluxo OAuth que pode precisar preservar indicador de cupom usado no redirect final.

### Arquivos Dependentes
- `src/app/(admin)/admin/api/export/commissions/route.ts` — Route Handler sugerido para CSV.
- `src/features/referrals/csv.ts` — helper sugerido para serialização CSV testável.
- `src/__tests__/features/referrals/ReferralCouponTable.test.tsx` — deve cobrir link de exportação.
- `tests/integration/referral-export.test.ts` — deve cobrir autorização e conteúdo CSV.

### ADRs Relacionadas
- [ADR 001: Arquitetura serverless-first com Vercel + Supabase](docs/adrs/001_arquitetura_serverless_first.md) — orienta exportação via Route Handler serverless.
- [ADR 002: Supabase como Auth + Banco + RLS](docs/adrs/002_supabase_como_auth_db_rls.md) — orienta proteção de dados sensíveis por admin/RLS.
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](docs/adrs/003_migracao_nextjs_app_router.md) — orienta Route Handlers e Server Components.
- [ADR 008: Tailwind CSS no lugar de CSS inline do protótipo](docs/adrs/008_tailwind_css_no_lugar_de_css_inline.md) — orienta UI do link/CTA de exportação.

## Entregáveis
- Exportação CSV simples de comissões protegida por admin.
- Link/CTA de exportação integrado à UI admin de cupons.
- Mensagens de cupom reconhecido/usado sem expor parceiro e sem promessa de desconto.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração para exportação CSV e autorização admin **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [ ] Serializador CSV escapa vírgulas, aspas e quebras de linha em campos textuais.
  - [ ] Serializador CSV calcula comissão como `paid_amount * commission_rate_pct / 100` com duas casas decimais.
  - [ ] Mensagem de cupom reconhecido não contém nome, e-mail ou taxa de comissão do parceiro.
  - [ ] Textos de mensagem não contêm promessa de desconto.
- Testes de integração:
  - [ ] Admin autenticado baixa CSV com `Content-Type: text/csv` e `Content-Disposition` de attachment.
  - [ ] Não-admin não consegue baixar exportação de comissões.
  - [ ] CSV inclui conversão paga e exclui linha sem `first_paid_date` quando o filtro for comissões pagas.
  - [ ] Link de exportação aparece em `/admin/cupons` para admin.
  - [ ] Usuário que chega com cupom válido vê mensagem de reconhecimento sem identificação do parceiro.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- Admin consegue exportar comissão para conciliação manual.
- Usuário recebe comunicação clara sobre cupom sem dados do parceiro.
- Escopo permanece sem dashboard público, pagamento automático, analytics de clique/impressão e desconto promocional.
