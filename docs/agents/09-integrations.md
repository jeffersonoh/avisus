# 09-integrations.md: Integrações Externas

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [03-architecture.md](03-architecture.md) | [12-troubleshooting.md](12-troubleshooting.md)

## Visão Geral

O Avisus integra com 8 serviços externos. Todas as integrações rodam como Vercel Functions (serverless), sem processos persistentes.

## 1. Mercado Livre — API de Afiliados

| Item | Detalhe |
|------|---------|
| API | `api.mercadolibre.com` — Items & Search API |
| Auth | OAuth 2.0 (`ML_CLIENT_ID` + `ML_CLIENT_SECRET`) |
| Endpoints | `GET /sites/MLB/search?q={term}`, `GET /items/{id}` |
| Dados extraídos | Nome, preço, preço original, desconto, frete, vendidos, categoria, link, imagem |
| Rate limit | 10.000 req/hora |
| Token management | Access token em variável global da function (TTL ~6h); refresh automático via `ML_REFRESH_TOKEN` antes da expiração. Se falhar, log de erro e retry no próximo ciclo (5 min) |
| Executa em | `/api/cron/scan` (maxDuration: 300s) |
| Env vars | `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REFRESH_TOKEN` |

## 2. Magazine Luiza — ScrapingBee + Cheerio

| Item | Detalhe |
|------|---------|
| Método | ScrapingBee API para JS rendering + Cheerio para parsing HTML |
| URL | `www.magazineluiza.com.br/busca/{term}/` |
| Dados extraídos | Nome, preço, preço original, desconto, frete, link, imagem |
| Anti-bot | Gerenciado pelo ScrapingBee (rotação proxies, user-agents, stealth) |
| Créditos | 5 créditos/request (JS rendering). Freelance: 250K créditos ≈ 50K requests/mês |
| RAM | ~5-15 MB (HTTP client + Cheerio — sem browser local) |
| Executa em | `/api/cron/scan` (maxDuration: 300s) |
| Env vars | `SCRAPINGBEE_API_KEY`, `MAGALU_SCRAPE_MODE` |

### Estratégia em Camadas (Magalu)

1. **`api`** — HTTP direto à API interna Magalu (0 créditos ScrapingBee)
2. **`managed`** — ScrapingBee com JS rendering (5 créditos/request)
3. **`disabled`** — Desativado (graceful degradation — apenas ML funciona)

Controlado por `MAGALU_SCRAPE_MODE` (padrão: `managed`).

## 3. Telegram Bot API

| Item | Detalhe |
|------|---------|
| API | `api.telegram.org/bot{token}/sendMessage` |
| parse_mode | HTML |
| Rate limit | 30 msgs/segundo |
| Vinculação | Usuário informa @username no perfil; bot valida via `getChat` |
| Retry | 3 tentativas (campo `attempts` em `alerts`); após falha final: `status = 'failed'` |
| Executa em | Ofertas: `/api/cron/scan` / Lives: `/api/cron/live` |
| Feature flag | `ENABLE_TELEGRAM_ALERTS` (default `true`; `false` em staging/dev para não enviar real) |
| Env var | `TELEGRAM_BOT_TOKEN` |

### Templates de Mensagem

**Oferta:**
```
<b>{nome}</b>
💰 Custo: R$ {preco+frete}
📈 Margem: {margin}% via {canal}
🔥 {quality}
⏰ Expira em {tempo_restante}    ← só se expires_at disponível

<a href="{url}">Ver oferta →</a>
```

**Live (F14):**
```
🔴 <b>AO VIVO</b> — {seller_name}
📺 {platform}: {live_title}

<a href="{live_url}">Entrar na live →</a>
```

## 4. Shopee Live — Detecção de Status (F14)

| Item | Detalhe |
|------|---------|
| Método | Polling HTTP |
| Primário | `GET https://shopee.com.br/api/v4/livestream/get_info?username={seller}` (API interna) |
| Fallback | ScrapingBee no perfil do vendedor → Cheerio para detectar badge "AO VIVO" |
| Detecção | Transição `is_live: false → true` dispara alerta |
| Dados | `is_live`, `live_title`, `live_url` |
| Polling | A cada 2 min via `/api/cron/live` |
| Rate limit | Até 50 sellers por invocação; > 50 → lotes rotativos |
| Anti-bloqueio | Headers browser, delays 100-500ms, ScrapingBee fallback |
| Feature flag | `ENABLE_SHOPEE_LIVE` |
| **Risco** | API interna pode mudar sem aviso |

## 5. TikTok Live — Detecção de Status (F14)

| Item | Detalhe |
|------|---------|
| Método | Polling HTTP |
| Primário | `GET https://www.tiktok.com/api/live/detail/?uniqueId={seller}` (API interna) |
| Fallback | ScrapingBee na página do vendedor → Cheerio |
| Detecção | Mesma lógica Shopee: transição `false → true` |
| Polling | Compartilhado com Shopee no mesmo cron |
| Feature flag | `ENABLE_TIKTOK_LIVE` |
| **Risco** | APIs internas TikTok mais instáveis que Shopee; priorizar Shopee na primeira semana |

## 6. Stripe — Subscriptions

| Item | Detalhe |
|------|---------|
| Fluxo | Route Handler cria `checkout.sessions` → Stripe hosted page → webhook |
| Planos | `price_starter_monthly`, `price_pro_monthly` (Dashboard Stripe) |
| Métodos de pagamento | Cartão + Pix |
| Webhook events | `customer.subscription.created`, `updated`, `deleted`, `invoice.payment_failed` |
| Idempotência | Verifica `stripe_subscription_id` existente; validação de assinatura via `constructEvent()` |
| Executa em | `/api/stripe/webhook` |
| Feature flag | `STRIPE_LIVE_MODE` (default `false`; usa test mode até validação em produção) |
| Env vars | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` |

## 7. IBGE — Localidades

| Item | Detalhe |
|------|---------|
| API | `servicodados.ibge.gov.br/api/v1/localidades` |
| Uso | Lista estados e cidades para perfil do revendedor |
| Cache | TanStack Query com `staleTime: 24h` (chamada direta do client) |

## 8. Supabase Auth

| Item | Detalhe |
|------|---------|
| Providers | Email/senha + Google OAuth |
| Pacote | `@supabase/ssr` |
| Session | Cookie-based, refresh via middleware |
| Profile | Trigger `on_auth_user_created` cria row em `profiles` |

## Resumo de Env Vars por Integração

| Integração | Variáveis |
|-----------|-----------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_*_PRICE_ID`, `STRIPE_LIVE_MODE` |
| Telegram | `TELEGRAM_BOT_TOKEN`, `ENABLE_TELEGRAM_ALERTS` |
| Mercado Livre | `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REFRESH_TOKEN` |
| ScrapingBee | `SCRAPINGBEE_API_KEY`, `MAGALU_SCRAPE_MODE` |
| Live Monitor | `ENABLE_SHOPEE_LIVE`, `ENABLE_TIKTOK_LIVE` |
| Cron | `CRON_SECRET` |
| Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [08-performance.md](08-performance.md) | Próximo: [10-data-management.md](10-data-management.md)*
