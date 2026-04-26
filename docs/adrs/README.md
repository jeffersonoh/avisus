# Decisões Arquiteturais (ADRs)

Este diretório registra as decisões arquiteturais relevantes do Avisus. Cada arquivo segue o formato ADR (Architecture Decision Record): contexto, decisão, alternativas consideradas e consequências.

Para entender o conceito, consulte [adr.github.io](https://adr.github.io/). Novas decisões arquiteturais devem ser registradas como ADR **antes** de serem implementadas.

## Índice

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| [001](001_arquitetura_serverless_first.md) | Arquitetura serverless-first com Vercel + Supabase | Aceita | 2026-04-16 |
| [002](002_supabase_como_auth_db_rls.md) | Supabase como Auth + Banco + RLS | Aceita | 2026-04-16 |
| [003](003_migracao_nextjs_app_router.md) | Migração do protótipo Vite/React para Next.js 15 | Aceita | 2026-04-16 |
| [004](004_scrapingbee_para_magazine_luiza.md) | ScrapingBee para scraping de Magazine Luiza | Aceita | 2026-04-16 |
| [005](005_vercel_cron_sem_fila.md) | Vercel Cron direto, sem fila externa no MVP | Aceita | 2026-04-16 |
| [006](006_telegram_como_canal_primario.md) | Telegram como canal primário de notificação no MVP | Aceita | 2026-04-16 |
| [007](007_modelo_freemium_com_enforcement_backend.md) | Modelo freemium com enforcement exclusivamente no backend | Aceita | 2026-04-16 |
| [008](008_tailwind_css_no_lugar_de_css_inline.md) | Tailwind CSS 4 no lugar de CSS inline do protótipo | Aceita | 2026-04-16 |
| [009](009_apify_para_live_monitor.md) | Apify para Live Monitor (Shopee/TikTok) | Aceita | 2026-04-19 |
| [010](010_scrapingbee_para_mercado_livre.md) | ScrapingBee para scanner do Mercado Livre | Aceita | 2026-04-19 |
| [011](011_notificacoes_web_via_supabase_realtime.md) | Notificações web e badge de não-lidos via Supabase Realtime | Aceita | 2026-04-21 |

## Convenções

- **Nomenclatura:** `NNN_titulo_curto.md`, numeração sequencial a partir de 001
- **Tamanho:** cada ADR ocupa no máximo uma página
- **Status:** `Proposta`, `Aceita`, `Reprovada` ou `Substituída por ADR-NNN`
- **Imutabilidade:** ADRs aceitas não são editadas; mudanças de rumo geram nova ADR que substitui a anterior
- **Idioma:** português do Brasil
