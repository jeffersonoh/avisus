# Tarefas de implementação — Avisus MVP

Documento gerado a partir de [`prd.md`](./prd.md) e [`tech-spec.md`](./tech-spec.md). Ordem sugerida respeita dependências técnicas; tarefas na mesma fase podem ser paralelizadas quando indicado.

**Legenda de prioridade:** P0 = bloqueante para MVP; P1 = necessário para ship completo; P2 = polish / observabilidade.

**Referência de desvios PRD ↔ Tech:** ver seção *Desvios* em `tech-spec.md` (D1–D9) — tarefas abaixo citam onde aplicável.

---

## Fase 0 — Preparação e contratos

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-000 | Repositório Next.js 15 + TypeScript strict + Tailwind | P0 | Inicializar app em `avisus/` (ou raiz, conforme decisão) com App Router, `tsconfig` strict, Tailwind e tokens base alinhados a [`docs/design-system.md`](../../docs/design-system.md). | `npm run build` passa; estrutura de pastas conforme tech spec § Estrutura de diretórios. |
| T-001 | Variáveis de ambiente e `.env.local.example` | P0 | Documentar todas as env vars da tech spec (Supabase, Stripe, Telegram, ML, ScrapingBee, cron, flags, Sentry). | Arquivo exemplo sem segredos reais; README ou comentário aponta origem de cada chave. |
| T-002 | `plan-limits.ts` e convenção de percentuais | P0 | Implementar `PLAN_LIMITS` (FREE/STARTER/PRO) e documentar que `*_pct` é sempre percentual (15 = 15%), nunca fração. | Constantes batem com tech spec; export reutilizado por scanner e Server Actions. |

---

## Fase 1 — Supabase: schema, RLS e tipos

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-010 | Migrations SQL completas | P0 | Aplicar DDL da tech spec: extensão `pg_trgm`, tabelas, índices, constraints, triggers (`handle_new_user`, `set_updated_at`, `sync_profile_plan`). | `supabase db push` (ou equivalente) aplica sem erro; seed mínimo opcional para dev. |
| T-011 | Policies RLS | P0 | Habilitar RLS e policies conforme spec (profiles, interests, alerts, subscriptions, user_opportunity_status, favorite_sellers, live_alerts; leitura pública em opportunities/channel_margins/products/price_history/marketplace_fees). | Teste manual ou integração: usuário A não lê dados sensíveis de B. |
| T-012 | Funções SQL: `alerts_sent_today`, `refresh_hot_flags` | P0 | Implementar exatamente a semântica da spec (fuso `America/Sao_Paulo`; HOT = percentil 70 global — **D1**). | Consultas documentadas; HOT atualiza apenas `status = 'active'`. |
| T-013 | Tipos TypeScript gerados | P0 | `supabase gen types typescript` → `src/types/database.ts` (ou caminho adotado); script npm para regenerar. | CI ou doc local exige regenerar após migration. |
| T-014 | Clients Supabase (`@supabase/ssr`) | P0 | `createBrowserClient`, `createServerClient`, middleware de refresh de sessão Next.js. | Login persiste; rotas `(app)` protegidas. |

---

## Fase 2 — Autenticação e shell da aplicação

> **T-020 entregue:** páginas `/login` e `/registro`, Server Actions + Zod, callback `/auth/callback`, redirect por `profiles.onboarded` (`src/lib/auth/`, `src/app/(auth)/`, `src/app/auth/callback/`).
>
> **T-021 entregue:** `AppHeader`, `BottomNav`, `ThemeProvider` + `ThemeScript`, `darkMode: class`, placeholders das rotas principais (`src/components/`, `src/app/(app)/layout.tsx`).

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-020 | Páginas login e registro | P0 | Email/senha + Google OAuth; UI alinhada ao design system; redirect pós-auth. | Fluxo completo contra Supabase Auth (staging). |
| T-021 | Layout autenticado: header, bottom nav, tema | P0 | Migrar padrões do [`src/prototype.jsx`](../../src/prototype.jsx): shell mobile-first, dark/light via Tailwind. | Navegação entre rotas principais funcional. |
| T-022 | `loading.tsx` / `error.tsx` por rota crítica | P1 | Suspense + skeletons conforme spec de performance. | Rotas dashboard/onboarding não exibem tela em branco. |

