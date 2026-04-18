# AGENTS.md: Avisus

> **Confiança da Análise:** Alta — baseada em PRD completo, Tech Spec detalhada e protótipo funcional (~5.200 linhas JSX)

Este arquivo é o índice principal para colaboração entre humanos e Assistentes de IA neste repositório. A documentação detalhada está dividida em arquivos focados dentro de `docs/agents/`.

## Governança do Documento

- **Owner:** Solo dev (Jefferson Henrique)
- **Status:** ativo
- **Última revisão:** 2026-04-16
- **Impacto de mudança:** alto — afeta todo o módulo docs/agents

## Navegação Rápida

| Seção | Arquivo | Descrição |
|-------|---------|-----------|
| **Visão Geral** | [01-project-overview.md](01-project-overview.md) | Propósito, domínio, personas e escopo MVP |
| **Stack Tecnológica** | [02-technology-stack.md](02-technology-stack.md) | Next.js 15, Supabase, Stripe, Tailwind, ScrapingBee |
| **Arquitetura** | [03-architecture.md](03-architecture.md) | Serverless-first, App Router, Scanner pipeline, Live Monitor |
| **Padrões de Escrita** | [04-coding-standards.md](04-coding-standards.md) | TypeScript strict, convenções React, inline styles + CSS vars, Zod |
| **Workflow** | [05-development-workflow.md](05-development-workflow.md) | Comandos dev, CI/CD Vercel, ambientes, migrations |
| **Modelo de Domínio** | [06-domain-model.md](06-domain-model.md) | Schema PostgreSQL, RLS, planos freemium, margem |
| **Segurança** | [07-security.md](07-security.md) | Auth Supabase, RLS, LGPD, validação Zod, CRON_SECRET |
| **Performance** | [08-performance.md](08-performance.md) | Metas Web Vitals, paginação keyset, scanner batching |
| **Integrações** | [09-integrations.md](09-integrations.md) | ML API, ScrapingBee, Telegram, Shopee/TikTok Live, Stripe, IBGE |
| **Gestão de Dados** | [10-data-management.md](10-data-management.md) | Schema, price_history, retenção, cleanup cron |
| **Colaboração com IA** | [11-ai-collaboration.md](11-ai-collaboration.md) | Regras para assistentes, contexto do projeto |
| **Troubleshooting** | [12-troubleshooting.md](12-troubleshooting.md) | Feature flags, fallbacks, riscos e mitigações |
| **Recursos** | [13-resources.md](13-resources.md) | Glossário, links externos, referências |
| **Design System** | [14-design-system.md](14-design-system.md) | CSS vars, cards, inputs, botões, animações, AppIcon, Gravatar |
| **Testes** | [15-testing-standards.md](15-testing-standards.md) | Vitest + @testing-library, mocks, checklist obrigatório por tela |

---

## Visão Geral

### Identidade do Projeto

- **Nome:** Avisus (avisus.app)
- **Tipo:** Aplicação web SPA + BFF serverless
- **Domínio:** Inteligência de preços para revendedores brasileiros
- **Formato:** TypeScript (Next.js 15 App Router) + PostgreSQL (Supabase)
- **Modelo de negócio:** Freemium — FREE / STARTER / PRO

### Quick Start

```bash
# Instalar dependências
npm install

# Iniciar Supabase local (requer Docker; use na raiz do repositório)
npm run db:start

# Iniciar dev server
npm run dev

# Gerar tipos do banco
npm run db:types
```

### Informações Críticas

- **Entrypoint principal:** `src/app/page.tsx` (redirect → /dashboard ou /login)
- **Scanner pipeline:** `src/lib/scanner/` (Vercel Cron Functions)
- **Live Monitor:** `src/lib/scanner/live/` (polling Shopee/TikTok a cada 2 min)
- **Padrão arquitetural:** Serverless-first (Vercel Functions + Supabase)
- **Maturidade:** MVP (protótipo validado, migração em andamento)
- **Idioma da UI:** Português do Brasil (sem i18n)
- **Custo operacional:** ~$69/mês (Vercel Pro $20 + ScrapingBee $49 + serviços gratuitos)

---

## Como Usar Esta Documentação

### Para o Desenvolvedor

1. Comece por [01-project-overview.md](01-project-overview.md) para entender o domínio
2. Revise a stack em [02-technology-stack.md](02-technology-stack.md) e a arquitetura em [03-architecture.md](03-architecture.md)
3. Antes de implementar, consulte [04-coding-standards.md](04-coding-standards.md) e [06-domain-model.md](06-domain-model.md)
4. Para integrações externas, consulte [09-integrations.md](09-integrations.md)

### Para Assistentes de IA

