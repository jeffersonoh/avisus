# Task ID: 34

**Title:** `alert-sender.ts` com templates Telegram e fila simples

**Status:** pending

**Dependencies:** 8, 15

**Priority:** high

**Description:** Implementar envio de alertas (ofertas e lives) via Telegram Bot API com templates HTML, fila em memória e até 3 tentativas com tracking de `attempts` e `failed`.

**Details:**

Contexto:
- Equivalente a T-060 (tasks.md). F04 (RF-10) + F14 (RF-54).

Escopo:
- `src/lib/scanner/alert-sender.ts`.
- Templates HTML (escape seguro): nome do produto, custo aquisição, melhor margem, canal, link; template live: vendedor, plataforma, título, link direto.
- 3 tentativas com backoff simples.

Fora de escopo:
- WhatsApp (pós-MVP).
- Métricas de engajamento (T-073).

Implementação:
- Arquivos/módulos: `src/lib/scanner/alert-sender.ts`, `src/lib/scanner/telegram.ts`.
- Regras e validações: respeitar silêncio e limites ao chamar; marcar `alerts.status = 'failed'` após 3 falhas; sempre preencher `sent_at`/`error_message`.

Critérios de pronto:
- Mensagem contém todos os campos obrigatórios (RF-10 / RF-54).
- 3 falhas seguidas marcam alerta como `failed`.

**Test Strategy:**

Cenários de teste:
- [ ] Mock Telegram 200 → alerta `sent`.
- [ ] Mock 429 três vezes → `failed`.
- [ ] Template live inclui link clicável.

Validações técnicas:
- [ ] Escape HTML previne injection.
- [ ] `TELEGRAM_BOT_TOKEN` nunca logado.

## Subtasks

### 34.1. Implementar Wrapper da API do Telegram em `telegram.ts`

**Status:** pending  
**Dependencies:** None  

Criar um módulo `telegram.ts` que encapsula as chamadas para a API do Telegram, especificamente para o método `sendMessage`. A função deve aceitar o `chat_id`, o texto da mensagem com suporte a HTML e tratar as respostas e erros da API.

**Details:**

A função deve ser assíncrona, utilizando `fetch` para enviar uma requisição POST para a API do Telegram. O token do bot será lido de uma variável de ambiente. A requisição deve incluir `chat_id`, `text` e `parse_mode='HTML'`. É essencial tratar erros de rede e respostas não-200.

### 34.2. Criar Templates HTML Seguros para Alertas de Oportunidade e Live

**Status:** pending  
**Dependencies:** None  

Desenvolver funções que geram o conteúdo HTML para os alertas de oportunidades de produto e de transmissões ao vivo. As funções devem receber os dados do alerta e retornar uma string HTML formatada, garantindo o escape de todos os dados dinâmicos para prevenir XSS.

**Details:**

Implementar `createOpportunityAlertTemplate(data)` e `createLiveAlertTemplate(data)`. Utilizar uma função de escape de HTML para todas as variáveis inseridas no template, como nome do produto e título da live, para garantir a segurança. Os templates devem conter todos os campos obrigatórios definidos nos requisitos.

### 34.3. Implementar Lógica de Fila e Retries no `alert-sender.ts`

**Status:** pending  
**Dependencies:** 34.1, 34.2  

Implementar a lógica de envio no `alert-sender.ts`, que gerencia uma fila simples em memória e tenta enviar cada alerta. O sistema deve realizar até 3 tentativas por alerta em caso de falha, com um backoff simples entre elas, e rastrear o número de tentativas.

**Details:**

Criar uma fila (array em memória) para processar os alertas. Para cada alerta, chamar o wrapper do Telegram. Em caso de falha (erro de rede ou status de erro da API), incrementar `attempts` e reenfileirar para uma nova tentativa após um delay. Após 3 falhas, o status do alerta deve ser atualizado para `failed` no banco de dados com a mensagem de erro.
