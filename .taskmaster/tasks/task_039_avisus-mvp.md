# Task ID: 39

**Title:** Clients `shopee-live.ts` e `tiktok-live.ts` em camadas

**Status:** done

**Dependencies:** 25

**Priority:** high

**Description:** Implementar detecção de live com estratégia em camadas (API interna → ScrapingBee), delays 100–500ms entre chamadas e flags `ENABLE_SHOPEE_LIVE`/`ENABLE_TIKTOK_LIVE`.

**Details:**

Contexto:
- Equivalente a T-070 (tasks.md). F14 (RF-53).

Escopo:
- `src/lib/scanner/live/shopee-live.ts` e `tiktok-live.ts`: função `checkLive(seller)` retorna `{ isLive, title?, url }`.
- Estratégia em camadas: 1) endpoint público/heurística; 2) ScrapingBee como fallback.
- Respeitar flags; falha isolada por plataforma.

Fora de escopo:
- Polling e atualização de estado (T-071).

Implementação:
- Arquivos/módulos: `src/lib/scanner/live/shopee-live.ts`, `src/lib/scanner/live/tiktok-live.ts`.
- Regras e validações: delays aleatórios 100–500ms; timeouts 10s; User-Agent rotativo documentado.

Critérios de pronto:
- Flag off → função retorna `{ isLive: false }` imediatamente.
- Falha Shopee não afeta TikTok.

**Test Strategy:**

Cenários de teste:
- [x] Shopee 200 live:true → retorno correto.
- [x] TikTok 503 → fallback ScrapingBee tentado.
- [x] Flag off → no-op.

Validações técnicas:
- [x] Sem vazamento de credenciais em URL.
- [x] Delays respeitados (não hammerar).

## Subtasks

### 39.1. Implementar Cliente de Detecção de Live para Shopee (`shopee-live.ts`)

**Status:** done  
**Dependencies:** None  

Desenvolver a função `checkLive(seller)` para a Shopee, implementando a estratégia em camadas. Primeiro, tentar uma API interna ou heurística pública. Se falhar, usar ScrapingBee como fallback.

**Details:**

Criar o arquivo `src/lib/scanner/live/shopee-live.ts`. A função `checkLive` deve retornar um objeto `{ isLive, title?, url }`. A primeira tentativa deve ser via endpoint público/interno da Shopee. Em caso de falha, uma segunda tentativa deve ser feita usando ScrapingBee.

### 39.2. Implementar Cliente de Detecção de Live para TikTok (`tiktok-live.ts`)

**Status:** done  
**Dependencies:** None  

Desenvolver a função `checkLive(seller)` para o TikTok, seguindo uma estratégia em camadas similar à da Shopee. A primeira tentativa deve usar uma abordagem leve (API pública/heurística) e o fallback será via ScrapingBee.

**Details:**

Criar o arquivo `src/lib/scanner/live/tiktok-live.ts`. A função `checkLive` deve ter a mesma assinatura e tipo de retorno do cliente Shopee. Investigar e implementar a melhor estratégia para a primeira camada de detecção no TikTok e usar ScrapingBee como fallback.

### 39.3. Integrar Flags de Ambiente (`ENABLE_SHOPEE_LIVE`, `ENABLE_TIKTOK_LIVE`)

**Status:** done  
**Dependencies:** 39.1, 39.2  

Adicionar variáveis de ambiente para habilitar ou desabilitar a verificação de live para cada plataforma individualmente. Se a flag estiver desabilitada, a função deve retornar imediatamente com `{ isLive: false }`.

**Details:**

Ler as variáveis de ambiente `ENABLE_SHOPEE_LIVE` e `ENABLE_TIKTOK_LIVE` no início das respectivas funções `checkLive`. Se a flag for 'false', a função deve retornar `{ isLive: false }` sem executar nenhuma chamada de rede, economizando recursos.

### 39.4. Implementar Mecanismos de Robustez: Delays, User-Agent e Timeouts

**Status:** done  
**Dependencies:** 39.1, 39.2  

Adicionar mecanismos para evitar bloqueios e garantir a resiliência das chamadas de rede. Implementar um delay aleatório entre 100-500ms, rotação de User-Agent e timeouts de 10s para as requisições.

**Details:**

Em ambos os clientes, antes de cada chamada de rede, introduzir um delay aleatório (100-500ms). Manter uma lista de User-Agents e selecionar um aleatoriamente para cada requisição. Configurar um timeout de 10 segundos para todas as chamadas HTTP, tratando o erro de timeout adequadamente.
