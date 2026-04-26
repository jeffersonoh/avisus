# ADR 010: ScrapingBee para scanner do Mercado Livre

## Status

Aceita

## Data

2026-04-19

## Contexto

O scanner de ofertas depende da busca por termo no Mercado Livre para gerar oportunidades: [`src/lib/scanner/mercado-livre.ts`](../../src/lib/scanner/mercado-livre.ts) chamava `GET /sites/MLB/search` com `Authorization: Bearer <access_token>` obtido via OAuth `refresh_token` grant em [`src/lib/scanner/ml-auth.ts`](../../src/lib/scanner/ml-auth.ts).

Durante validação local do fluxo (abril/2026) constatamos que o Mercado Livre **restringiu o acesso público** a esse endpoint:

- `POST /oauth/token` funciona normalmente (tokens válidos são emitidos e rotacionados)
- `GET /sites/MLB/search?q=<termo>` retorna **HTTP 403** para nossa app, mesmo com token válido e scope completo (`offline_access read write urn:ml:mktp:*`)
- Endpoints alternativos testados:
  - `GET /products/search` funciona, mas devolve apenas metadados de catálogo (sem `price`, `original_price`, `shipping`, `sold_quantity`)
  - `GET /products/{id}` idem — sem campos comerciais
  - `buy_box_winner` vem nulo em todos os casos
- `client_credentials` grant é aceito, mas o ML nega explicitamente dados comerciais com escopo não-usuário

Sem `price`, `original_price`, `shipping` e `sold_quantity` o scanner não consegue calcular `discount_pct` nem avaliar margem — quebra toda a pipeline de oportunidades definida em [`06-domain-model.md`](../agents/06-domain-model.md).

A liberação do `/sites/MLB/search` pelo ML DevCenter existe como caminho formal mas é incerta (exige justificativa comercial, aprovação manual, tempo de resposta em semanas) e não cabe no cronograma do MVP.

## Decisão

Migrar o scanner do Mercado Livre para **ScrapingBee**, mesma estratégia já adotada para Magalu conforme [ADR 004](./004_scrapingbee_para_magazine_luiza.md). Elimina a dependência de OAuth ML para o caminho crítico do scanner.

### Modelo de integração

- [`src/lib/scanner/mercado-livre.ts`](../../src/lib/scanner/mercado-livre.ts) passa a chamar a URL pública de busca (`https://lista.mercadolivre.com.br/<termo>`) via ScrapingBee
- Reusa o cliente já existente em [`src/lib/scrapingbee/client.ts`](../../src/lib/scrapingbee/client.ts) (mesmo timeout, retry, erros tipados)
- Parser extrai preço, desconto, frete grátis, unidades vendidas e link do produto a partir do HTML público (classes Cheerio estáveis da listagem)
- Feature flag `MERCADO_LIVRE_SCRAPE_MODE=managed|disabled` (análoga a `MAGALU_SCRAPE_MODE`) permite desativar sem redeploy
- `ML_CLIENT_ID`, `ML_CLIENT_SECRET` e `ML_REFRESH_TOKEN` **deixam de ser obrigatórios** para o scanner — passam a ser env vars opcionais (`undefined` desabilita o scanner antigo se ainda houver referências)

### Custo esperado

- Plano ScrapingBee atual: $49/mês com 100k créditos
- ML listing (`lista.mercadolivre.com.br`) exige **`premium_proxy=true`** (validado em 2026-04-19: sem premium proxy, ScrapingBee retorna HTTP 500 com mensagem explícita recomendando o upgrade)
- HTML público da listagem já vem completo, então `render_js=false` — economiza o custo de renderização
- Custo efetivo: **10 créditos por busca** (premium proxy sem JS)
- Magalu permanece em `render_js=true`, `premium_proxy=false` (~5 créditos/busca)
- Orçamento de créditos (premissa de 50 termos ativos):
  - Scanner a cada 4h (6 ciclos/dia): 50 × 6 × 10 = 3.000/dia ≈ 90k/mês ML → cabe no plano
  - Scanner a cada 1h (24 ciclos/dia): 50 × 24 × 10 = 12.000/dia ≈ 360k/mês ML → **não cabe**
- Decisão operacional: manter o scanner em **intervalo ≥ 4h** até que a base ativa justifique upgrade de plano, ou avaliar caching/dedup por termo (F15)

## Alternativas Consideradas

- **Pedir liberação do `/sites/MLB/search` ao ML DevCenter** → descartada por timing incerto (semanas) e risco alto de negação
- **Migrar para Apify (igual Live Monitor)** → viável tecnicamente, mas introduziria um segundo fornecedor de scraping sem ganho sobre ScrapingBee, cujo cliente já está maduro no codebase
- **Programa de Afiliados Mercado Livre** → exige aprovação formal (semanas), muda modelo de negócio (URLs com tracking de comissão), fora de escopo do MVP
- **Persistir `refresh_token` em Supabase + rotação automática** → chegamos a implementar a infra (migration `external_tokens`, repository, refactor de `ml-auth.ts`) mas o endpoint de busca retornou 403 mesmo assim — **a solução correta do refresh_token não resolve o problema de acesso ao endpoint**. Toda essa camada foi revertida

## Consequências

**Positivas:**

- Desbloqueia o scanner ML imediatamente (sem dependência de aprovação do ML)
- Reusa integração já validada (ScrapingBee cliente + retries + erros) — reduz superfície nova
- Remove complexidade de OAuth + persistência de tokens do caminho crítico
- Interface `searchByTerm(term)` mantém assinatura — código consumidor ([`opportunity-matcher.ts`](../../src/lib/scanner/opportunity-matcher.ts)) não muda
- Padrão único de scraping entre os dois marketplaces brasileiros cobertos pelo MVP

**Negativas:**

- Parser de HTML é inerentemente frágil — mudanças no layout da listagem ML podem quebrar extração de campos sem aviso
- Consumo de créditos ScrapingBee cresce — soma dos dois marketplaces precisa ser monitorada (alerta em 80% do plano)
- Sem OAuth, perdemos a possibilidade futura de usar endpoints privados do ML (pedidos, anúncios do próprio seller) sem nova infra — quando/se forem necessários, reativamos o fluxo OAuth

**Neutras:**

- `ml-bootstrap-token.mjs` e documentação do fluxo OAuth ficam removidos. Caso o ML volte a liberar o endpoint ou precisemos de endpoints privados no futuro, reativar o bootstrap é ~2h de trabalho
- Migration `0005_external_tokens.sql`, módulo `src/lib/scanner/external-tokens.ts` e refactor correspondente de `ml-auth.ts` foram revertidos — não há débito no schema

## Referências

- Código (atual): [`src/lib/scanner/mercado-livre.ts`](../../src/lib/scanner/mercado-livre.ts), [`src/lib/scanner/ml-auth.ts`](../../src/lib/scanner/ml-auth.ts)
- Código (a refatorar): mesmo módulo, substituindo `getMercadoLivreAccessToken` + `fetch('/sites/MLB/search')` pelo cliente ScrapingBee sobre `lista.mercadolivre.com.br`
- ADR 004 (ScrapingBee para Magalu): [`./004_scrapingbee_para_magazine_luiza.md`](./004_scrapingbee_para_magazine_luiza.md) — padrão a seguir
- ADR 009 (Apify para Live Monitor): [`./009_apify_para_live_monitor.md`](./009_apify_para_live_monitor.md) — alternativa descartada para ML
- Integrações: [`../agents/09-integrations.md`](../agents/09-integrations.md)

> Todo ADR deve ter no máximo uma página.
