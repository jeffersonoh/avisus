# ADR 005: Vercel Cron direto, sem fila externa no MVP

## Status

Aceita

## Data

2026-04-16

## Contexto

Quatro tarefas recorrentes precisam rodar de forma confiável:

- `scan` — varrer marketplaces (5 min)
- `live` — polling de lives Shopee/TikTok (2 min)
- `hot` — recalcular percentil 70 de margem (15 min)
- `cleanup` — expirar oportunidades e podar price_history (diário, 3h UTC-3)

Opções típicas para orquestrar tarefas serverless incluem filas (QStash, SQS), cron gerenciado (Vercel Cron, GitHub Actions) ou event bus (EventBridge). Cada opção adiciona um fornecedor e uma camada de observabilidade.

## Decisão

Usar **Vercel Cron** (incluso no plano Pro, US$ 20/mês) diretamente, declarando os jobs em `vercel.json`. Nenhuma fila externa é introduzida no MVP.

```json
{
  "crons": [
    { "path": "/api/cron/scan",    "schedule": "*/5 * * * *" },
    { "path": "/api/cron/live",    "schedule": "*/2 * * * *" },
    { "path": "/api/cron/hot",     "schedule": "*/15 * * * *" },
    { "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }
  ]
}
```

Regras de implementação:

- Cada Route Handler declara `maxDuration` compatível (scan: 300 s, live: 60 s, hot: 30 s, cleanup: 60 s)
- Autenticação via header `Authorization: Bearer ${CRON_SECRET}`
- Pipelines **idempotentes** — UNIQUE constraints em `opportunities`, `alerts`, `live_alerts` garantem que rodar o mesmo ciclo duas vezes não duplica dados
- **Lotes** — scan processa até 20 termos por invocação; termos restantes entram no próximo ciclo (5 min depois)
- **Isolamento de erros** — falha em um marketplace ou plataforma não bloqueia as outras
- **Sem retry automático** — o próximo ciclo é o próprio retry natural

## Alternativas Consideradas

- **QStash (Upstash)** → descartada por ser over-engineering para o MVP; não há necessidade de fan-out, delayed messages ou retry configurável
- **AWS SQS + Lambda** → descartada pelo custo de adicionar AWS ao stack de fornecedores e pelo setup IaC
- **Redis/Upstash como fila** → descartada pela ausência de volume que justifique (usuários projetados < 2 000)
- **GitHub Actions schedule** → descartada pela menor integração com a Vercel e pelo limite de runners gratuitos; também exigiria secrets duplicados

## Consequências

**Positivas:**

- Zero custo adicional: Vercel Cron incluso no plano Pro
- Observabilidade unificada nos logs das próprias Vercel Functions
- Idempotência via DB elimina a necessidade de dead-letter queue
- Deploy dos jobs é parte do deploy do app: não há estado fora do repositório

**Negativas:**

- **Sem retry enfileirado** — se uma function falhar completamente, só tentamos novamente no próximo tick (perda máxima: 1 ciclo)
- **Sem priorização** — todas as execuções de um mesmo job têm mesmo peso
- Limite de 100 jobs por projeto no plano Pro (sobra bastante para o MVP)
- Scan longo precisa respeitar `maxDuration: 300` — termos excedentes caem para o próximo ciclo

**Neutras:**

- Caso o volume cresça, migrar para QStash/fila é trabalho incremental — a idempotência já garante reprocessamento seguro

## Referências

- Pipelines detalhados: `docs/agents/03-architecture.md` (seção Pipelines)
- Proteção de endpoints cron: `docs/agents/07-security.md`
- `vercel.json` planejado: `docs/agents/05-development-workflow.md`

> Todo ADR deve ter no máximo uma página.
