# Runbook de Release — Avisus

Este runbook deve ser seguido a cada release em staging e produção.
Para troubleshooting de incidentes, consulte [docs/agents/12-troubleshooting.md](agents/12-troubleshooting.md).

---

## Checklist Pré-Deploy

Execute antes de fazer push para `main` ou abrir o deploy no painel Vercel.

### Banco de Dados

- [ ] Migration testada localmente com `npx supabase db push --dry-run`
- [ ] Script de rollback SQL preparado em `supabase/migrations/` (se a migration for destrutiva)
- [ ] `npm run db:types` executado e tipos atualizados no PR

### Código

- [ ] `npm run build` passa sem erros
- [ ] `npm run typecheck` verde (zero erros TypeScript)
- [ ] `npm run lint` verde
- [ ] `npm test` verde (suite unitária)
- [ ] `npm run test:integration` verde (requer `npm run db:start`)
- [ ] `npm run test:e2e` verde contra ambiente local

### Variáveis de Ambiente

- [ ] Novas env vars adicionadas ao painel Vercel (staging e produção separados)
- [ ] Variáveis com `NEXT_PUBLIC_*` verificadas — nenhuma expõe secret
- [ ] `.env.local.example` atualizado se houver nova variável

### Comunicação

- [ ] Time / stakeholders avisados do horário do deploy se houver downtime esperado
- [ ] Changelog ou descrição do PR descrevendo o impacto ao usuário

---

## Checklist Pós-Deploy

Execute imediatamente após o deploy ser promovido (Vercel → Production).

### Autenticação e Onboarding

- [ ] Signup com e-mail funciona e envia e-mail de confirmação
- [ ] Login com e-mail funciona
- [ ] Onboarding completo: interesses → região → canais → dashboard
- [ ] Perfil salvo no Supabase com `onboarded = true`

### Scanner e Oportunidades

- [ ] Dashboard exibe oportunidades reais (ou estado vazio correto)
- [ ] Scanner ML retorna dados via scraping gerenciado (`/api/cron/scan` manual se necessario)
- [ ] Scanner Magalu retorna dados via ScrapingBee (ou `MAGALU_SCRAPE_MODE=disabled` com degradação graceful)
- [ ] HOT recalculando a cada 15 min (`/api/cron/hot` manual se necessário)
- [ ] Interesses: limite FREE (5) bloqueando corretamente

### Alertas Telegram

- [ ] Telegram entregando alertas em < 10 min após oportunidade detectada
- [ ] Limite 5 alertas/dia FREE respeitado, CTA de upgrade aparece
- [ ] Horário de silêncio enfileirando corretamente (não descarta)

### Live Monitor

- [ ] Live Monitor detecta início de live Shopee em < 2 min
- [ ] Alerta Telegram entregue com link direto para a live
- [ ] Horário de silêncio descarta alertas de live (não enfileira)
- [ ] Limite FREE (5 alertas/dia) conta ofertas + lives em conjunto
- [ ] Link `/api/live-click/{id}` redireciona e registra `clicked_at`

### Stripe

- [ ] Checkout Stripe funcional com as chaves e `price IDs` corretas do ambiente
- [ ] Webhook recebido e `profile.plan` atualizado após pagamento
- [ ] Downgrade/cancelamento reflete no plano em até 1 min

### Perfil e UX

- [ ] Cidades IBGE carregam no step de região do onboarding
- [ ] Feedback "Salvo" visível após salvar perfil
- [ ] LGPD visível e aceite registrado
- [ ] Vendedores favoritos: CRUD funcionando com limites por plano (3/15/∞)
- [ ] Ações "Comprei" / "Não tenho interesse" no modal de detalhe funcionando
- [ ] Badge de qualidade (exceptional/great/good) exibido nos cards e alertas

### Observabilidade

- [ ] Sentry recebendo eventos (disparar erro proposital em `/api/debug-sentry` se existir)
- [ ] Nenhum PII (email, telefone, token) visível nos breadcrumbs do Sentry
- [ ] Vercel Logs sem erros 5xx inesperados

### Segurança

- [ ] RLS: acesso cruzado entre usuários bloqueado
  - `profiles`, `interests`, `alerts`, `favorite_sellers`, `user_opportunity_status`
- [ ] Lighthouse mobile score > 80

---

## Plano de Rollback

Use quando um bug crítico for encontrado em produção após o deploy.

### App (Vercel)

1. Acesse o painel Vercel → **Deployments**
2. Localize o deploy anterior (estável)
3. Clique em **Redeploy** → **Use existing build**
4. Aguarde o deploy ser promovido para produção (~1 min)
5. Verifique o checklist pós-deploy nos itens afetados

### Banco de Dados

Se a migration foi destrutiva (DROP, ALTER com perda de dados):

1. Identifique o script de rollback em `supabase/migrations/` (sufixo `_rollback.sql` ou instrução no comentário da migration)
2. Conecte ao banco:
   ```bash
   psql $DATABASE_URL
   ```
3. Execute o script de rollback manualmente
4. Valide com `npm run test:integration` contra o banco restaurado
5. Faça re-deploy da versão do app compatível com o schema revertido

> **Nota:** Se não houver script de rollback, avalie forward-fix (nova migration corretiva) em vez de reverter o schema.

### Feature Flag como Saída de Emergência

Antes de um rollback completo, considere desativar a feature via flag no painel Vercel:

| Problema | Flag |
|----------|------|
| Scanner Magalu quebrando | `MAGALU_SCRAPE_MODE=disabled` |
| Live Monitor com falhas | `ENABLE_SHOPEE_LIVE=false` ou `ENABLE_TIKTOK_LIVE=false` |
| Alertas Telegram com bug | `ENABLE_TELEGRAM_ALERTS=false` |

Consulte [docs/agents/12-troubleshooting.md](agents/12-troubleshooting.md) para lista completa de flags e mitigações.

---

## Referências

- [Guia do Desenvolvedor](guia-do-desenvolvedor.md) — setup local e comandos diários
- [Troubleshooting](agents/12-troubleshooting.md) — riscos, feature flags e mitigações
- [Coding Standards](agents/04-coding-standards.md) — convenções de código
- [Security](agents/07-security.md) — RLS, auth, LGPD
