# Task ID: 42

**Title:** Tracking opcional de `clicked_at` em live_alerts (sem UI)

**Status:** done

**Dependencies:** 40

**Priority:** low

**Description:** Instrumentar link enviado no Telegram para apontar a endpoint que seta `clicked_at` em `live_alerts` (D8: sem UI de métricas no MVP).

**Details:**

Contexto:
- Equivalente a T-073 (tasks.md). Dado persistido para análise futura de conversão.

Escopo:
- Endpoint `src/app/api/live-click/[id]/route.ts` que atualiza `clicked_at` e redireciona para `live_url`.
- Link do Telegram usa essa rota com `id` do `live_alerts`.

Fora de escopo:
- Dashboard de métricas (pós-MVP).

Implementação:
- Arquivos/módulos: `src/app/api/live-click/[id]/route.ts`.
- Regras e validações: idempotente (primeiro clique persiste); segurança: id opaco (UUID).

Critérios de pronto:
- Clique grava `clicked_at`.
- Redirect preserva query string da live.

**Test Strategy:**

Cenários de teste:
- [ ] Clicar no link atualiza `clicked_at` uma única vez.
- [ ] ID inválido → 404.

Validações técnicas:
- [ ] Nenhum dado pessoal na URL.
- [ ] Redirect em 302.

## Subtasks

### 42.1. Adicionar coluna `clicked_at` na tabela `live_alerts`

**Status:** done  
**Dependencies:** None  

Criar e aplicar uma nova migração de banco de dados para adicionar a coluna `clicked_at` (do tipo `timestamptz`, nula por padrão) à tabela `live_alerts`.

**Details:**

O script SQL da migração deve ser `ALTER TABLE public.live_alerts ADD COLUMN clicked_at TIMESTAMPTZ;`. Esta coluna armazenará o carimbo de data/hora do primeiro clique no link de alerta. A alteração é fundamental para o rastreamento.

### 42.2. Criar a estrutura da rota da API para rastreamento de cliques

**Status:** done  
**Dependencies:** None  

Criar o arquivo e a estrutura básica para o novo endpoint de rastreamento de cliques em `src/app/api/live-click/[id]/route.ts`.

**Details:**

Criar a pasta `src/app/api/live-click/[id]` e o arquivo `route.ts` dentro dela. O arquivo deve exportar uma função `GET(request, { params })` assíncrona que recebe o `id` do alerta como parâmetro. Inicialmente, pode retornar um JSON de placeholder.

### 42.3. Implementar lógica de atualização idempotente no banco de dados

**Status:** done  
**Dependencies:** 42.1, 42.2  

No endpoint da API de clique, implementar a lógica para buscar o `live_alert` pelo `id` e atualizar o campo `clicked_at` apenas se ele for nulo, tratando casos de ID inválido.

**Details:**

Utilize o cliente Supabase para buscar o registro em `live_alerts` pelo `id`. Se não for encontrado, retorne um `NextResponse` com status 404. Se encontrado e `clicked_at` for nulo, execute um `update` para preencher `clicked_at` com a data/hora atual. A operação deve ser ignorada se `clicked_at` já estiver preenchido.

### 42.4. Implementar redirecionamento 302 para a `live_url`

**Status:** done  
**Dependencies:** 42.3  

Após a lógica de banco de dados, implementar o redirecionamento (HTTP 302) do usuário para a `live_url` original contida no registro `live_alerts`.

**Details:**

Após a consulta e eventual atualização do registro, obtenha o valor da coluna `live_url`. Utilize a função `NextResponse.redirect(live_url, 302)` para enviar o usuário ao destino final. Isso deve funcionar tanto para cliques novos quanto para cliques repetidos.

### 42.5. Atualizar a construção do link no notificador do Telegram

**Status:** done  
**Dependencies:** 42.4  

Modificar o código de envio de alertas do Telegram para construir o link da notificação usando a nova rota `/api/live-click/[id]` em vez da URL direta.

**Details:**

Localizar o módulo responsável pelo envio de alertas (provavelmente `src/lib/scanner/alert-sender.ts`). Alterar a formatação da mensagem para que o link "Ver ao vivo" aponte para `[URL_BASE]/api/live-click/[live_alert_id]`, onde `live_alert_id` é o UUID do alerta recém-criado.
