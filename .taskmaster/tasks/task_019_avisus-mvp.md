# Task ID: 19

**Title:** Onboarding wizard de 3 passos

**Status:** pending

**Dependencies:** 14, 15, 17

**Priority:** high

**Description:** Fluxo: interesses → região → alertas/consentimento LGPD; marca `profiles.onboarded = true` no final.

**Details:**

Contexto:
- Equivalente a T-037 (tasks.md). PRD exige fluxo ≤ 3 passos até primeiro valor.

Escopo:
- `src/features/onboarding/OnboardingWizard.tsx`, `src/app/onboarding/page.tsx`.
- Step 1: sugerir categorias populares + permitir cadastro.
- Step 2: selecionar UF/cidade (IBGE).
- Step 3: escolher canais (web/telegram) + consentimento LGPD.

Fora de escopo:
- Envio do primeiro alerta (emerge do scanner).

Implementação:
- Arquivos/módulos: `src/features/onboarding/*.tsx`, Server Action `finishOnboarding`.
- Regras e validações: bloquear conclusão sem pelo menos 1 interesse; persistir estado parcial ao trocar de step.

Critérios de pronto:
- Novo usuário completa em ≤ 3 passos.
- `onboarded` vai para `true` e redireciona ao dashboard.

**Test Strategy:**

Cenários de teste:
- [ ] Usuário sem onboarding vai para wizard.
- [ ] Voltar um step preserva dados.
- [ ] Concluir sem interesse bloqueia.

Validações técnicas:
- [ ] `onboarded` atualizado apenas após sucesso completo.
- [ ] Redirect final respeita `?redirectTo=`.

## Subtasks

### 19.1. Implementar a estrutura do wizard de onboarding com controle de estado

**Status:** pending  
**Dependencies:** None  

Criar o componente principal `OnboardingWizard.tsx` que gerenciará o estado dos passos (passo atual, dados coletados), permitindo avançar e retroceder no fluxo de 3 passos.

**Details:**

Utilizar um gerenciador de estado (como `useState` ou `useReducer`) para manter os dados dos passos. Implementar a navegação entre os passos (`nextStep`, `prevStep`). O componente deve renderizar o passo ativo condicionalmente em `src/app/onboarding/page.tsx`.

### 19.2. Implementar o Passo 1 do onboarding: Cadastro de Interesses

**Status:** pending  
**Dependencies:** 19.1  

Desenvolver a UI para o primeiro passo do wizard, onde o usuário cadastra seus interesses. Reutilizar os componentes da feature de interesses (Task 14) e incluir sugestões de categorias populares.

**Details:**

Integrar os componentes `InterestList.tsx` e `InterestForm.tsx` de `src/features/interests/` dentro do `OnboardingWizard`. A conclusão do passo deve ser bloqueada se o usuário não cadastrar pelo menos um interesse.

### 19.3. Implementar o Passo 2 do onboarding: Seleção de Região

**Status:** pending  
**Dependencies:** 19.1  

Desenvolver a UI para o segundo passo do wizard, permitindo que o usuário selecione seu estado (UF) e cidade. Reutilizar o seletor de localidade já existente, se houver, ou criar um novo com base nos dados do IBGE.

**Details:**

Criar um componente para este passo que apresente um seletor de UF e um seletor de Cidade. A lista de cidades deve ser populada dinamicamente após a seleção da UF. A região selecionada deve ser armazenada no estado geral do wizard.

### 19.4. Implementar o Passo 3 (Alertas/LGPD) e a finalização do onboarding

**Status:** pending  
**Dependencies:** 19.1, 19.2, 19.3  

Desenvolver o último passo, que inclui a configuração de canais de alerta (web/Telegram) e o aceite do consentimento LGPD. Implementar a Server Action `finishOnboarding` para persistir todos os dados e marcar `profiles.onboarded = true`.

**Details:**

Criar a UI para seleção de canais e checkbox de consentimento. A Server Action `finishOnboarding` receberá os dados consolidados dos 3 passos, atualizará o perfil do usuário no banco de dados, e, em caso de sucesso, acionará o redirecionamento para o dashboard.
