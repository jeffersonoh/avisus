# 05-development-workflow.md: Workflow de Desenvolvimento

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [02-technology-stack.md](02-technology-stack.md) | [04-coding-standards.md](04-coding-standards.md)

## Visão Geral

Workflow simplificado para solo dev. Pipeline único: push → Vercel build → deploy. Sem Docker em produção, sem GitHub Actions dedicado.

## Comandos de Desenvolvimento

### Setup Inicial

```bash
npm install
npm run db:start                 # Inicia Supabase local (Docker; ignora health check do vector se estiver flaky)
cp .env.local.example .env.local # Configurar variáveis de ambiente
npm run dev                      # Next.js dev server
```

### Comandos Diários

```bash
npm run dev                      # Dev server Next.js
npm run build                    # Build produção
npm start                        # Servir build local (next start)

# Supabase (na raiz do repositório)
npm run db:start                 # Iniciar banco local
npm run db:stop                  # Parar banco local
npm run db:status                # Ver URL, chaves e saúde dos containers
npm run db:types                 # Gerar tipos TypeScript
npx supabase db push             # Aplicar migrations (manual no MVP)

# Scanner (teste local)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/scan
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/live
```

### Scripts Auxiliares (protótipo)

O protótipo atual usa Vite com um script de controle:
```bash
npm run start                    # node scripts/vite-ctl.mjs start (background)
npm run stop                     # node scripts/vite-ctl.mjs stop
npm run restart                  # node scripts/vite-ctl.mjs restart
```
Esses scripts serão substituídos pelo `npm run dev` do Next.js após a migração.

## Ambientes

| Ambiente | App | DB | Cron |
|----------|-----|-----|------|
| **Local** | `next dev` (localhost:3000) | `npm run db:start` (Docker) | Trigger manual via curl |
| **Staging** | Vercel Preview (branch deploy) | Supabase project staging | Desativado (trigger manual) |
| **Produção** | `avisus.app` (Vercel Pro) | Supabase project prod | Ativo (vercel.json) |

## CI/CD

### Pipeline

```
git push main → Vercel Git Integration → Build → Deploy produção
git push branch → Vercel Preview Deploy (URL temporária)
```

- Sem GitHub Actions dedicado
- Sem Docker em produção
- DB migrations aplicadas manualmente: `supabase db push` antes do deploy; Vercel build valida que migrations aplicam sem erro

### Vercel Cron (vercel.json)

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

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=

# Telegram
TELEGRAM_BOT_TOKEN=

# Mercado Livre
ML_CLIENT_ID=
ML_CLIENT_SECRET=
ML_REFRESH_TOKEN=

# ScrapingBee
SCRAPINGBEE_API_KEY=
MAGALU_SCRAPE_MODE=managed  # api | managed | disabled

# Live Monitor
ENABLE_SHOPEE_LIVE=true
ENABLE_TIKTOK_LIVE=true

# Notificações
ENABLE_TELEGRAM_ALERTS=true     # false para staging/dev (não envia real)

# Stripe
STRIPE_LIVE_MODE=false          # true apenas após validação em produção

# Cron
CRON_SECRET=

# Observabilidade
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

**Regra:** variáveis `NEXT_PUBLIC_*` são expostas ao browser. Nunca prefixar secrets com `NEXT_PUBLIC_`.

## Testes

### Unitários (Vitest)

| Módulo | Cobertura alvo |
|--------|---------------|
| `margin-calculator.ts` | Todas combinações canal/taxa/frete |
| `opportunity-matcher.ts` | Match termos × categorias |
| `plan-limits.ts` | FREE/STARTER/PRO × todos os limites |
| `live-monitor.ts` | Transição is_live, silence, limite FREE |
| Componentes shared | Badge, Toggle, Chip, ProductCard |

### Integração (Supabase local)

- Onboarding → perfil salvo
- CRUD interesses + limites de plano
- CRUD vendedores favoritos + limites
- Ações bought/dismissed em user_opportunity_status
- UNIQUE constraints (alerts, opportunities)
- Webhook Stripe → upgrade de plano

### E2E (Playwright)

- Cadastro → Onboarding → Dashboard com dados
- Fluxo de pagamento Stripe (test mode)
- Envio de alerta Telegram (staging)

## Feature Flags

| Flag (env var) | Padrão | Efeito |
|------|--------|--------|
| `MAGALU_SCRAPE_MODE` | `managed` | `api` / `managed` / `disabled` |
| `ENABLE_SHOPEE_LIVE` | `true` | Habilita polling lives Shopee |
| `ENABLE_TIKTOK_LIVE` | `true` | Habilita polling lives TikTok |
| `ENABLE_TELEGRAM_ALERTS` | `true` | Desativa envio real (staging) |
| `STRIPE_LIVE_MODE` | `false` | Test mode até validação |

## Rollback

- **App:** Vercel mantém deploys anteriores; rollback 1 clique no dashboard
- **DB:** Migrations versionadas em `supabase/migrations/`; script de rollback SQL por migration

## Checklist Pós-Deploy

- [ ] Signup + login funcionando (email + Google)
- [ ] Onboarding completo → perfil salvo no Supabase
- [ ] Dashboard mostrando oportunidades reais do scanner
- [ ] Interesses: limite de 5 para FREE funciona
- [ ] Scanner ML retornando dados via API a cada 5 min (PRO)
- [ ] Scanner Magalu retornando dados via ScrapingBee (ou `MAGALU_SCRAPE_MODE=disabled` com graceful degradation)
- [ ] HOT recalculando a cada 15 min
- [ ] Telegram entregando alertas < 10 min
- [ ] Limite 5 alertas/dia FREE com CTA upgrade
- [ ] Horário de silêncio enfileirando corretamente
- [ ] Stripe checkout funcional (live mode)
- [ ] Perfil: IBGE carregando cidades, feedback "Salvo", LGPD visível, barra de completude (RF-48)
- [ ] Vendedores favoritos: CRUD funcionando com limites por plano (3/15/∞)
- [ ] Live monitor: detectando início de live Shopee em < 2 min
- [ ] Live monitor: alerta Telegram entregue com link direto para a live
- [ ] Live monitor: horário de silêncio descarta alertas de live (não enfileira)
- [ ] Live monitor: limite FREE (5 alertas/dia) conta ofertas + lives juntos
- [ ] Dashboard: ações "Comprei" / "Não tenho interesse" no modal de detalhe funcionando
- [ ] Dashboard: oportunidades dismissed ocultadas para o usuário
- [ ] Badge de qualidade (exceptional/great/good) exibido nos cards e alertas Telegram
- [ ] Lighthouse mobile > 80
- [ ] RLS: acesso cruzado entre usuários bloqueado (incluindo favorite_sellers e user_opportunity_status)

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [04-coding-standards.md](04-coding-standards.md) | Próximo: [06-domain-model.md](06-domain-model.md)*
