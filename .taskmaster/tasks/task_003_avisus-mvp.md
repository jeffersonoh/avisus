# Task ID: 3

**Title:** Implementar `plan-limits.ts` e convenção de percentuais

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** Criar módulo único com `PLAN_LIMITS` (FREE/STARTER/PRO) e documentar que `*_pct` é sempre percentual (15 = 15%), nunca fração decimal.

**Details:**

Contexto:
- Equivalente a T-002 (tasks.md). Fonte única de verdade para limites por plano, reutilizada pelo scanner, Server Actions e UI.

Escopo:
- Exportar `PLAN_LIMITS` conforme Tech Spec (FREE 5/5/120min/7d/3; STARTER 20/∞/30min/30d/15; PRO ∞/∞/5min/90d/∞).
- Documentar convenção `*_pct` (percentual, nunca fração) em JSDoc do módulo.
- Exportar helpers `getPlanLimit(plan, key)`, `isUnlimited(value)`.

Fora de escopo:
- Enforcement em endpoints (feito nas Server Actions).

Implementação:
- Arquivos/módulos: `src/lib/plan-limits.ts`, `src/lib/constants.ts` (thresholds de quality se necessário).
- Regras e validações: tipos `Plan = 'free' | 'starter' | 'pro'`; `Infinity` usado para ilimitados; nenhum número mágico espalhado pelo código.

Critérios de pronto:
- Constantes batem exatamente com a Tech Spec.
- Import único utilizável por Server Actions e scanner.
- JSDoc explicando a convenção percentual.

**Test Strategy:**

Cenários de teste:
- [ ] Importar `PLAN_LIMITS.free.maxInterests` retorna 5.
- [ ] `PLAN_LIMITS.starter.scanIntervalMin` = 30.
- [ ] `PLAN_LIMITS.pro.maxInterests` é `Infinity`.

Validações técnicas:
- [ ] Sem duplicação de valores em outros módulos.
- [ ] Tipagem estrita (`Record<Plan, PlanLimits>`) sem `any`.

## Subtasks

### 3.1. Definir Tipos para Planos e Limites em `plan-limits.ts`

**Status:** pending  
**Dependencies:** None  

Criar as definições de tipo TypeScript para `Plan` e `PlanLimit` no novo arquivo `src/lib/plan-limits.ts`. Isso garantirá a consistência e o type safety do objeto de limites.

**Details:**

Criar o arquivo `src/lib/plan-limits.ts`. Nele, definir o tipo `Plan` como uma união de strings ('free' | 'starter' | 'pro') e a interface `PlanLimit` com todas as chaves de limite (ex: `maxInterests`, `maxKeywords`, `scanIntervalMin`, `dataRetentionDays`, `alertFrequencyMin`) e seus tipos (`number`).

### 3.2. Implementar a Constante `PLAN_LIMITS` com os Valores de Cada Plano

**Status:** pending  
**Dependencies:** 3.1  

Preencher e exportar a constante `PLAN_LIMITS` com os valores específicos para os planos FREE, STARTER e PRO, conforme a especificação técnica.

**Details:**

No arquivo `src/lib/plan-limits.ts`, criar um objeto `PLAN_LIMITS` do tipo `Record<Plan, PlanLimit>`. Preencher os valores para FREE (5, 5, 120, 7, 3), STARTER (20, Infinity, 30, 30, 15) e PRO (Infinity, Infinity, 5, 90, Infinity) para as respectivas chaves. Usar `Number.POSITIVE_INFINITY` para valores ilimitados.

### 3.3. Adicionar Documentação JSDoc para a Convenção de Percentuais

**Status:** pending  
**Dependencies:** 3.1  

Documentar no topo do módulo `plan-limits.ts` a convenção de que todos os valores com sufixo `_pct` são representados como números inteiros (e.g., 15 para 15%) e não como frações decimais.

**Details:**

Adicionar um bloco de comentário JSDoc no início do arquivo `src/lib/plan-limits.ts`. O comentário deve explicar claramente: 'Convenção: Todos os valores terminados em `_pct` representam um percentual como um número inteiro (1 a 100), não uma fração decimal (0.0 a 1.0).'

### 3.4. Criar a Função Auxiliar `getPlanLimit`

**Status:** pending  
**Dependencies:** 3.2  

Implementar e exportar a função `getPlanLimit(plan, limitKey)` que retorna o valor de um limite específico para um determinado plano.

**Details:**

No arquivo `src/lib/plan-limits.ts`, criar a função `getPlanLimit(plan: Plan, limitKey: keyof PlanLimit): number`. A função deve acessar e retornar `PLAN_LIMITS[plan][limitKey]`. Garantir que a função seja exportada e tenha tipagem forte.

### 3.5. Criar a Função Auxiliar `isUnlimited`

**Status:** pending  
**Dependencies:** 3.2  

Implementar e exportar a função `isUnlimited(value)` para verificar de forma abstrata se um valor de limite é infinito.

**Details:**

No arquivo `src/lib/plan-limits.ts`, criar a função `isUnlimited(value: number): boolean`. A função deve retornar `true` se `value === Number.POSITIVE_INFINITY` e `false` caso contrário. Isso centraliza a lógica de verificação de limites ilimitados.
