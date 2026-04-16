# Task ID: 20

**Title:** Página de margem customizada em `perfil/margem`

**Status:** pending

**Dependencies:** 17

**Priority:** medium

**Description:** Permitir modo `average` vs `custom` de taxas de revenda; recálculo client-side conforme fórmula da Tech Spec (net_margin = ((market_price * (1 - user_fee_pct/100)) - cost) / cost * 100).

**Details:**

Contexto:
- Equivalente a T-038 (tasks.md). Tech Spec §Design: channel_margins.

Escopo:
- `src/app/(app)/perfil/margem/page.tsx` + `ResaleChannelsForm.tsx`.
- Toggle `resale_margin_mode` (`average` / `custom`).
- Inputs `resale_fee_pct` por canal quando `custom`.
- UI indica "estimativa com taxas médias" vs "suas taxas".

Fora de escopo:
- Recálculo batch no backend (o design é client-side).

Implementação:
- Arquivos/módulos: `src/features/profile/ResaleChannelsForm.tsx`, helpers em `src/lib/scanner/margin-calculator.ts` reaproveitados.
- Regras e validações: `resale_fee_pct` entre 0 e 50; persistir em `profiles.resale_fee_pct` (JSONB).

Critérios de pronto:
- Trocar modo afeta cálculo exibido nos cards em tempo real.
- Persistência correta em `profiles`.

**Test Strategy:**

Cenários de teste:
- [ ] Modo custom com fee 12% recalcula margem no card.
- [ ] Voltar para average usa `marketplace_fees`.

Validações técnicas:
- [ ] Zod valida `resale_fee_pct` numérico 0–50.
- [ ] Fórmula idêntica à da Tech Spec.

## Subtasks

### 20.1. Criar UI para seleção de modo de margem e taxas customizadas

**Status:** pending  
**Dependencies:** None  

Desenvolver os componentes de UI na página `perfil/margem`, incluindo um toggle para alternar entre os modos `average` e `custom`, e campos de input para que o usuário possa inserir taxas de revenda personalizadas por canal quando o modo `custom` estiver ativo.

**Details:**

Implementar o formulário em `src/features/profile/ResaleChannelsForm.tsx`. Usar um componente de toggle para a propriedade `resale_margin_mode`. Exibir condicionalmente os inputs numéricos para as taxas (`resale_fee_pct`) de cada canal apenas quando o modo `custom` for selecionado.

### 20.2. Implementar lógica de recálculo de margem e persistência via Server Action

**Status:** pending  
**Dependencies:** 20.1  

Desenvolver a lógica client-side para recalcular a margem em tempo real nos cards de produtos com base no modo de taxa selecionado e nos valores inseridos. Implementar uma Server Action para persistir as configurações no perfil do usuário.

**Details:**

Utilizar um estado global ou contexto React para propagar a mudança. Reutilizar `src/lib/scanner/margin-calculator.ts` para o cálculo. Criar uma Server Action em `src/features/profile/actions.ts` que valida os dados com Zod (`resale_fee_pct` entre 0 e 50) e os salva no campo `profiles.resale_fee_pct`.
