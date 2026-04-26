# ADR 009: Apify para detecção de lives Shopee/TikTok

## Status

Aceita

## Data

2026-04-18

## Contexto

O Live Monitor (F14) detecta o início de transmissões ao vivo de vendedores favoritos no Shopee e TikTok em até 2 min. A implementação inicial usava duas camadas — HTTP público com rotação de user-agent e fallback para **ScrapingBee** — e aplicava regex sobre o HTML/JSON embutido para inferir o status de live.

Essa abordagem apresentou limitações:

- TikTok Live expõe o estado via WebSocket/GraphQL, não por HTML renderizado. Regex sobre markers (`"isLive":true`, `liveRoom`) é frágil e quebra quando o TikTok ajusta o SSR.
- Anti-bot do TikTok é agressivo: requests diretos retornam 403/redirect frequentemente; o fallback ScrapingBee paga JS rendering mesmo sem conseguir garantia de captura do estado real.
- Cada seller consome 1 crédito ScrapingBee (ou 5 com JS rendering) por ciclo de 2 min — inviável se a base de lives crescer.
- Shopee Live tem o mesmo problema de SSR incompleto.

Precisamos de uma solução que **delegue a manutenção do parser de TikTok/Shopee** para um fornecedor especializado e mantenha a interface `checkTikTokLive` / `checkShopeeLive` estável para o resto do pipeline.

## Decisão

Adotar o **Apify** (`api.apify.com/v2`) para o Live Monitor, substituindo ScrapingBee e HTTP direto no módulo [`src/lib/scanner/live/`](../../src/lib/scanner/live/). Modelo de integração escolhido: **Sync run por seller (Modelo 1)**.

### Modelo 1 — Sync run por seller (adotado)

- Cada chamada de `checkTikTokLive(seller)` / `checkShopeeLive(seller)` dispara um `POST /v2/acts/{actor}/run-sync-get-dataset-items?token=...` com o username do seller no `input`
- O actor resolve rendering + anti-bot + parsing e retorna um array JSON
- O cliente [`src/lib/scanner/live/apify.ts`](../../src/lib/scanner/live/apify.ts) faz o POST, aplica timeout e normaliza erros (`ApifyError`, `ApifyTimeoutError`, `ApifyUnauthorizedError`)
- O parser em [`common.ts`](../../src/lib/scanner/live/common.ts) (`parseApifyLiveItem`) extrai `isLive`, `title`, `url` a partir de uma lista de chaves prováveis (`isLive`, `liveStatus`, `liveUrl`, …)
- Actors configuráveis por env var (`APIFY_TIKTOK_ACTOR_ID`, `APIFY_SHOPEE_ACTOR_ID`) — permitem trocar o fornecedor de actor sem mudar código
- Feature flags mantidas (`ENABLE_TIKTOK_LIVE`, `ENABLE_SHOPEE_LIVE`): se `false` ou actor id vazio, retorna `isLive: false` sem chamar API

**Por que Modelo 1 primeiro:**

- Refactor mínimo: mantém a interface `checkTikTokLive` / `checkShopeeLive` — `live-monitor.ts` e seus testes não mudam
- Plug-and-play com o cron atual (*/2 min → polling sequencial com batch de 50 sellers)
- Custo previsível no MVP (base < 50 sellers de favoritos)
- Permite experimentar actors diferentes sem reescrever o pipeline

### Modelo 2 — Batch run + webhook (evolução futura, não implementado)

Para quando a base crescer e o polling sequencial virar gargalo/custo:

- Um único `POST /v2/acts/{actor}/runs` dispara um run com **todos os sellers** de uma vez no input
- O run executa assíncrono no Apify; resultado é enviado via **webhook Apify** para `POST /api/cron/live/webhook`
- O webhook valida assinatura HMAC do Apify + CRON_SECRET e processa o dataset do run (`GET /v2/actor-runs/{id}/dataset/items`)
- Lógica de `runLiveMonitor` deixa de orquestrar checks por seller e passa a consumir eventos do webhook
- Vantagens: paraleliza no Apify, reduz overhead por-seller, custo por "compute unit" do run inteiro é menor que N runs individuais
- Custos: muda contrato do cron, exige endpoint público assinado, complica testes de integração

**Gatilhos para migrar ao Modelo 2:**

- Base de `favorite_sellers` ultrapassar ~200 registros ativos
- Custo mensal Apify ultrapassar ~$30 com Modelo 1
- p95 do `/api/cron/live` ultrapassar 30s

## Alternativas Consideradas

- **Manter ScrapingBee + regex** → descartada por fragilidade do parser TikTok e custo crescente por seller
- **Bright Data SERP API / Oxylabs** → descartada por custo superior sem actors prontos para TikTok/Shopee Live
- **Puppeteer serverless (Browserless.io)** → descartada por precisar escrever e manter o parser (mesmo problema do ScrapingBee)
- **Apify Actor customizado (escrever o próprio)** → adiada; começar com actors prontos do marketplace e migrar se a qualidade dos actors públicos não atender

## Consequências

**Positivas:**

- Parser de TikTok/Shopee Live deixa de ser responsabilidade do Avisus
- Interface estável: `checkTikTokLive` / `checkShopeeLive` mantêm assinatura e comportamento
- Testes unitários mais simples (mock de uma função `runApifyActorSync`)
- ScrapingBee deixa de ser consumido pelo Live Monitor, liberando créditos para Magalu
- Feature flag e actor id configurável permitem experimentar actors sem redeploy

**Negativas:**

- Nova dependência externa (Apify) — outro fornecedor para monitorar (SLA, quota, billing)
- Custo por run varia com o actor escolhido (compute units) — exige acompanhamento mensal
- Depende de actors mantidos por terceiros; actor descontinuado exige troca rápida
- Não há garantia de que todos os actors retornem `isLive` diretamente — parser usa heurística em várias chaves

**Neutras:**

- Modelo 2 fica documentado como evolução conhecida, sem implementação agora

## Referências

- Código: [`src/lib/scanner/live/apify.ts`](../../src/lib/scanner/live/apify.ts), [`src/lib/scanner/live/tiktok-live.ts`](../../src/lib/scanner/live/tiktok-live.ts), [`src/lib/scanner/live/shopee-live.ts`](../../src/lib/scanner/live/shopee-live.ts), [`src/lib/scanner/live/common.ts`](../../src/lib/scanner/live/common.ts)
- API Apify: `https://docs.apify.com/api/v2`
- ADR 004 (ScrapingBee para Magalu): [`./004_scrapingbee_para_magazine_luiza.md`](./004_scrapingbee_para_magazine_luiza.md)
- Integrações: [`../agents/09-integrations.md`](../agents/09-integrations.md)

> Todo ADR deve ter no máximo uma página.
