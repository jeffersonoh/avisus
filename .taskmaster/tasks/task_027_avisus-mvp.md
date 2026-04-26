# Task ID: 27

**Title:** Client Magazine Luiza com modos `api|managed|disabled`

**Status:** done

**Dependencies:** 25

**Priority:** high

**Description:** Implementar cliente com flag `MAGALU_SCRAPE_MODE` controlando estratégia: ScrapingBee + Cheerio (managed), API direta se disponível, ou desabilitado.

**Details:**

Contexto:
- Equivalente a T-052 (tasks.md). F02 parcial (RF-04) para Magalu via ScrapingBee.

Escopo:
- `src/lib/scanner/magazine-luiza.ts` com switch por `MAGALU_SCRAPE_MODE`:
  - `disabled`: retorna `[]`, não consome créditos.
  - `managed`: ScrapingBee (`src/lib/scanner/scraping-bee.ts`) + Cheerio.
  - `api`: placeholder para integração futura.
- Timeout 20s; retry 1x; fallback para `[]`.

Fora de escopo:
- Instrumentação Sentry (T-103).

Implementação:
- Arquivos/módulos: `src/lib/scanner/magazine-luiza.ts`, `src/lib/scanner/scraping-bee.ts`.
- Regras e validações: normalizar `external_id`; extrair preço, preço original, desconto, `buy_url`, `image_url`.

Critérios de pronto:
- Modo `disabled` degrada sem derrubar scan.
- Modo `managed` retorna produtos reais em staging com créditos ScrapingBee.

**Test Strategy:**

Cenários de teste:
- [x] `disabled` retorna `[]`.
- [x] `managed` parseia HTML sample conhecido.
- [x] Timeout leva a `[]` + log.

Validações técnicas:
- [x] `SCRAPINGBEE_API_KEY` nunca logado.
- [x] Cheerio seletores documentados inline.

## Subtasks

### 27.1. Implementar cliente ScrapingBee para buscar HTML da página de produto

**Status:** done  
**Dependencies:** None  

Criar ou adaptar o módulo `src/lib/scanner/scraping-bee.ts` para realizar requisições ao ScrapingBee, passando a URL do Magazine Luiza e recebendo o HTML renderizado. A implementação deve gerenciar a chave de API de forma segura.

**Details:**

A função deve aceitar uma URL como entrada e retornar o conteúdo HTML como string. Deve incluir tratamento de erro para falhas na API do ScrapingBee, como timeouts ou erros de autenticação. Utilizar a variável de ambiente `SCRAPINGBEE_API_KEY`.

### 27.2. Desenvolver o parser de HTML com Cheerio para extrair dados do produto

**Status:** done  
**Dependencies:** 27.1  

Implementar a lógica no arquivo `src/lib/scanner/magazine-luiza.ts` que utiliza a biblioteca Cheerio para analisar o HTML obtido do ScrapingBee e extrair as informações do produto, como preço, nome, URL da imagem e link de compra.

**Details:**

Identificar e documentar os seletores CSS para `external_id`, `price`, `original_price`, `discount`, `buy_url` e `image_url`. A implementação deve ser robusta a pequenas alterações no HTML e registrar avisos quando os seletores falharem.

### 27.3. Implementar o controle de modos via `MAGALU_SCRAPE_MODE` e fallback

**Status:** done  
**Dependencies:** 27.2  

Implementar a lógica principal em `src/lib/scanner/magazine-luiza.ts` que lê a variável de ambiente `MAGALU_SCRAPE_MODE` e executa a estratégia correspondente: `disabled`, `managed` ou `api` (placeholder).

**Details:**

Criar uma estrutura de `switch` ou `if/else` baseada na flag. O modo `disabled` deve retornar um array vazio `[]` imediatamente. O modo `managed` deve orquestrar a chamada ao ScrapingBee e ao parser. Implementar a lógica de timeout (20s) e retry (1x).
