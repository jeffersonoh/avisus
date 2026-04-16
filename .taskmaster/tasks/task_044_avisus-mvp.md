# Task ID: 44

**Title:** Endpoint `/api/cron/cleanup` — expirar, reter e limpar

**Status:** pending

**Dependencies:** 32

**Priority:** high

**Description:** Expirar oportunidades vencidas (`expires_at < NOW()`), reter `price_history` por 90 dias, remover oportunidades expiradas antigas e (se combinado) resetar `is_live` stale.

**Details:**

Contexto:
- Equivalente a T-081 (tasks.md). Tech Spec §Retenção de dados.

Escopo:
- `/api/cron/cleanup/route.ts` diário às 3h (`0 3 * * *`).
- Operações: `UPDATE opportunities SET status='expired'` onde `expires_at < NOW()`; `DELETE FROM price_history WHERE recorded_at < NOW() - INTERVAL '90 days'`; `DELETE FROM opportunities WHERE status='expired' AND detected_at < NOW() - INTERVAL '30 days'`.
- Opcional: incluir reset `is_live` stale (T-072).

Fora de escopo:
- Arquivamento frio (fora do MVP).

Implementação:
- Arquivos/módulos: `src/app/api/cron/cleanup/route.ts`.
- Regras e validações: transação única; logs com contagens; tempo total < 60s.

Critérios de pronto:
- DB não cresce indefinidamente.
- Sem dados obsoletos no dashboard.

**Test Strategy:**

Cenários de teste:
- [ ] Criar `price_history` com 100 dias → removido.
- [ ] Oportunidade expirada 31 dias → deletada.

Validações técnicas:
- [ ] Idempotente.
- [ ] Logs com métricas por operação.

## Subtasks

### 44.1. Implementar query para expirar oportunidades vencidas

**Status:** pending  
**Dependencies:** None  

Desenvolver e integrar a consulta SQL `UPDATE` para marcar oportunidades como 'expired' quando a data de expiração (`expires_at`) for ultrapassada.

**Details:**

A consulta a ser implementada é `UPDATE opportunities SET status='expired' WHERE status = 'pending' AND expires_at < NOW()`. Esta operação deve ser parte da transação do job de cleanup e logar o número de linhas afetadas.

### 44.2. Implementar remoção de histórico de preços antigo (retenção de 90 dias)

**Status:** pending  
**Dependencies:** None  

Desenvolver e integrar a consulta SQL `DELETE` para remover registros da tabela `price_history` com mais de 90 dias, garantindo a retenção de dados recentes.

**Details:**

A consulta a ser implementada é `DELETE FROM price_history WHERE recorded_at < NOW() - INTERVAL '90 days'`. A operação deve logar o número de registros removidos e ser executada na mesma transação do cleanup.

### 44.3. Implementar remoção de oportunidades expiradas antigas (retenção de 30 dias)

**Status:** pending  
**Dependencies:** 44.1  

Desenvolver e integrar a consulta SQL `DELETE` para remover permanentemente as oportunidades que estão no status 'expired' há mais de 30 dias.

**Details:**

A consulta é `DELETE FROM opportunities WHERE status='expired' AND detected_at < NOW() - INTERVAL '30 days'`. Esta operação deve logar o número de oportunidades removidas e ocorrer na mesma transação.