---

## Fase 3 — Componentes compartilhados e feature modules (UI)

> **T-032 entregue:** feature `interests/` com CRUD de termos, validação Zod (2-60 chars), deduplicação case-insensitive, empty state com sugestões e bloqueio por limite de plano com CTA upgrade (`src/features/interests/`, `src/app/(app)/interesses/page.tsx`).
>
> **T-033 entregue:** feature `notifications/` com lista unificada de alertas (`alerts` + `live_alerts`), configuração de canais (Telegram/Web) e persistência de horário de silêncio em `profiles` com feedback "Salvo!" (`src/features/notifications/`, `src/app/(app)/alertas/page.tsx`).
>
> **T-034 entregue:** feature `favorites/` com cadastro e remoção de vendedores Shopee/TikTok por URL validada via Zod, extração/normalização de `platform` + `seller_username`, lista com status offline/ao vivo e bloqueio por limite de plano com CTA de upgrade (`src/features/favorites/`, `src/app/(app)/favoritos/page.tsx`).
>
> **T-035 entregue:** feature `profile/` com formulário de dados essenciais, integração IBGE para cidades por UF com cache (TanStack Query `staleTime: 24h`), barra de completude RF-48, indicação LGPD e card de plano com CTA dinâmico Upgrade/Planos (`src/features/profile/`, `src/lib/ibge.ts`, `src/app/(app)/perfil/page.tsx`).
>
> **T-036 entregue:** feature `plans/` com comparativo FREE/STARTER/PRO, integração com Stripe Checkout via Server Action (`createCheckoutSession`) usando `STRIPE_PRICE_STARTER_MONTHLY`/`STRIPE_PRICE_PRO_MONTHLY`, criação de Stripe Customer quando necessário e metadata `user_id` na sessão/assinatura (`src/features/plans/`, `src/app/(app)/planos/page.tsx`, `README.md`).
>
> **T-037 entregue:** onboarding wizard em 3 passos (interesses → região IBGE → alertas/LGPD) com preservação de estado entre passos, bloqueio de conclusão sem interesse, Server Action `finishOnboarding` e atualização de `profiles.onboarded = true` com redirect final respeitando `?redirectTo=` (`src/features/onboarding/`, `src/app/onboarding/page.tsx`).
>
> **T-038 entregue:** página `perfil/margem` com alternância `average/custom`, inputs de taxas por canal (0–50 com validação Zod), recálculo client-side pela fórmula da Tech Spec usando helper dedicado e persistência em `profiles.resale_margin_mode`/`profiles.resale_fee_pct` via Server Action (`src/app/(app)/perfil/margem/page.tsx`, `src/features/profile/ResaleChannelsForm.tsx`, `src/features/profile/actions.ts`, `src/lib/scanner/margin-calculator.ts`).
>
> **T-040 entregue:** Server Actions de interesses (`createInterest`, `updateInterest`, `deleteInterest`) com validação Zod, enforcement de limite por plano no backend via `COUNT(active)` + `PLAN_LIMITS`, tratamento de duplicidade por índice único `LOWER(term)` e `revalidatePath('/interesses')`; hooks/UI passaram a consumir as actions e continuam exibindo CTA de upgrade em `LIMIT_REACHED` (`src/features/interests/actions.ts`, `src/features/interests/hooks.ts`, `src/features/interests/InterestList.tsx`).
>
> **T-041 entregue:** Server Actions de perfil (`updateProfile`, `updateAlertChannels`, `updateSilenceWindow`) com validação Zod para Telegram, telefone, UF/cidade e janela de silêncio `HH:mm`, atualização parcial no backend com retorno de `savedFields`; formulários de Perfil e Alertas passaram a salvar via actions autenticadas no servidor (`src/features/profile/actions.ts`, `src/features/profile/hooks.ts`, `src/features/notifications/hooks.ts`, `src/app/(app)/perfil/page.tsx`, `src/app/(app)/alertas/page.tsx`).
>
> **T-042 entregue:** Server Actions de favoritos (`addFavoriteSeller`, `removeFavoriteSeller`, `listFavoriteSellers`) com validação de URL Shopee/TikTok via helper compartilhado, normalização de `seller_username` em minúsculo, enforcement de limite por plano no backend e revalidação de rota; feature de Favoritos foi migrada para consumir as actions server-side e manter CTA de upgrade em `LIMIT_REACHED` (`src/features/favorites/actions.ts`, `src/features/favorites/hooks.ts`, `src/lib/scanner/live/url-parser.ts`, `src/app/(app)/favoritos/page.tsx`).
>
> **T-043 entregue:** enforcement de limites foi centralizado em helper reutilizável (`enforcePlanLimit`) para evitar duplicação e manter bloqueios consistentes no backend; Server Actions de interesses e favoritos passaram a usar a mesma fonte de verdade para retornar `LIMIT_REACHED` com plano atual lido de `profiles` (`src/lib/plan-enforce.ts`, `src/features/interests/actions.ts`, `src/features/favorites/actions.ts`).
>
> **T-050 entregue:** endpoint `/api/cron/scan` criado com `runtime = 'nodejs'`, `maxDuration = 300`, autenticação por header `Authorization: Bearer <CRON_SECRET>` e resposta placeholder `{ scanned, new_opportunities, alerts_sent }`; quando `ENABLE_SCANNER_CRON=false`, retorna `200` com `{ skipped: true }` mantendo contadores zerados (`src/app/api/cron/scan/route.ts`, `src/lib/cron/auth.ts`, `.env.local.example`, `README.md`).
>
> **T-051 entregue:** client do Mercado Livre implementado com refresh OAuth2 em cache de memória por invocação (`ML_CLIENT_ID`/`ML_CLIENT_SECRET`/`ML_REFRESH_TOKEN`), renovação antecipada do token e busca por termo tipada (`searchByTerm`) com timeout de 15s, retry em 5xx (até 2 tentativas de retry), fallback para `[]` em falhas recuperáveis e erro explícito em 401 persistente sem expor segredos (`src/lib/scanner/ml-auth.ts`, `src/lib/scanner/mercado-livre.ts`).
>
> **T-052 entregue:** client da Magazine Luiza implementado com flag `MAGALU_SCRAPE_MODE` (`disabled`/`managed`/`api`) e degradação graceful para `[]`; modo `managed` usa wrapper do ScrapingBee com timeout e tratamento de autenticação, parser Cheerio com seletores documentados (`external_id`, preços, desconto, `buy_url`, `image_url`) e retry 1x em falhas/timeout sem expor `SCRAPINGBEE_API_KEY` em logs (`src/lib/scanner/scraping-bee.ts`, `src/lib/scanner/magazine-luiza.ts`, `src/lib/scanner/magazine-luiza.test.ts`).
>
> **T-053 entregue:** módulo de margem do scanner implementado com `calculateMargin` (custo de aquisição + margem líquida por canal), seleção de `margin_best`/`margin_best_channel`, classificação `quality` por thresholds em constante dedicada e proteção contra divisão por zero; inclui cobertura unitária para cenários de great, margem negativa, melhor canal, limites de quality e `freight_free` (`src/lib/scanner/margin-calculator.ts`, `src/lib/scanner/constants.ts`, `src/lib/scanner/margin-calculator.test.ts`).
>
> **T-054 entregue:** pipeline `opportunity-matcher` implementado com throttle por plano via `scanIntervalMin`, buscas concorrentes em ML/Magalu com `Promise.allSettled`, deduplicação por `(marketplace, external_id)`, upsert de `products` + `price_history` + `opportunities` + `channel_margins`, matching secundário por trigram similarity (threshold `0.3`) e anti-duplicata de alertas por insert resiliente; endpoint `/api/cron/scan` passou a executar o pipeline real e retornar contadores da execução (`src/lib/scanner/opportunity-matcher.ts`, `src/lib/scanner/opportunity-matcher.test.ts`, `src/lib/supabase/service.ts`, `src/app/api/cron/scan/route.ts`).
>
> **T-055 entregue:** writers dedicados para `products` e `price_history` implementados em módulos próprios com operações em lote; `products` usa upsert por `(marketplace, external_id)` atualizando `last_price`/`last_seen_at`, e `price_history` grava snapshots apenas por `INSERT`, preservando `units_sold` quando informado; o `opportunity-matcher` passou a consumir esses writers para reduzir acoplamento e manter rastreabilidade histórica desde o dia 1 (`src/lib/scanner/writers/products.ts`, `src/lib/scanner/writers/price-history.ts`, `src/lib/scanner/writers/products.test.ts`, `src/lib/scanner/writers/price-history.test.ts`, `src/lib/scanner/opportunity-matcher.ts`).
>
> **T-056 entregue:** writer dedicado de `opportunities` + `channel_margins` implementado com upsert em lote e idempotência por constraints (`marketplace, external_id` e `opportunity_id, channel`), cálculo de `margin_best`/`margin_best_channel`/`quality` aplicado no payload de persistência e suporte a `expires_at`; `opportunity-matcher` passou a consumir o writer para centralizar a persistência de oportunidades e margens (`src/lib/scanner/writers/opportunities.ts`, `src/lib/scanner/writers/opportunities.test.ts`, `src/lib/scanner/opportunity-matcher.ts`).

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-030 | Design system em componentes | P0 | Migrar Badge, Toggle, Chip, StatCard, BottomSheet, Toast, AppIcon, MiniSparkline (Tailwind; sem CSS inline do protótipo). | Visual consistente com `docs/design-system.md`. |
| T-031 | Feature `dashboard/` — cards, modal, filtros | P0 | `ProductCard`, `ProductDetailModal`, `FilterPanel`, `OpportunityList`, hooks; dados ainda podem ser mock até T-040. | Filtros e ordenação conectáveis a querystring ou estado (preparar para Supabase). |
| T-032 | Feature `interests/` | P0 | CRUD UI + mensagens de limite (FREE: 5 termos). | Validação inline; empty states. |
| T-033 | Feature `notifications/` — página Alertas | P0 | Lista de alertas; configuração de canais e silêncio (**D7**). | Campos `silence_start` / `silence_end` persistidos em `profiles`. |
| T-034 | Feature `favorites/` — F14 | P0 | CRUD vendedores (URL Shopee/TikTok), lista com status offline/ao vivo (**RF-58**). | Limites 3 / 15 / ∞ por plano; validação Zod (URL + domínio). |
| T-035 | Feature `profile/` + IBGE | P0 | Formulário: nome, email, telefone opcional, UF/cidade via API IBGE, `telegram_username`, `alert_channels`, LGPD (**RF-45–51**). | Cidades carregam ao trocar UF (**CA-20**); feedback “Salvo”; card de plano com CTA Upgrade vs “Planos” para PRO (**CA-18**). |
| T-036 | Feature `plans/` + Stripe Checkout | P0 | Comparativo FREE/STARTER/PRO; botões abrem Checkout com `price_starter_monthly` / `price_pro_monthly`. | Fluxo test mode documentado. |
| T-037 | Onboarding wizard (3 passos) | P0 | Interesses → região → alertas/consentimento LGPD; marca `onboarded`. | Novo usuário completa em ≤ 3 passos (PRD fluxo). |
| T-038 | Página `perfil/margem` | P1 | Modo `average` vs `custom` para taxas de revenda; recálculo client-side conforme fórmula da spec. | UI indica “estimativa com taxas médias” vs “suas taxas”. |

