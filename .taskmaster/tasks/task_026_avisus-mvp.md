# Task ID: 26

**Title:** Client Mercado Livre via API Afiliados

**Status:** pending

**Dependencies:** 25

**Priority:** high

**Description:** Implementar cliente HTTP direto para ML API Afiliados com OAuth refresh token; isolar falha para não abortar outros marketplaces.

**Details:**

Contexto:
- Equivalente a T-051 (tasks.md). F02 (RF-04) para ML.

Escopo:
- `src/lib/scanner/mercado-livre.ts`: `searchByTerm(term: string) => Promise<Product[]>`.
- Gerenciar OAuth refresh token (ML_CLIENT_ID/SECRET/REFRESH_TOKEN).
- Renovar token antes de expirar; cache em memória por invocação.

Fora de escopo:
- Matcher (T-054).
- Margem (T-053).

Implementação:
- Arquivos/módulos: `src/lib/scanner/mercado-livre.ts`, `src/lib/scanner/ml-auth.ts`.
- Regras e validações: timeout 15s; no máximo 2 retries em 5xx; parse do desconto do payload ML.

Critérios de pronto:
- Busca por termo retorna lista tipada de produtos.
- Falha isolada (ex: 503 ML) não aborta Magalu.

**Test Strategy:**

Cenários de teste:
- [ ] Token expirado → renova automaticamente.
- [ ] 5xx duas vezes → retorna array vazio (falha suave).
- [ ] 401 persistente → log + erro de auth.

Validações técnicas:
- [ ] Nenhum token logado.
- [ ] Timeout respeitado (teste com mock lento).

## Subtasks

### 26.1. Implementar Autenticação OAuth 2.0 para a API do Mercado Livre

**Status:** pending  
**Dependencies:** None  

Criar a lógica para gerenciar o fluxo de autenticação OAuth 2.0 da API de Afiliados do Mercado Livre, incluindo a obtenção, caching em memória e renovação de tokens de acesso.

**Details:**

Desenvolver um módulo em `src/lib/scanner/ml-auth.ts` que lida com o refresh token para obter um novo access token. O token de acesso deve ser cacheado em memória para evitar chamadas repetidas à API de autenticação. Utilizar as variáveis de ambiente `ML_CLIENT_ID`, `ML_CLIENT_SECRET` e `ML_REFRESH_TOKEN`.

### 26.2. Desenvolver a Função de Busca de Produtos `searchByTerm`

**Status:** pending  
**Dependencies:** 26.1  

Implementar a função principal `searchByTerm(term: string)` que utiliza o token de acesso para consultar a API de busca de produtos do Mercado Livre e retorna uma lista de produtos tipada.

**Details:**

No arquivo `src/lib/scanner/mercado-livre.ts`, criar a função `searchByTerm`. Esta função deverá obter um token de acesso válido do módulo de autenticação, montar a requisição HTTP e mapear a resposta da API para uma lista de `Product[]`, extraindo o desconto do payload.

### 26.3. Adicionar Tratamento de Erros, Retries e Isolamento de Falhas

**Status:** pending  
**Dependencies:** 26.2  

Implementar mecanismos de resiliência no cliente do Mercado Livre, incluindo timeouts, lógica de retentativas para erros 5xx, e isolamento de falhas para não impactar outros scanners.

**Details:**

Envolver as chamadas HTTP no módulo `mercado-livre.ts` com tratamento de erros. Implementar um timeout de 15 segundos, uma política de no máximo 2 retentativas para erros 5xx, e garantir que falhas persistentes resultem em um array vazio (`[]`) e um log, isolando a falha.
