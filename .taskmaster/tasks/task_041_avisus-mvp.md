# Task ID: 41

**Title:** Reset de `is_live` stale após 1h sem confirmação

**Status:** done

**Dependencies:** 40

**Priority:** medium

**Description:** Se `favorite_sellers.last_checked_at > 1h` e `is_live = TRUE` não foi confirmado, resetar para `FALSE` para evitar estado fantasma.

**Details:**

Contexto:
- Equivalente a T-072 (tasks.md). Evita UI exibir "ao vivo" indefinidamente.

Escopo:
- Query periódica no live-monitor ou cleanup (a definir): `UPDATE favorite_sellers SET is_live = FALSE WHERE is_live = TRUE AND last_checked_at < NOW() - INTERVAL '1 hour'`.

Fora de escopo:
- Alertas de encerramento de live (fora do MVP).

Implementação:
- Arquivos/módulos: `src/lib/scanner/live/live-monitor.ts` ou `src/app/api/cron/cleanup/route.ts`.
- Regras e validações: registrar em log quantidade de registros resetados.

Critérios de pronto:
- Nenhum seller permanece `is_live = TRUE` além de 1h sem check.

**Test Strategy:**

Cenários de teste:
- [ ] Seller com `last_checked_at` = -2h e `is_live = TRUE` → vai para `FALSE`.
- [ ] Seller confirmado em -30min não muda.

Validações técnicas:
- [ ] Operação idempotente.
- [ ] Sem race com polling ativo.

## Subtasks

### 41.1. Criar o arquivo do manipulador de rota para o cron de limpeza

**Status:** done  
**Dependencies:** None  

Estruturar o arquivo inicial para o endpoint do cron job de limpeza, que será responsável por executar a tarefa periodicamente.

**Details:**

Criar o arquivo em `src/app/api/cron/cleanup/route.ts`. Este arquivo deve exportar uma função `GET` assíncrona que recebe um objeto `Request`, seguindo o padrão de Route Handlers do Next.js.

### 41.2. Implementar validação de segurança com CRON_SECRET

**Status:** done  
**Dependencies:** 41.1  

Proteger o endpoint do cron job para que ele só possa ser executado por invocações autorizadas do Vercel, utilizando uma variável de ambiente como segredo.

**Details:**

Dentro da função `GET` em `route.ts`, ler o parâmetro de busca `cron_secret` da URL. Comparar seu valor com `process.env.CRON_SECRET`. Se a validação falhar, retornar uma resposta `NextResponse.json` com status 401 (Unauthorized).

### 41.3. Desenvolver a lógica de atualização no banco de dados

**Status:** done  
**Dependencies:** None  

Criar a função que executa a query SQL para encontrar e resetar os registros de `favorite_sellers` que estão com o status `is_live` obsoleto.

**Details:**

Criar uma função auxiliar que utilize o cliente Supabase (`@supabase/ssr`). A função deve executar a query: `UPDATE favorite_sellers SET is_live = FALSE WHERE is_live = TRUE AND last_checked_at < NOW() - INTERVAL '1 hour'`. A função deve retornar a contagem de registros afetados pela operação.

### 41.4. Integrar lógica de banco de dados e logging no manipulador de rota

**Status:** done  
**Dependencies:** 41.2, 41.3  

Conectar a função de atualização do banco de dados ao manipulador de rota, registrar o resultado da operação e retornar uma resposta adequada.

**Details:**

No manipulador `GET`, após a validação do segredo, criar um cliente Supabase para o servidor. Chamar a função de atualização do banco de dados. Usar um logger para registrar a quantidade de registros resetados (ex: 'Cleanup cron: Resetados X vendedores com status is_live fantasma.'). Retornar `NextResponse.json({ ok: true, resetCount: count })`.

### 41.5. Configurar a duração máxima de execução do handler

**Status:** done  
**Dependencies:** 41.1  

Ajustar a configuração do handler da rota para permitir um tempo de execução maior, evitando timeouts em execuções que possam ser mais longas.

**Details:**

Adicionar a exportação `export const maxDuration = 60;` no topo do arquivo `src/app/api/cron/cleanup/route.ts`. Isso estende o tempo máximo de execução da função Vercel para 60 segundos, conforme especificado na tarefa relacionada T33.
