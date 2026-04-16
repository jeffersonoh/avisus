# ADR 004: ScrapingBee para scraping de Magazine Luiza

## Status

Aceita

## Data

2026-04-16

## Contexto

O scanner precisa extrair ofertas de Magazine Luiza (F02) para alimentar o pipeline de oportunidades e margem. Diferente do Mercado Livre, o Magalu não oferece API pública de afiliados equivalente e a página web depende de renderização JavaScript, com proteções anti-bot (rotação de user-agent, fingerprinting, captcha ocasional).

Rodar um browser real (Playwright/Puppeteer) dentro da aplicação exigiria:

- Contêiner Docker (Chromium ~200 MB, dependências de sistema)
- Processo long-running (incompatível com Vercel Functions — ADR 001)
- Rotação própria de proxies residenciais e gestão de user-agents
- Monitoramento de bloqueios e atualizações de fingerprint

## Decisão

Delegar a renderização JS e o anti-bot para o **ScrapingBee** (plano Freelance, US$ 49/mês) e fazer o parsing do HTML retornado com **Cheerio** dentro da própria função de cron.

- **URL:** `www.magazineluiza.com.br/busca/{term}/`
- **Parâmetros ScrapingBee:** JS rendering habilitado (5 créditos/request)
- **Capacidade do plano:** ~250 K créditos/mês, equivalentes a ~50 K requests com JS
- **Uso de RAM na function:** 5–15 MB (apenas HTTP client + Cheerio, sem Chromium local)
- **Estratégia em camadas (env var `MAGALU_SCRAPE_MODE`):**
  1. `api` — HTTP direto à API interna Magalu (0 créditos ScrapingBee, quando viável)
  2. `managed` — ScrapingBee com JS rendering (padrão, 5 créditos/request)
  3. `disabled` — desativado; graceful degradation, scanner opera apenas com Mercado Livre

O scanner tolera falha do Magalu sem bloquear o ciclo: erros são isolados por marketplace.

## Alternativas Consideradas

- **Playwright + Fly.io/Railway** → descartada por custo fixo de VM, overhead de Docker, manutenção de proxies próprios e conflito com ADR 001 (serverless-first)
- **Puppeteer em Vercel Function** → descartada porque Chromium não cabe no limite de tamanho de function e cold start seria inviável
- **Bright Data / Oxylabs (proxies residenciais)** → descartada por complexidade de configuração e custo superior sem ganho relevante para o MVP
- **Parceria oficial com API do Magalu** → descartada por não existir oferta pública equivalente à de afiliados do Mercado Livre

## Consequências

**Positivas:**

- Zero ops de browser: nada de Chromium, Docker ou VM
- Anti-bot, proxies e rotação gerenciados pelo fornecedor
- Função Vercel permanece leve (parsing Cheerio é barato)
- Feature flag `MAGALU_SCRAPE_MODE=disabled` permite degradar o sistema sem deploy
- Falhas do Magalu isoladas; Mercado Livre continua funcionando

**Negativas:**

- Custo fixo de US$ 49/mês, maior item do orçamento operacional
- Dependência de fornecedor externo: indisponibilidade ou mudança na estrutura HTML do Magalu exigem reação rápida
- Consumo de créditos precisa ser monitorado (alerta < 20 %)
- Seletores Cheerio são frágeis a mudanças de layout

**Neutras:**

- O mesmo ScrapingBee pode ser reaproveitado como fallback para detecção de lives (Shopee/TikTok) — ver `docs/agents/09-integrations.md`

## Referências

- Integração completa: `docs/agents/09-integrations.md` (seção 2)
- Troubleshooting e riscos: `docs/agents/12-troubleshooting.md`
- Tech Spec: `.tasks/avisus-mvp/tech-spec.md`

> Todo ADR deve ter no máximo uma página.
