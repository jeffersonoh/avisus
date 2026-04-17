# Task ID: 28

**Title:** `margin-calculator.ts` — custo de aquisição e margem por canal (F03)

**Status:** done

**Dependencies:** 25

**Priority:** high

**Description:** Calcular custo de aquisição (preço + frete), margem líquida por canal (usando `marketplace_fees`), `margin_best`, `margin_best_channel` e `quality` por thresholds.

**Details:**

Contexto:
- Equivalente a T-053 (tasks.md). F03 (RF-07/08/09).

Escopo:
- `src/lib/scanner/margin-calculator.ts`.
- Função `calculateMargin(input): { margin_best, margin_best_channel, channels[], quality }`.
- `quality` thresholds em `src/lib/scanner/constants.ts` (≥40 exceptional, ≥25 great, ≥15 good, <15 NULL).

Fora de escopo:
- Modo `custom` (recálculo client-side em T-020).

Implementação:
- Arquivos/módulos: `src/lib/scanner/margin-calculator.ts`, `src/lib/scanner/constants.ts`.
- Regras e validações: tratar `freight_free` (freight = 0); nunca dividir por zero (custo>0).

Critérios de pronto:
- Cálculo idêntico à Tech Spec.
- Unit tests cobrem cenários exceptional/great/good/NULL.

**Test Strategy:**

Cenários de teste:
- [x] Preço 100, frete 0, market 150 (taxa 15%) → margem ≈ 27,5% → great.
- [x] Margem negativa → `quality = NULL` e descarte no scanner.

Validações técnicas:
- [x] Vitest cobre margin-calculator (T-100).
- [x] Sem uso de `any`; números `NUMERIC` preservados.

## Subtasks

### 28.1. Implementar cálculo de margem líquida por canal

**Status:** done  
**Dependencies:** None  

Desenvolver a lógica principal na função `calculateMargin` para calcular o custo de aquisição (preço + frete) e a margem líquida para cada canal de revenda, utilizando as taxas de marketplace (`marketplace_fees`) fornecidas.

**Details:**

A função deve iterar sobre cada canal de revenda, aplicar a fórmula de margem líquida e retornar uma lista de resultados por canal. É crucial tratar o caso de `freight_free` (frete = 0) e garantir que não ocorra divisão por zero se o custo de aquisição for nulo.

### 28.2. Determinar melhor margem (`margin_best`) e pontuação de qualidade (`quality`)

**Status:** done  
**Dependencies:** 28.1  

A partir das margens calculadas para cada canal, implementar a lógica para identificar a maior margem (`margin_best`), o canal correspondente (`margin_best_channel`) e classificar a oportunidade com uma pontuação de `quality` baseada em thresholds predefinidos.

**Details:**

Comparar as margens líquidas de todos os canais para encontrar o valor máximo. Aplicar os thresholds de `quality` (≥40 exceptional, ≥25 great, ≥15 good, <15 NULL) definidos em `src/lib/scanner/constants.ts` sobre a `margin_best` para determinar a classificação final.