---

## Fase 4 — BFF: Server Actions, validação e limites

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-040 | Server Actions: interests | P0 | Zod; checagem `COUNT(active)` vs `PLAN_LIMITS`; índice único `LOWER(term)`. | Erro `LIMIT_REACHED` tratado na UI com CTA upgrade. |
| T-041 | Server Actions: profile | P0 | Validação Telegram/WhatsApp (formato); atualização parcial; consentimento. | RF-47/48 atendidos. |
| T-042 | Server Actions: favorite_sellers | P0 | Limite por plano; normalização de username a partir de URL. | CA-22: quarto favorito no FREE bloqueado com mensagem clara. |
| T-043 | Enforcement de limites no backend | P0 | Toda mutação sensível revalida plano (interesses, favoritos, futuros endpoints). | Não confiar apenas no frontend. |

---

## Fase 5 — Scanner, margem e persistência

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-050 | `/api/cron/scan` — autenticação cron | P0 | Header `Authorization: Bearer CRON_SECRET`; 401 se inválido. | Documentado para Vercel Cron. |
| T-051 | Client Mercado Livre (API Afiliados) | P0 | OAuth refresh token; busca por termo; tratamento de falha isolada. | Token renovado antes de expirar; falha não aborta Magalu. |
| T-052 | Client Magazine Luiza | P0 | `MAGALU_SCRAPE_MODE`: `api` \| `managed` \| `disabled`; ScrapingBee + Cheerio; timeout e retry. | Modo `disabled` degrada sem derrubar scan. |
| T-053 | `margin-calculator.ts` (F03) | P0 | Custo aquisição = preço + frete; `channel_margins` com taxas de `marketplace_fees`; `margin_best` + `quality` thresholds em `constants.ts`. | Unidades testadas (Vitest) — ver Fase 9. |
| T-054 | `opportunity-matcher.ts` | P0 | Respeitar `last_scanned_at` + `scanIntervalMin` por plano (**D4**); dedup `UNIQUE (marketplace, external_id)`; match secundário `pg_trgm` ≥ 0.3; anti-duplicata `alerts`. | Documentar pipeline na response JSON do cron. |
| T-055 | Writer `products` + `price_history` | P0 | Inserir histórico a cada detecção (pré-F08). | Retenção delegada a cleanup (T-062). |
| T-056 | Upsert `opportunities` + `channel_margins` | P0 | ON CONFLICT; status active; campos freight/freight_free/image/buy_url. | Dashboard pode ler dados reais. |
| T-057 | `vercel.json` crons | P0 | Schedules: scan `*/5`, live `*/2`, hot `*/15`, cleanup `0 3 * * *` (ajustar TZ conforme deploy). | Crons aparecem no dashboard Vercel. |
| T-058 | Config `maxDuration` | P0 | scan 300s; live 30–60s conforme spec. | Build sem warning de runtime inválido. |

