# Task ID: 53

**Title:** Fluxo crítico com Playwright (cadastro → onboarding → dashboard)

**Status:** pending

**Dependencies:** 19, 46

**Priority:** medium

**Description:** Cobertura E2E mínima validando o funil principal com Playwright, usando dados seed.

**Details:**

Contexto:
- Equivalente a T-102 (tasks.md). Smoke test do happy path.

Escopo:
- Instalar Playwright; configurar `playwright.config.ts`.
- 1 teste cobrindo: cadastro → login → onboarding → dashboard (com 1 card visível).

Fora de escopo:
- Tests visuais/regressão (pós-MVP).

Implementação:
- Arquivos/módulos: `tests/e2e/onboarding.spec.ts`.
- Regras e validações: seed de oportunidades antes do teste; headless em CI.

Critérios de pronto:
- Pipeline CI roda o smoke test.
- Feedback rápido (≤ 2min).

**Test Strategy:**

Cenários de teste:
- [ ] Fluxo feliz passa em ≤ 2min.
- [ ] Falha em qualquer etapa gera screenshot.

Validações técnicas:
- [ ] Playwright instalado com browsers necessários.
- [ ] `baseURL` configurável por env.

## Subtasks

### 53.1. Configurar Ambiente de Testes E2E com Playwright

**Status:** pending  
**Dependencies:** None  

Instalar e configurar o Playwright no projeto. Isso inclui a criação do arquivo `playwright.config.ts`, a definição de scripts no `package.json` e a configuração do pipeline de CI para executar os testes.

**Details:**

O arquivo de configuração deve usar uma `baseURL` variável por ambiente. Adicionar scripts `test:e2e` e `test:e2e:ui` no `package.json`. O workflow de CI precisa instalar os browsers do Playwright e executar os testes em modo `headless`.

### 53.2. Desenvolver Teste E2E para o Fluxo Crítico do Usuário

**Status:** pending  
**Dependencies:** 53.1, 53.19, 53.46  

Escrever o cenário de teste E2E que simula o caminho feliz do usuário: cadastro, login, preenchimento do onboarding e visualização do dashboard com pelo menos uma oportunidade.

**Details:**

Criar o arquivo `tests/e2e/onboarding.spec.ts`. O teste deve usar seletores robustos (ex: `data-testid`). Implementar um hook `test.beforeEach` para garantir que o banco de dados esteja no estado esperado (seed) antes de cada teste. O teste deve validar a navegação por cada etapa e asserir a presença de um card no dashboard.
