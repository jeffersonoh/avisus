# Task ID: 51

**Title:** Testes unitários Vitest para módulos críticos

**Status:** done

**Dependencies:** 3, 28, 29, 40

**Priority:** medium

**Description:** Cobrir `margin-calculator`, `opportunity-matcher`, `plan-limits` e `live-monitor` com Vitest, conforme Tech Spec §Plano de Testes.

**Details:**

Contexto:
- Equivalente a T-100 (tasks.md). Garantia contra regressões nas regras de negócio.

Escopo:
- Vitest configurado em `vitest.config.ts`.
- Suites por módulo com fixtures representativas.
- Script `npm test` rodando verde localmente.

Fora de escopo:
- Testes de integração (T-101) e E2E (T-102).

Implementação:
- Arquivos/módulos: `tests/unit/**/*.test.ts`, `vitest.config.ts`.
- Regras e validações: cobrir casos limites (discount 14.99 vs 15.00; silence cruzando meia-noite; PLAN_LIMITS Infinity).

Critérios de pronto:
- `npm test` verde.
- Cobertura razoável (≥ 70% nos módulos citados).

**Test Strategy:**

Cenários de teste:
- [ ] Margem exceptional/great/good/NULL.
- [ ] Matcher não duplica alertas.
- [ ] Limite plano calculado corretamente.
- [ ] Live monitor rotaciona sellers > 50.

Validações técnicas:
- [ ] Sem mocks globais sem escopo.
- [ ] Relatório de cobertura disponível.

## Subtasks

### 51.1. Escrever testes unitários para o módulo plan-limits.ts

**Status:** done  
**Dependencies:** 51.3  

Criar uma suíte de testes com Vitest para o módulo `plan-limits.ts`, garantindo que os limites de cada plano e as funções auxiliares (`getPlanLimit`, `isUnlimited`) funcionem como esperado.

**Details:**

Criar arquivo `tests/unit/plan-limits.test.ts`. Testar o retorno dos valores corretos para cada plano (FREE, STARTER, PRO), incluindo valores numéricos e `Infinity`. Validar o comportamento das funções `getPlanLimit` e `isUnlimited`.

### 51.2. Escrever testes unitários para o módulo margin-calculator.ts

**Status:** done  
**Dependencies:** 51.28  

Desenvolver testes unitários para `margin-calculator.ts` cobrindo os cálculos de margem, a determinação da `quality` (exceptional, great, good, NULL) e casos de borda, como margens negativas ou descontos em thresholds.

**Details:**

Criar arquivo `tests/unit/margin-calculator.test.ts`. Usar fixtures para simular diferentes cenários de preço, frete e taxas. Cobrir os thresholds de `quality` (ex: 14.99 vs 15.00). Testar o cálculo de `margin_best` e `margin_best_channel`.

### 51.3. Escrever testes unitários para o orquestrador opportunity-matcher.ts

**Status:** done  
**Dependencies:** 51.29  

Criar testes unitários para `opportunity-matcher.ts`, utilizando mocks para isolar dependências externas (ex: clientes de API, banco de dados) e focar na validação da lógica de orquestração, throttling por plano e dedup de oportunidades.

**Details:**

Criar `tests/unit/opportunity-matcher.test.ts`. Utilizar `vi.mock` do Vitest para simular as funções de busca de interesses, clientes de API e inserção no banco. Validar que o throttle (`scanIntervalMin`) é respeitado e que oportunidades duplicadas não geram novos alertas.

### 51.4. Escrever testes unitários para o monitoramento live-monitor.ts

**Status:** done  
**Dependencies:** None  

Implementar testes unitários para o `live-monitor.ts`, focando na lógica de detecção de transições de estado e na rotação de sellers, utilizando mocks para simular os dados de entrada e as dependências.

**Details:**

Criar arquivo `tests/unit/live-monitor.test.ts`. Simular (mock) a entrada de dados do monitoramento ao vivo. Testar a lógica que detecta a transição de um vendedor para online/offline e a rotação de sellers quando o número ultrapassa o limite (ex: > 50).