---

## Fase 6 — Notificações Telegram

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-060 | `alert-sender.ts` | P0 | Templates HTML oferta e live; fila simples; 3 tentativas; `attempts` + `failed`. | Mensagem contém campos RF-10 / RF-54. |
| T-061 | Silêncio e limites FREE | P0 | Ofertas: enfileirar `silenced` e entregar após silêncio (**CA-04**). Lives em silêncio: `skipped_silence`, **não** enfileirar (**D9**, **CA-24**). | `alerts_sent_today` inclui ofertas enviadas/lidas + lives `sent` (**CA-23**). |
| T-062 | Limite 5 alertas/dia FREE + CTA | P0 | Ao atingir limite: não enviar push; UI lista destaque upgrade (**CA-03**). | Contagem correta ofertas + lives. |
| T-063 | Validação Telegram `getChat` | P1 | Opcional no MVP se tempo curto; se implementado, validar @username. | Documentar se adiado. |
| T-064 | Flag `ENABLE_TELEGRAM_ALERTS` | P1 | Staging pode desligar envio real. | Logs indicam skip. |

---

## Fase 7 — Live monitor (F14)

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-070 | `shopee-live.ts` / `tiktok-live.ts` | P0 | Estratégia em camadas (API interna → ScrapingBee); delays 100–500ms; flags `ENABLE_SHOPEE_LIVE` / `ENABLE_TIKTOK_LIVE`. | Falha isolada por plataforma. |
| T-071 | `live-monitor.ts` + `/api/cron/live` | P0 | Transição `is_live` false→true dispara alerta; atualizar `favorite_sellers`; inserir `live_alerts`; até 50 sellers por invocação com rotação se >50. | **CA-21**: alerta &lt; 2 min após início (meta operacional). |
| T-072 | Stale `is_live` | P1 | Reset se `last_checked_at` &gt; 1h sem confirmação (conforme spec). | Evita estado “ao vivo” fantasma. |
| T-073 | Tracking `clicked_at` (opcional MVP) | P2 | Link instrumentado Telegram → endpoint que seta `clicked_at` (**D8**: sem UI métricas). | Dado persistido para uso futuro. |

