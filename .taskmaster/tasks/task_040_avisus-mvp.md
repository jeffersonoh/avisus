# Task ID: 40

**Title:** `live-monitor.ts` + endpoint `/api/cron/live`

**Status:** done

**Dependencies:** 34, 39

**Priority:** high

**Description:** Orquestrar polling de favorite_sellers, detectar transição `is_live` false→true, disparar alerta e atualizar estado; suportar até 50 sellers/invocação com rotação.

**Details:**

Contexto:
- Equivalente a T-071 (tasks.md). F14 (RF-54) + CA-21.

Escopo:
- `src/lib/scanner/live/live-monitor.ts`.
- `/api/cron/live/route.ts` com `maxDuration = 60`.
- Para cada seller: checar status; se transição, inserir em `live_alerts`, enviar Telegram (respeitando silêncio/limites), atualizar `is_live`, `last_live_at`, `last_checked_at`.
- Rotação se > 50 sellers por invocação (próxima rodada prioriza antigos).

Fora de escopo:
- Reset `is_live` stale (T-072).

Implementação:
- Arquivos/módulos: `src/lib/scanner/live/live-monitor.ts`, `src/app/api/cron/live/route.ts`.
- Regras e validações: meta operacional alert < 2min após início.

Critérios de pronto:
- CA-21 passa em staging com vendedor controlado.
- Execução conclui em < 60s com 50 sellers.

**Test Strategy:**

Cenários de teste:
- [x] 3 sellers, 1 novo live → 1 alert enviado.
- [x] Re-execução sem mudança → 0 alerts novos.
- [x] Silêncio aplicado (CA-24).

Validações técnicas:
- [x] `live_alerts.status` refletindo `sent|skipped_limit|skipped_silence|failed`.
- [x] `is_live` atualizado corretamente.

## Subtasks

### 40.1. Implementar Lógica de Busca e Rotação de Vendedores para Polling

**Status:** done  
**Dependencies:** None  

Desenvolver a lógica em `live-monitor.ts` para buscar um lote de até 50 `favorite_sellers` do banco de dados, priorizando aqueles que não foram checados há mais tempo (`last_checked_at`).

**Details:**

A consulta ao banco de dados deve selecionar vendedores ativos, ordená-los por `last_checked_at` ASC NULLS FIRST e limitar o resultado a 50 registros para garantir a rotação e distribuição da carga.

### 40.2. Orquestrar Chamadas Paralelas aos Clientes de Live (Shopee/TikTok)

**Status:** done  
**Dependencies:** 40.1  

Para o lote de vendedores obtido na tarefa anterior, orquestrar chamadas concorrentes aos clientes de scraping (`shopee-live-client`, `tiktok-live-client`) para verificar o status de live de cada um.

**Details:**

Utilizar `Promise.allSettled` para processar as chamadas em paralelo, permitindo que falhas individuais em chamadas de scraping não interrompam o processamento dos demais vendedores do lote.

### 40.3. Implementar Detecção de Transição de Estado de Live (False → True)

**Status:** done  
**Dependencies:** 40.2  

Comparar o status de live recém-obtido do scraping com o status `is_live` atual do vendedor (armazenado no banco de dados) para identificar transições de `false` para `true`.

**Details:**

A lógica deve filtrar apenas os vendedores cujo estado anterior (`is_live` no DB) era `false` e o novo estado (retornado pelo scraper) é `true`. O estado anterior deve ser parte dos dados carregados na primeira etapa.

### 40.4. Integrar com Envio de Alertas e Atualizar Estado dos Vendedores no DB

**Status:** done  
**Dependencies:** 40.3  

Para cada vendedor com transição de live detectada, disparar um alerta via `alert-sender` e atualizar seu registro no banco de dados (`is_live`, `last_live_at`). Todos os vendedores checados devem ter `last_checked_at` atualizado.

**Details:**

Chamar o módulo de envio de alertas (ex: Telegram). Após o envio (ou tentativa), atualizar `is_live=true` e `last_live_at=NOW()` para o vendedor. Por fim, atualizar `last_checked_at=NOW()` para todos os vendedores processados no lote.
