# Task ID: 35

**Title:** Silêncio e limites FREE no alert-sender

**Status:** pending

**Dependencies:** 34

**Priority:** high

**Description:** Tratar silêncio: ofertas ficam `silenced` e entregam após silêncio; lives em silêncio viram `skipped_silence` e não são enfileiradas (D9/CA-24).

**Details:**

Contexto:
- Equivalente a T-061 (tasks.md). CA-04 + CA-24.

Escopo:
- Verificar `profiles.silence_start/silence_end` antes de enviar.
- Ofertas fora do silêncio: `sent`; dentro: `silenced` + agendar entrega no fim.
- Lives sempre descartadas quando em silêncio (`skipped_silence`).
- Contar ofertas sent/read + lives sent em `alerts_sent_today` (CA-23).

Fora de escopo:
- UI de fila (opcional).

Implementação:
- Arquivos/módulos: `src/lib/scanner/alert-sender.ts` (helper `isSilenced`).
- Regras e validações: transições 22→07 lidam com meia-noite; TZ `America/Sao_Paulo`.

Critérios de pronto:
- CA-04 passa: oferta às 23h entrega às 7h.
- CA-24 passa: live às 23h não é enviada nem enfileirada.

**Test Strategy:**

Cenários de teste:
- [ ] Oferta detectada 23h → status `silenced` → job das 7h entrega.
- [ ] Live detectada 23h → status `skipped_silence` em `live_alerts`.

Validações técnicas:
- [ ] Silêncio cruzando meia-noite testado.
- [ ] `alerts_sent_today` inclui ambos tipos.

## Subtasks

### 35.1. Implementar verificação do período de silêncio com tratamento de fuso horário

**Status:** pending  
**Dependencies:** None  

Desenvolver a lógica para verificar se o horário atual está dentro do período de silêncio do perfil do usuário (`silence_start`/`silence_end`), tratando corretamente o fuso horário 'America/Sao_Paulo' e a virada da meia-noite.

**Details:**

Criar uma função helper `isSilenced(profile)` em `src/lib/scanner/alert-sender.ts`. Esta função deve comparar a hora atual no fuso horário de São Paulo com os horários de início e fim do silêncio definidos no perfil, retornando `true` se estiver dentro do período.

### 35.2. Implementar lógica de status 'silenced' e agendamento para ofertas

**Status:** pending  
**Dependencies:** 35.1  

Para ofertas detectadas durante o período de silêncio, o status do alerta deve ser definido como `silenced` e seu envio deve ser agendado para o final do período de silêncio. Ofertas fora do período devem ter status `sent`.

**Details:**

No módulo `alert-sender.ts`, ao processar um alerta de oferta e o `isSilenced` retornar `true`, atualizar o status do alerta para `silenced`. Um job (cron/fila) deverá ser responsável por reenviar esses alertas quando o período de silêncio terminar.

### 35.3. Implementar lógica de descarte com status 'skipped_silence' para lives

**Status:** pending  
**Dependencies:** 35.1  

Alertas de lives detectados durante o período de silêncio devem ser imediatamente descartados e marcados com o status `skipped_silence`, sem serem enfileirados para envio posterior.

**Details:**

No módulo `alert-sender.ts`, ao processar um alerta de live e o `isSilenced` retornar `true`, atualizar o status do registro `live_alerts` para `skipped_silence` e interromper o fluxo de envio para este alerta. A contagem de `alerts_sent_today` não deve ser incrementada.