---

## Fase 8 — HOT, cleanup e Stripe webhook

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-080 | `/api/cron/hot` | P0 | Chama `refresh_hot_flags()`. | Execução periódica sem erro. |
| T-081 | `/api/cron/cleanup` | P0 | Expira oportunidades; retenção `price_history` 90d; remove expiradas antigas; reset live stale se combinado aqui. | DB não cresce indefinidamente. |
| T-082 | `/api/stripe/webhook` | P0 | Verificar assinatura; eventos subscription; idempotência; atualiza `subscriptions` → trigger sync `profiles.plan`. | Testes com Stripe CLI ou mocks. |

---

## Fase 9 — Dashboard dados reais e UX MVP

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-090 | Dashboard SSR + paginação | P0 | Server Components + keyset (`detected_at`, `id`), page size 20; filtros RF-13/14 e ordenação (**D7**). | LCP alvo &lt; 2.5s mobile (meta). |
| T-091 | TanStack Query | P1 | Mutations e cache onde fizer sentido; `staleTime` 30s dashboard, 24h IBGE. | Sem refetch agressivo desnecessário. |
| T-092 | Badge HOT + quality | P0 | Exibir `hot` e `quality` nos cards e refletir em templates Telegram (**RF-32** parcial — HOT global **D1**). | Documentar limitação D1 na UI se necessário (“destaque nacional”). |
| T-093 | Bloqueios por plano na UI | P0 | FREE: sem tendências/score (F08/F10 fora — **D5/D6**); CTAs upgrade; PRO: “Planos” em vez de “Upgrade” (**CA-18**). | Paridade com matriz F06 do PRD dentro do escopo MVP tech spec. |
| T-094 | `min_discount_pct` | P2 | Scanner lê do perfil; UI não expõe (**D3**). | Campo existe e é usado; doc para futura UI. |

