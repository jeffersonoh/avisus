# Task ID: 32

**Title:** Configurar Vercel Cron em `vercel.json`

**Status:** pending

**Dependencies:** 25

**Priority:** high

**Description:** Definir schedules para `/api/cron/scan` (*/5), `/api/cron/live` (*/2), `/api/cron/hot` (*/15) e `/api/cron/cleanup` (0 3 * * *).

**Details:**

Contexto:
- Equivalente a T-057 (tasks.md). Sem crons, pipelines não rodam em produção.

Escopo:
- Criar `vercel.json` com os 4 crons listados.
- Documentar TZ (Vercel usa UTC) e ajustar `0 3 * * *` conforme horário brasileiro.

Fora de escopo:
- Criação dos handlers (tarefas próprias).

Implementação:
- Arquivos/módulos: `vercel.json`.
- Regras e validações: paths iniciam com `/api/cron/`; secret validado nos handlers.

Critérios de pronto:
- Dashboard Vercel mostra 4 crons configurados.
- Cada cron chega a invocar handler em staging.

**Test Strategy:**

Cenários de teste:
- [ ] Deploy em staging agenda crons.
- [ ] Log do Vercel confirma execução em intervalos corretos.

Validações técnicas:
- [ ] JSON válido.
- [ ] TZ documentada.

## Subtasks

### 32.1. Criar arquivo `vercel.json` com a estrutura inicial para crons

**Status:** pending  
**Dependencies:** None  

Inicializar o arquivo de configuração `vercel.json` na raiz do projeto, adicionando a chave `crons` com um array vazio para preparar a inclusão dos jobs agendados.

**Details:**

Crie um novo arquivo chamado `vercel.json` na raiz do diretório do projeto. O conteúdo inicial deve ser um objeto JSON com uma propriedade `crons`, que será um array vazio: `{ "crons": [] }`.

### 32.2. Configurar cron job para /api/cron/scan a cada 5 minutos

**Status:** pending  
**Dependencies:** 32.1  

Adicionar a primeira entrada no array `crons` do arquivo `vercel.json` para agendar a execução do endpoint `/api/cron/scan` a cada 5 minutos.

**Details:**

Edite o `vercel.json` para incluir um objeto no array `crons`. Este objeto deve ter a propriedade `path` com o valor `/api/cron/scan` e a propriedade `schedule` com o valor `*/5 * * * *`.

### 32.3. Configurar cron jobs para /api/cron/live e /api/cron/hot

**Status:** pending  
**Dependencies:** 32.1  

Adicionar as configurações para os cron jobs dos endpoints `/api/cron/live` (a cada 2 minutos) e `/api/cron/hot` (a cada 15 minutos) no arquivo `vercel.json`.

**Details:**

Adicione duas novas entradas ao array `crons`. A primeira para o job `live` com `path: "/api/cron/live"` e `schedule: "*/2 * * * *"`. A segunda para o job `hot` com `path: "/api/cron/hot"` e `schedule: "*/15 * * * *"`.

### 32.4. Configurar cron job para /api/cron/cleanup com ajuste para fuso horário UTC

**Status:** pending  
**Dependencies:** 32.1  

Adicionar o cron job para o endpoint `/api/cron/cleanup`, agendado para 03:00 no horário de Brasília (BRT), ajustando o schedule para o fuso horário UTC utilizado pela Vercel.

**Details:**

Como a Vercel usa UTC e o BRT é UTC-3, o horário de 03:00 BRT corresponde a 06:00 UTC. Adicione a configuração ao `vercel.json` com `path: "/api/cron/cleanup"` e `schedule: "0 6 * * *"`.

### 32.5. Revisar e validar o arquivo vercel.json completo

**Status:** pending  
**Dependencies:** 32.2, 32.3, 32.4  

Realizar uma revisão final do arquivo `vercel.json`, garantindo que todas as quatro configurações de cron jobs estão corretas, o JSON é válido e a lógica do fuso horário está documentada para referência futura.

**Details:**

Verifique a sintaxe completa do arquivo `vercel.json` usando um validador de JSON. Confirme que os quatro paths e schedules estão corretos. Adicione um comentário em um arquivo README ou de documentação explicando que os horários são em UTC.
