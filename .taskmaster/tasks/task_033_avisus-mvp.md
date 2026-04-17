# Task ID: 33

**Title:** Configurar `maxDuration` dos handlers de cron

**Status:** done

**Dependencies:** 25, 32

**Priority:** high

**Description:** Definir `export const maxDuration` em cada rota: scan 300s, live 30–60s conforme Tech Spec.

**Details:**

Contexto:
- Equivalente a T-058 (tasks.md). Evita abortos por timeout em crons pesados.

Escopo:
- Ajustar `maxDuration` em `scan/route.ts` (300), `live/route.ts` (60), `hot/route.ts` (30), `cleanup/route.ts` (60).
- Garantir `runtime = 'nodejs'` onde necessário.

Fora de escopo:
- Otimização de pipeline em si.

Implementação:
- Arquivos/módulos: cada `route.ts` em `src/app/api/cron/`.
- Regras e validações: Vercel Pro aceita até 800s; nunca setar acima do necessário.

Critérios de pronto:
- Build Vercel sem warning de runtime inválido.
- Nenhum cron excede o limite configurado.

**Test Strategy:**

Cenários de teste:
- [x] `scan` rodando 4min completa sem timeout.
- [x] `live` com 50 sellers conclui em < 60s.

Validações técnicas:
- [x] `export const` presentes.
- [x] Monitor de duração no Vercel logs.

## Subtasks

### 33.1. Configurar maxDuration de 300s para a rota /api/cron/scan

**Status:** done  
**Dependencies:** None  

Ajustar o tempo máximo de execução do cron de varredura ('scan') para 300 segundos, evitando timeouts em operações que demandam mais processamento.

**Details:**

Editar o arquivo `src/app/api/cron/scan/route.ts` e adicionar a constante exportada `export const maxDuration = 300;`. É crucial também garantir que `export const runtime = 'nodejs';` esteja presente para que a configuração de `maxDuration` seja aplicada pela Vercel.

### 33.2. Configurar maxDuration de 60s para a rota /api/cron/live

**Status:** done  
**Dependencies:** None  

Definir o tempo máximo de execução do cron de busca em tempo real ('live') para 60 segundos, conforme a especificação técnica.

**Details:**

No arquivo `src/app/api/cron/live/route.ts`, adicionar a linha `export const maxDuration = 60;`. Assim como nas outras rotas de cron, assegurar que o runtime esteja definido como 'nodejs'.

### 33.3. Configurar maxDuration de 30s para a rota /api/cron/hot

**Status:** done  
**Dependencies:** None  

Ajustar o tempo máximo de execução do cron de itens 'quentes' ('hot') para 30 segundos. Esta é uma tarefa rápida e deve ter um timeout menor.

**Details:**

Editar o arquivo `src/app/api/cron/hot/route.ts` para incluir a declaração `export const maxDuration = 30;`. Validar a presença da configuração `export const runtime = 'nodejs';`.

### 33.4. Configurar maxDuration de 60s para a rota /api/cron/cleanup

**Status:** done  
**Dependencies:** None  

Definir o tempo máximo de execução do cron de limpeza ('cleanup') para 60 segundos, garantindo tempo suficiente para tarefas de manutenção de dados.

**Details:**

Modificar o arquivo `src/app/api/cron/cleanup/route.ts` adicionando a constante `export const maxDuration = 60;`. Verificar se o runtime está configurado como 'nodejs' para garantir a compatibilidade.

### 33.5. Validar todas as configurações de `maxDuration` no ambiente Vercel

**Status:** done  
**Dependencies:** 33.1, 33.2, 33.3, 33.4  

Após a implementação individual das configurações de `maxDuration`, realizar um deploy e validar de forma centralizada que todas as rotas de cron estão com os timeouts corretos no ambiente Vercel.

**Details:**

Realizar um deploy para um ambiente de staging/preview. Inspecionar o dashboard de Funções da Vercel para cada rota de cron (`scan`, `live`, `hot`, `cleanup`) e confirmar que a coluna 'Timeout' exibe os valores corretos (300s, 60s, 30s, 60s).