1. Leia este índice para contexto geral
2. Consulte [03-architecture.md](03-architecture.md) para entender onde o código vive
3. Sempre aplique [04-coding-standards.md](04-coding-standards.md) + [07-security.md](07-security.md) + [11-ai-collaboration.md](11-ai-collaboration.md)
4. Para qualquer tela ou componente novo, consulte [14-design-system.md](14-design-system.md) — não compare com o protótipo
5. Antes de alterar schema ou integrações, consulte [06-domain-model.md](06-domain-model.md) e [09-integrations.md](09-integrations.md)

---

## Mapa da Documentação

### Leitura Essencial

1. [01-project-overview.md](01-project-overview.md) — O que é o Avisus e para quem
2. [02-technology-stack.md](02-technology-stack.md) — Tecnologias e serviços gerenciados
3. [03-architecture.md](03-architecture.md) — Serverless-first, diretórios, pipelines
4. [04-coding-standards.md](04-coding-standards.md) — Convenções TypeScript + React + inline styles
5. [14-design-system.md](14-design-system.md) — CSS vars, componentes, padrões visuais

### Antes de Contribuir

- [04-coding-standards.md](04-coding-standards.md) — Padrões de código
- [14-design-system.md](14-design-system.md) — **Obrigatório para qualquer tela nova** — cards, inputs, botões, cores, animações
- [15-testing-standards.md](15-testing-standards.md) — **Obrigatório: toda tela entregue deve ter testes** — Vitest, mocks, checklist
- [05-development-workflow.md](05-development-workflow.md) — Setup, comandos, CI/CD
- [07-security.md](07-security.md) — RLS, auth, LGPD, validação
- [11-ai-collaboration.md](11-ai-collaboration.md) — Diretrizes para assistentes de IA

### Referência Técnica

- [06-domain-model.md](06-domain-model.md) — Modelo de dados e lógica de negócio
- [08-performance.md](08-performance.md) — Metas e estratégias de performance
- [09-integrations.md](09-integrations.md) — APIs externas e serviços
- [10-data-management.md](10-data-management.md) — Schema, retenção, cleanup

### Suporte Operacional

- [12-troubleshooting.md](12-troubleshooting.md) — Problemas conhecidos e feature flags
- [13-resources.md](13-resources.md) — Glossário e links

---

## Notas Importantes

### Antes de Começar

- [ ] Entenda a arquitetura serverless-first em [03-architecture.md](03-architecture.md)
- [ ] Revise as convenções TypeScript strict em [04-coding-standards.md](04-coding-standards.md)
- [ ] Consulte o design system em [14-design-system.md](14-design-system.md) antes de criar qualquer tela
- [ ] Crie testes de interface conforme [15-testing-standards.md](15-testing-standards.md) — obrigatório para toda tela nova
- [ ] Leia as regras de IA em [11-ai-collaboration.md](11-ai-collaboration.md)
- [ ] Verifique requisitos de segurança/RLS em [07-security.md](07-security.md)
- [ ] Entenda o modelo de planos em [06-domain-model.md](06-domain-model.md)

### Regras para Código Gerado por IA

- Deve seguir [04-coding-standards.md](04-coding-standards.md) — TypeScript strict, sem `any`
- Deve respeitar [07-security.md](07-security.md) — RLS, Zod validation, sem hardcode de secrets
- Deve usar o Supabase client correto (server vs browser) conforme [03-architecture.md](03-architecture.md)
- Não deve modernizar frameworks ou adicionar dependências sem justificativa explícita
- Deve manter compatibilidade com o modelo freemium (verificar limites de plano no backend)

### Estado Atual do Projeto

O projeto está em transição de **protótipo** (React 19 + Vite 8, `src/prototype.jsx` com ~5.200 linhas) para **produção** (Next.js 15 + TypeScript + Supabase). Esta documentação reflete o estado **planejado** conforme a Tech Spec aprovada. Consulte `.tasks/avisus-mvp/tech-spec.md` para a especificação completa.

---

## Status de Validação

- **Base documental:** PRD + Tech Spec + Design System + protótipo funcional
- **Validação de links:** todos os links internos resolvem para arquivos existentes neste diretório
- **Implicação:** documentação de alta confiança para guiar implementação do MVP

### Histórico de Mudanças

| Data | Alteração | Impacto |
|------|-----------|---------|
| 2026-04-16 | Criação inicial do módulo docs/agents/ | alto |

---

**Gerado por:** Assistente de IA
**Última atualização:** 2026-04-16

Para detalhes completos, abra os arquivos individuais neste diretório.

<!-- es-cli-runtime-references:start -->
## Referencias de runtime da CLI `es`

> Bloco gerado automaticamente pela CLI `es`.
> Em conflito de instrucoes, o canonico `AGENTS.md` prevalece.

- `.cursor/rules/`
- `.claude/rules/`
- `.opencode/rules/`

<!-- es-cli-runtime-references:end -->