---

## Fase 10 — Qualidade, segurança e deploy

| ID | Título | Prioridade | Descrição | Critérios de aceite |
|----|--------|------------|-----------|---------------------|
| T-100 | Vitest: `margin-calculator`, `opportunity-matcher`, `plan-limits`, `live-monitor` | P1 | Cobrir casos da tech spec § Plano de Testes. | `npm test` verde no CI ou local obrigatório. |
| T-101 | Integração Supabase local | P1 | Cenários: onboarding, CRUD interesses, favoritos, webhook mock. | Documentação `supabase start`. |
| T-102 | Playwright: fluxo crítico | P1 | Cadastro → onboarding → dashboard (pode usar dados seed). | 1 fluxo mínimo verde. |
| T-103 | Sentry Next.js | P1 | `@sentry/nextjs` front + server; sem PII em breadcrumbs. | DSN apenas env. |
| T-104 | Checklist pós-deploy | P1 | Copiar checklist da tech spec para runbook interno. | Time pode marcar itens no release. |

---

## Rastreabilidade rápida PRD → tarefas

| PRD / RF | Tarefas principais |
|----------|-------------------|
| F01 interesses | T-032, T-040 |
| F02 scanner ML + Magalu | T-051, T-052, T-050, T-057 |
| F03 margem | T-053, T-056, T-038 |
| F04 Telegram + silêncio + limites | T-033, T-060–T-062 |
| F05 dashboard | T-031, T-090–T-092 |
| F06 planos | T-002, T-036, T-082, T-093 |
| F09 HOT | T-012, T-080, T-092 |
| F13 perfil + LGPD | T-035, T-041 |
| F14 lives | T-034, T-042, T-070–T-073 |
| F08 score / F10 tendências | Coleta T-055; UI score/tendências **fora** do MVP (**D5**, **D6**) |
| F07 região/frete avançado | Fora do escopo tech MVP — não listado |
| price_history (pré-F08) | T-055, T-081 |

---

## Notas para quem implementa

1. **Protótipo:** usar [`src/prototype.jsx`](../../src/prototype.jsx) como referência de UX, migrando para componentes modulares.
2. **Desvios conscientes:** HOT global (D1), sem preview de interesses (D2), `min_discount_pct` sem UI (D3), cron único 5 min com throttle por plano (D4), sem score/tendências na UI (D5–D6), silêncio+filtros no MVP (D7), métricas live só dados (D8), lives em silêncio descartadas (D9).
3. **Ordem crítica:** T-010 → T-014 → T-020 → T-050+T-051+T-053 → T-060 → T-090 → T-036+T-082.
