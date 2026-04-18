# Task ID: 43

**Title:** Endpoint `/api/cron/hot` invocando `refresh_hot_flags()`

**Status:** done

**Dependencies:** 6, 32

**Priority:** high

**Description:** Criar handler cron que chama a RPC `refresh_hot_flags()` periodicamente.

**Details:**

Contexto:
- Equivalente a T-080 (tasks.md). F09 / RF-30/31.

Escopo:
- `src/app/api/cron/hot/route.ts` com auth CRON_SECRET e `maxDuration = 30`.
- Chama `supabase.rpc('refresh_hot_flags')`.

Fora de escopo:
- UI HOT (T-092).

Implementação:
- Arquivos/módulos: `src/app/api/cron/hot/route.ts`.
- Regras e validações: retornar quantidade de linhas marcadas como hot; logar erro e retornar 500 em falha.

Critérios de pronto:
- Execução periódica marcada no Vercel.
- Dashboard reflete badge HOT após cron.

**Test Strategy:**

Cenários de teste:
- [x] Rodar manualmente com secret correto → marca ~30% das ativas.
- [x] Sem secret → 401.

Validações técnicas:
- [x] `service_role` ou RPC permitido ao role usado no servidor.
- [x] Tempo de execução monitorado.

## Subtasks

### 43.1. Criar Estrutura de Arquivo e Rota para o Cron Job 'hot'

**Status:** done  
**Dependencies:** None  

Criar o arquivo de rota em `src/app/api/cron/hot/route.ts` e definir a função `GET` básica, juntamente com a configuração de tempo máximo de execução.

**Details:**

Crie o arquivo `route.ts` no diretório especificado. Exporte a constante `maxDuration = 30` para configurar o tempo limite da função no Vercel. Implemente o esqueleto da função `export async function GET(request: Request) { ... }`.

### 43.2. Implementar Autenticação via CRON_SECRET

**Status:** done  
**Dependencies:** 43.1  

Adicionar lógica de segurança para validar o `Authorization` header, garantindo que apenas requisições autenticadas com o `CRON_SECRET` possam executar o endpoint.

**Details:**

Dentro da função `GET`, leia o header `Authorization`. Compare o token 'Bearer' recebido com o valor da variável de ambiente `process.env.CRON_SECRET`. Se o token for inválido, ausente ou não corresponder, retorne uma resposta `NextResponse` com status 401 (Unauthorized).

### 43.3. Instanciar e Configurar Cliente Supabase para o Servidor

**Status:** done  
**Dependencies:** 43.1  

Integrar o cliente Supabase do lado do servidor que utiliza a `service_role`, necessária para executar a função RPC com as devidas permissões.

**Details:**

Importe a função ou o objeto que cria um cliente Supabase para uso no servidor (provavelmente de um módulo em `src/lib/supabase/`). Instancie este cliente dentro da função `GET` para que ele esteja disponível para fazer a chamada RPC.

### 43.4. Executar a RPC 'refresh_hot_flags' e Tratar a Resposta

**Status:** done  
**Dependencies:** 43.2, 43.3  

Utilizar o cliente Supabase para invocar a função `refresh_hot_flags` no banco de dados e manipular adequadamente as respostas de sucesso e de erro.

**Details:**

Após a autenticação, chame `supabase.rpc('refresh_hot_flags')`. Use um bloco try/catch para a chamada. Em caso de sucesso (`data` retornado sem `error`), retorne `NextResponse.json({ updated_count: data }, { status: 200 })`. Em caso de falha (`error`), logue o erro no console e retorne `NextResponse.json({ message: 'Erro ao executar RPC' }, { status: 500 })`.

### 43.5. Configurar Variável de Ambiente e Agendamento no Vercel

**Status:** done  
**Dependencies:** 43.4  

Adicionar a variável de ambiente `CRON_SECRET` nas configurações do projeto Vercel e criar um novo Cron Job para invocar o endpoint `/api/cron/hot` periodicamente.

**Details:**

Acesse o dashboard do projeto no Vercel. Navegue até 'Settings > Environment Variables' e adicione o `CRON_SECRET` com um valor seguro. Em seguida, vá para 'Settings > Cron Jobs', crie um novo job apontando para `/api/cron/hot` e defina a frequência de execução desejada (ex: `0 * * * *` para rodar de hora em hora).
