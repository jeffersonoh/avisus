<!-- markdownlint-disable MD024 -->
# Changelog

Todas as mudanças relevantes do Avisus são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e o projeto adota [Controle de Versão Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado

- Estrutura inicial de documentação técnica: `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/guia-do-desenvolvedor.md` e `docs/adrs/` com 8 ADRs cobrindo decisões do MVP
- Decisões arquiteturais registradas: serverless-first, Supabase, migração Next.js, ScrapingBee, Vercel Cron, Telegram, freemium e Tailwind (ADR-001 a ADR-008)

### Planejado

- Migração do protótipo Vite/React 19 para Next.js 15 + TypeScript strict
- Integração Supabase (Auth + Postgres + RLS) com geração de tipos
- Scanner de Mercado Livre e Magazine Luiza com cálculo de margem
- Live Monitor (Shopee + TikTok) com alertas Telegram
- Stripe Checkout para planos STARTER e PRO

## [0.1.0] - 2026-04-12

### Adicionado

- Protótipo funcional da aplicação em `src/prototype.jsx` (~5.200 linhas JSX)
- Design system aplicado (Montserrat, paleta Navy/Teal/Lime/Purple, modo dark via `[data-theme]`)
- Telas implementadas no protótipo: Login, Onboarding, Dashboard, Interesses, Alertas, Favoritos, Perfil, Planos
- Componentes compartilhados: `Badge`, `Toggle`, `Chip`, `StatCard`, `AppIcon`, `BottomSheet`, `Toast`, `MiniSparkline`
- Script de controle do Vite em `scripts/vite-ctl.mjs` (`npm run start|stop|restart`)
- Módulo `docs/agents/` com 13 arquivos temáticos para colaboração com assistentes de IA
- Documento de design system em `docs/design-system.md`
- PRD e Tech Spec do MVP em `.tasks/avisus-mvp/`

### Tecnologias

- React 19.2.5, React DOM 19.2.5
- Vite 8.0.8
- Node.js ≥ 20

[Unreleased]: #unreleased
[0.1.0]: #010---2026-04-12
