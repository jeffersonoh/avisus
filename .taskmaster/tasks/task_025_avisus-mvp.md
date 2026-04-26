# Task ID: 25

**Title:** Endpoint `/api/cron/scan` com autenticação CRON_SECRET

**Status:** done

**Dependencies:** 1, 2

**Priority:** high

**Description:** Criar Route Handler para scanner com validação de header `Authorization: Bearer CRON_SECRET` e `maxDuration = 300`.

**Details:**

Contexto:
- Equivalente a T-050 (tasks.md). Fundação para scanner (T-051+T-052+T-053).

Escopo:
- `src/app/api/cron/scan/route.ts` com `export const runtime = 'nodejs'` e `export const maxDuration = 300`.
- Validar header `Authorization: Bearer <CRON_SECRET>`; 401 se inválido.
- Response JSON `{ scanned, new_opportunities, alerts_sent }`.

Fora de escopo:
- Pipeline de scan em si (clientes ML/Magalu e matcher — tasks separadas).

Implementação:
- Arquivos/módulos: `src/app/api/cron/scan/route.ts`, `src/lib/cron/auth.ts`.
- Regras e validações: retornar 200 com `skipped: true` se cron desligado por flag.

Critérios de pronto:
- Requisição sem secret retorna 401.
- Documentação referencia `vercel.json` (T-057).

**Test Strategy:**

Cenários de teste:
- [ ] Chamar sem header → 401.
- [ ] Chamar com secret correto → 200 com response JSON.

Validações técnicas:
- [ ] `CRON_SECRET` só lido no servidor.
- [ ] `maxDuration` respeitado (build Vercel sem warning).

## Subtasks

### 25.1. Configurar Variável de Ambiente CRON_SECRET

**Status:** done  
**Dependencies:** None  

Adicionar a variável de ambiente CRON_SECRET para autenticação dos endpoints de cron. Incluir no arquivo .env.example e documentar seu propósito.

**Details:**

Defina a variável CRON_SECRET no arquivo .env local e adicione uma entrada correspondente no arquivo .env.example com um valor de exemplo. A documentação deve explicar que esta chave é usada para proteger endpoints de cron contra acesso não autorizado.

### 25.2. Criar Estrutura do Route Handler para /api/cron/scan

**Status:** done  
**Dependencies:** None  

Criar o arquivo `src/app/api/cron/scan/route.ts` com a configuração de tempo de execução e a estrutura básica da função GET.

**Details:**

Crie o arquivo e adicione as exportações `export const runtime = 'nodejs'` e `export const maxDuration = 300`. Implemente uma função `GET` que aceite um `NextRequest` e retorne uma resposta JSON temporária, como `NextResponse.json({ message: 'OK' })`.

### 25.3. Desenvolver Módulo de Autenticação para Cron

**Status:** done  
**Dependencies:** 25.1  

Criar um módulo reutilizável `src/lib/cron/auth.ts` para validar o header de autorização dos jobs de cron.

**Details:**

Crie o arquivo `src/lib/cron/auth.ts` e exporte uma função, por exemplo, `isCronAuthorized(request: Request)`. Esta função deve extrair o token do header `Authorization: Bearer <token>`, compará-lo com `process.env.CRON_SECRET` e retornar `true` ou `false`.

### 25.4. Integrar Validação de Autenticação no Endpoint de Scan

**Status:** done  
**Dependencies:** 25.2, 25.3  

Utilizar o módulo de autenticação de cron no endpoint `/api/cron/scan` para proteger o acesso.

**Details:**

Importe a função de verificação do módulo `src/lib/cron/auth.ts` no `route.ts`. Chame a função no início do handler `GET`. Se a autorização falhar, retorne imediatamente uma resposta com status `401 Unauthorized` e um corpo JSON `{ error: 'Unauthorized' }`.

### 25.5. Implementar Lógica de Resposta Final com Placeholder

**Status:** done  
**Dependencies:** 25.4  

Após a autenticação bem-sucedida, retornar a estrutura de resposta JSON final especificada para o endpoint.

**Details:**

Dentro do handler `GET`, após a verificação de autenticação, implemente a lógica final. Por enquanto, como o pipeline de scan está fora de escopo, retorne um objeto JSON fixo: `{ scanned: 0, new_opportunities: 0, alerts_sent: 0 }` com status 200. A validação da feature flag para retornar `{ skipped: true }` também deve ser considerada aqui, embora a implementação da flag possa ser em outra tarefa.
