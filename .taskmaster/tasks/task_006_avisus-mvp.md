# Task ID: 6

**Title:** Implementar funções SQL `alerts_sent_today` e `refresh_hot_flags`

**Status:** pending

**Dependencies:** 4

**Priority:** high

**Description:** Criar as funções SQL com a semântica exata da Tech Spec: fuso `America/Sao_Paulo` para contagem diária e HOT = percentil 70 global (desvio D1).

**Details:**

Contexto:
- Equivalente a T-012 (tasks.md). `alerts_sent_today` controla limite FREE (5/dia incluindo ofertas + lives); `refresh_hot_flags` alimenta badge HOT (RF-30/32).

Escopo:
- `alerts_sent_today(p_user_id UUID) RETURNS INTEGER` somando `alerts` (status sent/read) + `live_alerts` (status sent) no dia corrente em TZ BR.
- `refresh_hot_flags()` computando `PERCENTILE_CONT(0.70)` sobre `margin_best` das oportunidades `status='active'` e atualizando coluna `hot`.
- Documentar desvio D1: HOT global (não por dashboard filtrado).

Fora de escopo:
- UI de HOT (T-092).
- Cron job que chama `refresh_hot_flags` (T-080).

Implementação:
- Arquivos/módulos: `supabase/migrations/0003_functions.sql`.
- Regras e validações: `SECURITY DEFINER` onde necessário; fuso horário explicitado com `AT TIME ZONE 'America/Sao_Paulo'`.

Critérios de pronto:
- `SELECT alerts_sent_today('<uuid>')` retorna contagem correta.
- `SELECT refresh_hot_flags()` atualiza `opportunities.hot` sem erro.
- Apenas `status = 'active'` é considerado para HOT.

**Test Strategy:**

Cenários de teste:
- [ ] Inserir 3 alerts + 2 live_alerts (status sent) hoje → `alerts_sent_today` retorna 5.
- [ ] Alerts de ontem não contam.
- [ ] Após `refresh_hot_flags`, ~30% das ativas têm `hot = TRUE`.

Validações técnicas:
- [ ] TZ `America/Sao_Paulo` aplicado corretamente (verificar com dados em borda de meia-noite).
- [ ] Policy allow `STABLE` apropriado em `alerts_sent_today`.

## Subtasks

### 6.1. Implementar e testar a função SQL `alerts_sent_today(p_user_id)`

**Status:** pending  
**Dependencies:** None  

Criar a função SQL que conta os alertas (normais e live) enviados para um usuário específico no dia corrente, considerando o fuso horário `America/Sao_Paulo`. A função deve somar registros das tabelas `alerts` e `live_alerts`.

**Details:**

A função `alerts_sent_today(p_user_id UUID) RETURNS INTEGER` deve ser criada no arquivo `supabase/migrations/0003_functions.sql`. Ela deve somar alertas com status 'sent' ou 'read' da tabela `alerts` e 'sent' da tabela `live_alerts`. A contagem deve usar `AT TIME ZONE 'America/Sao_Paulo'` na cláusula `WHERE` para filtrar pela data atual no Brasil.

### 6.2. Implementar e testar a função SQL `refresh_hot_flags()`

**Status:** pending  
**Dependencies:** None  

Criar a função SQL que calcula o percentil 70 global das margens de lucro (`margin_best`) das oportunidades ativas e atualiza a coluna booleana `hot` na tabela `opportunities` para todas as oportunidades que estão acima desse limiar.

**Details:**

A função `refresh_hot_flags() RETURNS void` será definida em `supabase/migrations/0003_functions.sql`. Usar `PERCENTILE_CONT(0.70) WITHIN GROUP (ORDER BY margin_best DESC)` sobre as oportunidades com `status = 'active'`. Em seguida, executar um `UPDATE` na tabela `opportunities` para setar `hot = TRUE` onde `margin_best` for maior ou igual ao percentil calculado, e `hot = FALSE` para as demais.
