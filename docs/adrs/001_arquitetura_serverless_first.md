# ADR 001: Arquitetura serverless-first com Vercel + Supabase

## Status

Aceita

## Data

2026-04-16

## Contexto

O Avisus é desenvolvido por um único desenvolvedor, com prazo de 4 semanas para o MVP e orçamento operacional máximo de ~US$ 69/mês. A aplicação precisa entregar:

- Frontend web (dashboard, onboarding, perfil, planos)
- BFF com autenticação, CRUD e webhook Stripe
- Pipeline de scanner que consome APIs externas (Mercado Livre, Magazine Luiza) a cada poucos minutos
- Live Monitor que faz polling de status de transmissões (Shopee, TikTok) a cada 2 minutos
- Armazenamento durável de oportunidades, alertas e histórico de preços

Operar VMs, contêineres ou processos long-running exigiria esforço de provisionamento, deploy, observabilidade e custo fixo incompatíveis com um solo dev entregando MVP.

## Decisão

Toda a aplicação roda como **funções serverless** na Vercel (Pro), integradas a serviços gerenciados. Nenhum servidor persistente é mantido pela equipe.

- **Vercel Pro ($20/mês):** hospeda Next.js 15 (frontend + Route Handlers + Server Actions + Scanner Functions) e o Vercel Cron (até 100 jobs, 800 s de timeout)
- **Supabase (Free no MVP):** Postgres 15+ com Row Level Security, Auth com JWT e geração automática de tipos TypeScript
- **ScrapingBee ($49/mês):** delega JS rendering e anti-bot para Magazine Luiza sem operar browser local
- **Stripe, Telegram, Shopee/TikTok Live, IBGE, Mercado Livre API:** integrações HTTP diretas a partir das funções

Scanner e Live Monitor são acionados por Vercel Cron, stateless, idempotentes e protegidos por `CRON_SECRET`.

## Alternativas Consideradas

- **VM na Fly.io/Railway rodando Playwright e cron interno** → descartada por custo fixo, complexidade de ops (Dockerfile, healthchecks, logs) e risco de single-point-of-failure sem HA
- **AWS Lambda + RDS + Cognito** → descartada pelo overhead de IaC, latência de cold start com VPC e fragmentação de serviços para um solo dev
- **Auto-host completo (Docker Compose em VPS)** → descartada por carga operacional incompatível com o prazo e por exigir monitoramento próprio

## Consequências

**Positivas:**

- Custo previsível (~US$ 69/mês no MVP) e escalável sob demanda
- Zero administração de infraestrutura: sem patching, sem capacidade ociosa, sem pipelines de CI dedicados
- Deploy em 1 comando (`git push`) com preview automático por branch
- Integração nativa Vercel + Supabase (auth, logs, envs)

**Negativas:**

- Limite de 300 s por function força lotes de 20 termos no scanner (termos excedentes são processados no ciclo seguinte)
- Dependência de múltiplos fornecedores (Vercel, Supabase, ScrapingBee, Stripe, Telegram)
- Sem processos long-running — WebSocket e workers dedicados ficam fora do MVP
- Cold start em funções raramente chamadas (mitigado por cron frequente)

**Neutras:**

- A arquitetura é heterogênea por design: cada serviço resolve uma responsabilidade específica

## Referências

- Tech Spec: `.tasks/avisus-mvp/tech-spec.md`
- Arquitetura detalhada: `docs/agents/03-architecture.md`
- Stack completa: `docs/agents/02-technology-stack.md`
- Troubleshooting e riscos operacionais: `docs/agents/12-troubleshooting.md`

> Todo ADR deve ter no máximo uma página.
