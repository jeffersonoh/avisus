---
status: done
title: Criar campo de cupom no cadastro
type: frontend
complexity: medium
dependencies:
  - task_02
  - task_04
---

# Tarefa 5: Criar campo de cupom no cadastro

## Visão Geral
Esta tarefa entrega a experiência visível de cupom para novos usuários no cadastro. O campo deve ser opcional, acessível, pré-preenchido quando houver referência por link e claro ao informar que não existe desconto no preço do plano.

<critical>
- SEMPRE LEIA o PRD e a Tech Spec antes de começar
- REFERENCIE A TECH SPEC para detalhes de implementação — não duplique aqui
- FOQUE NO "O QUÊ" — descreva o que precisa ser feito, não como
- MINIMIZE CÓDIGO — mostre código apenas para ilustrar estrutura atual ou áreas problemáticas
- TESTES OBRIGATÓRIOS — toda tarefa DEVE incluir testes nos entregáveis
</critical>

<requirements>
- DEVE criar `ReferralCodeField` reutilizável em `src/features/referrals/ReferralCodeField.tsx`.
- DEVE adicionar `name="referralCode"` ao formulário de cadastro sem tornar o campo obrigatório.
- DEVE pré-preencher o campo a partir de `initialReferralCode` lido no servidor.
- DEVE permitir edição manual do código e normalização visual coerente com uppercase.
- DEVE mostrar mensagem explicativa de que o código identifica parceria e não altera preço.
- DEVE mostrar feedback acessível para cupom reconhecido ou inválido sem expor dados do parceiro.
- DEVE funcionar em desktop e mobile seguindo o design system/Tailwind atual.
</requirements>

## Subtarefas
- [x] 5.1 Criar `ReferralCodeField` com label, descrição, erro e estado de confirmação.
- [x] 5.2 Atualizar `RegisterForm` para receber `initialReferralCode` e renderizar o campo opcional.
- [x] 5.3 Atualizar validação client-side para incluir `referralCode` sem bloquear cadastro sem cupom.
- [x] 5.4 Atualizar página `/registro` para ler cookie inicial e passar a prop ao formulário.
- [x] 5.5 Garantir mensagens em Português do Brasil e acessibilidade por `aria-invalid`, `role="alert"` e/ou `role="status"`.
- [x] 5.6 Criar testes de componente para campo isolado e formulário de cadastro.

## Detalhes de Implementação
O formulário atual usa `useActionState(signUpWithEmail)` e valida `RegisterSchema` no cliente. A tarefa deve preservar layout, estilos e fluxo Google existentes, adicionando o campo de forma progressiva e sem prometer desconto.

### Arquivos Relevantes
- `src/components/auth/RegisterForm.tsx` — formulário atual de cadastro por e-mail e Google.
- `src/app/(auth)/registro/page.tsx` — Server Component que renderiza `RegisterForm`.
- `src/lib/auth/schemas.ts` — schema usado também na validação client-side.
- `src/features/referrals/schemas.ts` — normalização e validação do código.
- `src/__tests__/features/auth/LoginForm.test.tsx` — referência de mocks simples para componentes auth.

### Arquivos Dependentes
- `src/lib/auth/actions.ts` — consumirá o campo `referralCode` enviado pelo formulário.
- `src/features/referrals/actions.ts` — pode fornecer validação pública via Server Action caso o feedback de reconhecido seja assíncrono.
- `src/__tests__/features/auth/RegisterForm.test.tsx` — deve cobrir renderização e comportamento do novo campo.
- `src/__tests__/features/referrals/ReferralCodeField.test.tsx` — deve cobrir componente isolado.

### ADRs Relacionadas
- [ADR 003: Migração do protótipo Vite/React para Next.js 15](docs/adrs/003_migracao_nextjs_app_router.md) — orienta Client Components apenas quando há interação.
- [ADR 008: Tailwind CSS no lugar de CSS inline do protótipo](docs/adrs/008_tailwind_css_no_lugar_de_css_inline.md) — orienta uso de Tailwind e design system.

## Entregáveis
- `src/features/referrals/ReferralCodeField.tsx` criado e testado.
- `src/components/auth/RegisterForm.tsx` atualizado com prop `initialReferralCode` e campo opcional.
- `src/app/(auth)/registro/page.tsx` lendo o cookie de referral no servidor.
- Mensagens acessíveis de cupom reconhecido/inválido e explicação sem desconto.
- Testes unitários com cobertura >= 80% **(OBRIGATÓRIO)**
- Testes de integração/componente para cadastro com cupom inicial e manual **(OBRIGATÓRIO)**

## Testes
- Testes unitários:
  - [x] `ReferralCodeField` renderiza label "Cupom de parceiro" e texto "não altera o preço do plano".
  - [x] `ReferralCodeField` exibe valor inicial `PARCEIRO_AVISUS` quando recebido por prop.
  - [x] `ReferralCodeField` permite editar/remover o código inicial.
  - [x] `ReferralCodeField` mostra erro acessível quando `error` é informado.
  - [x] `RegisterForm` envia `referralCode` junto com e-mail e senha quando preenchido.
- Testes de integração/componente:
  - [x] `/registro` com cookie `avisus_referral_code=PARCEIRO_AVISUS` renderiza formulário com campo preenchido.
  - [x] Cadastro sem cupom continua possível e não marca o campo como obrigatório.
  - [x] Erro de servidor para `referralCode` aparece no campo e permite correção.
- Meta de cobertura: >= 80%
- Todos os testes devem passar

## Critérios de Sucesso
- Todos os testes passando
- Cobertura de testes >= 80%
- Campo de cupom é opcional, acessível e responsivo.
- Usuário entende que o cupom é de parceria e não de desconto.
- Link de referência aparece de forma reconhecível no cadastro.
