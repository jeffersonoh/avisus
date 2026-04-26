<!-- markdownlint-disable MD024 -->
# Changelog

Todas as mudanças relevantes do Avisus são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e o projeto adota [Controle de Versão Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado

- `docs/deploy-checklist.md` com checklist objetivo de pre e pos deploy na Vercel
- `src/instrumentation.ts`, `src/instrumentation-client.ts` e `src/app/global-error.tsx` para alinhar Sentry ao fluxo atual do Next.js App Router

### Alterado

- Documentacao atualizada para refletir o estado real do codebase Next.js (comandos, env vars, cron schedules e integracoes)
- `next.config.ts` atualizado para opcoes atuais do SDK Sentry (`sourcemaps` e `webpack.treeshake.removeDebugLogging`)

### Removido

- Arquivos legados de configuracao Sentry: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

### Planejado

- Evoluir observabilidade (instrumentacao e alertas operacionais) apos estabilizacao de producao
- Expandir cobertura de testes E2E para fluxos de cron e webhook

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
