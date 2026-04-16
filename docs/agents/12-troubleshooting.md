# 12-troubleshooting.md: Troubleshooting

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [09-integrations.md](09-integrations.md) | [05-development-workflow.md](05-development-workflow.md)

## Visão Geral

Problemas conhecidos, riscos operacionais, feature flags de fallback e estratégias de mitigação para o Avisus MVP.

## Feature Flags

| Flag (env var) | Padrão | Efeito quando desativado |
|------|--------|--------------------------|
| `MAGALU_SCRAPE_MODE=disabled` | `managed` | Scanner opera apenas com ML; Magalu ignorado |
| `ENABLE_SHOPEE_LIVE=false` | `true` | Live Monitor pula Shopee; TikTok continua |
| `ENABLE_TIKTOK_LIVE=false` | `true` | Live Monitor pula TikTok; Shopee continua |
| `ENABLE_TELEGRAM_ALERTS=false` | `true` | Alertas não são enviados (dev/staging) |
| `STRIPE_LIVE_MODE=false` | `false` | Usa Stripe test mode |

## Riscos e Mitigações

### Magazine Luiza — Bloqueio de Scraping

- **Probabilidade:** Média
- **Sintoma:** ScrapingBee retorna HTML vazio ou erro 403
- **Mitigação:** ScrapingBee gerencia proxies e anti-bot; `MAGALU_SCRAPE_MODE=disabled` para desativar; sistema continua com ML apenas
- **Monitorar:** Taxa de sucesso nas Vercel Logs

### ScrapingBee — Créditos Esgotados

- **Probabilidade:** Baixa
- **Sintoma:** API retorna 402 ou erro de quota
- **Mitigação:** Monitorar saldo via API ScrapingBee; reduzir frequência Magalu; upgrade para Startup ($99/mês)
- **Alerta:** Créditos < 20% do plano

### API Shopee/TikTok Live — Mudança sem Aviso

- **Probabilidade:** Alta (APIs internas)
- **Sintoma:** Polling retorna 404, JSON inesperado ou taxa de falhas > 50%
- **Mitigação:** Fallback para ScrapingBee + Cheerio no perfil público; feature flags para desativar individualmente
- **Degradação graceful:** UI mostra "detecção temporariamente indisponível"
- **TikTok mais instável:** Priorizar Shopee na primeira semana

### Vercel Function Timeout (Scanner)

- **Probabilidade:** Média
- **Sintoma:** Function excede 300s com lote grande
- **Mitigação:** Lotes de 20 termos (não 50); termos restantes processados na próxima invocação (5 min); scan é idempotente via UNIQUE constraints
- **Monitorar:** Logs de duração no Vercel dashboard

### Token ML Expirado

- **Probabilidade:** Baixa
- **Sintoma:** API ML retorna 401
- **Mitigação:** Refresh automático antes de expirar (TTL ~6h); se falhar, log erro e retry no próximo ciclo (~5 min)
- **Perda máxima:** 1 ciclo de scan

### Imprecisão na Margem Estimada

- **Probabilidade:** Alta
- **Sintoma:** Margem calculada difere significativamente da margem real de revenda
- **Mitigação:** Comunicar "estimativa" na UI; `marketplace_fees` editável pelo admin; disclaimer no onboarding; modo `custom` permite ajuste por revendedor
- **Monitorar:** Feedback dos usuários sobre precisão

### ScrapingBee Fora do Ar / Lento

- **Probabilidade:** Baixa
- **Sintoma:** Requests excedem timeout de 30s ou retornam erro 5xx
- **Mitigação:** Timeout de 30s por request; fallback `MAGALU_SCRAPE_MODE=disabled` temporário; ML continua funcionando independente
- **Monitorar:** Latência média nas Vercel Logs

### Falsos Positivos/Negativos em Detecção de Live

- **Probabilidade:** Média
- **Sintoma:** Alertas de live quando vendedor não está ao vivo, ou ausência de alerta quando está
- **Mitigação:** Usar transição `is_live: false→true` (não apenas valor atual) para evitar alertas repetidos; monitorar taxa de falsos positivos
- **Degradação:** Permitir report "alerta incorreto" (Could Have pós-MVP)

### Supabase Free Tier

- **Probabilidade:** Baixa (no MVP)
- **Sintoma:** DB > 500 MB ou auth > 50K MAU
- **Mitigação:** Monitorar uso; retenção de 90 dias em price_history; upgrade Pro ($25/mês)
- **Alerta:** Storage > 400 MB

## Tratamento de Erros por Camada

| Camada | Estratégia |
|--------|-----------|
| **Frontend** | `error.tsx` por rota (Error Boundaries); toast para erros de ação; retry via TanStack Query |
| **Server Actions** | Try/catch + Zod; retorno `{ error, code }` |
| **Route Handlers** | HTTP semânticos (400/401/403/500) com corpo JSON |
| **Scanner** | Erros por marketplace isolados (falha ML não bloqueia Magalu) |
| **Live Monitor** | Erros por plataforma isolados; seller com 5 falhas consecutivas marcado `check_failed` |
| **Telegram** | 3 tentativas; após falha final: `status = 'failed'` com `error_message` |

## Mensagens de Erro ao Usuário

| Contexto | Mensagem |
|----------|---------|
| Rede | "Não foi possível conectar. Verifique sua internet e tente novamente." |
| Validação | Mensagens inline específicas (ex: "Este termo já está cadastrado") |
| Servidor | "Algo deu errado. Tente novamente em alguns instantes." |
| Limite plano | CTA de upgrade (ex: "Limite de 5 alertas/dia atingido. Faça upgrade!") |
| Live indisponível | "Detecção de live temporariamente indisponível para esta plataforma." |

## Alertas Recomendados (Pós-Launch)

| Condição | Ação |
|----------|------|
| Cron scan sem oportunidades novas > 2h | Revisar Vercel Logs + saldo ScrapingBee |
| Sentry > 50 erros/hora | Investigar |
| Supabase storage > 400 MB | Planejar cleanup ou upgrade |
| ScrapingBee créditos < 20% | Avaliar upgrade ou reduzir frequência |
| Live monitor: falhas > 50% em 1h | Verificar se API Shopee/TikTok mudou |
| Live alerts: nenhum enviado em 24h com sellers ativos | Revisar polling |

## Desvios do PRD

O MVP possui 14 desvios documentados (D1-D14) da especificação do PRD. Os mais relevantes para troubleshooting:

| Desvio | Resumo |
|--------|--------|
| D1 | HOT flag global (não contextual por filtro) |
| D5 | Score básico STARTER não implementado no MVP |
| D6 | Tendências de preço não implementadas no MVP |
| D9 | Alertas de live em silêncio descartados (não enfileirados) |
| D11 | Scanner com 2 marketplaces (ML + Magalu), sem Shopee para ofertas |

Desvios completos em `.tasks/avisus-mvp/tech-spec.md`, seção "Desvios do PRD e Justificativas".

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [11-ai-collaboration.md](11-ai-collaboration.md) | Próximo: [13-resources.md](13-resources.md)*
