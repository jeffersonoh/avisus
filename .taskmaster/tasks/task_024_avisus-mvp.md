# Task ID: 24

**Title:** Enforcement de limites do plano em todas as mutações sensíveis

**Status:** pending

**Dependencies:** 21, 22, 23

**Priority:** high

**Description:** Garantir revalidação de plano em todas as Server Actions que criam/atualizam recursos limitados (interests, favoritos e futuros endpoints).

**Details:**

Contexto:
- Equivalente a T-043 (tasks.md). "Não confiar apenas no frontend".

Escopo:
- Criar helper `enforcePlanLimit({plan, count, key})` reutilizado por todas as Server Actions.
- Cobrir interests e favorite_sellers hoje; preparar para novos recursos.

Fora de escopo:
- Limites que já são SQL (unique constraints) — mantidos no banco.

Implementação:
- Arquivos/módulos: `src/lib/plan-enforce.ts`, usado em `features/interests/actions.ts` e `features/favorites/actions.ts`.
- Regras e validações: sempre ler plano atual do `profiles` (não confiar em sessão); retornar erro `LIMIT_REACHED` padronizado.

Critérios de pronto:
- Qualquer endpoint que cria recurso limitado chama `enforcePlanLimit`.
- Testes garantem fallback correto para downgrade (STARTER → FREE).

**Test Strategy:**

Cenários de teste:
- [ ] Downgrade para FREE com 10 interesses ativos impede novos cadastros.
- [ ] PRO não aciona enforce (Infinity).

Validações técnicas:
- [ ] Helper único; sem duplicação de lógica por feature.
- [ ] Logs de bloqueio não contêm dados pessoais.

## Subtasks

### 24.1. Criar helper reutilizável `enforcePlanLimit`

**Status:** pending  
**Dependencies:** None  

Desenvolver uma função helper centralizada em `src/lib/plan-enforce.ts` para impor os limites de recursos (interesses, favoritos) com base no plano do usuário, lançando um erro padronizado em caso de violação.

**Details:**

A função `enforcePlanLimit({plan, count, key})` deve ser criada. Ela consultará as regras de limite do plano e comparará com a contagem atual de recursos do usuário. Se o limite for ultrapassado, deve lançar um erro `LIMIT_REACHED`. A implementação deve ser genérica para suportar novos recursos no futuro.

### 24.2. Integrar `enforcePlanLimit` nas Server Actions de Interests e Favorites

**Status:** pending  
**Dependencies:** 24.1  

Refatorar as Server Actions responsáveis por criar interesses (`interests/actions.ts`) e vendedores favoritos (`favorites/actions.ts`) para que utilizem o novo helper `enforcePlanLimit`.

**Details:**

Importar e invocar a função `enforcePlanLimit` no início de cada Server Action que adiciona um recurso limitado. A chamada deve ser feita antes da inserção no banco de dados para garantir o bloqueio efetivo. A lógica de verificação de limite anteriormente duplicada deve ser removida.
