# 13-resources.md: Recursos e Glossário

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [01-project-overview.md](01-project-overview.md) | [02-technology-stack.md](02-technology-stack.md)

## Visão Geral

Glossário de termos do domínio, links para documentação externa e referências úteis para o desenvolvimento do Avisus.

## Glossário

| Termo | Definição |
|-------|-----------|
| **Oportunidade** | Oferta detectada pelo scanner com desconto relevante (≥ min_discount_pct) |
| **Margem líquida** | Lucro estimado após taxas do marketplace de revenda, em percentual do custo de aquisição |
| **Custo de aquisição** | Preço do produto + frete estimado |
| **margin_best** | Maior margem líquida entre todos os canais de revenda disponíveis |
| **Quality badge** | Classificação visual da oportunidade: exceptional (≥40%), great (≥25%), good (≥15%) |
| **HOT** | Flag booleano — top 30% de margin_best entre oportunidades ativas |
| **Scanner** | Pipeline que varre marketplaces buscando ofertas correspondentes aos interesses dos usuários |
| **Live Monitor** | Pipeline que detecta início de transmissões ao vivo de vendedores favoritos |
| **Interesse** | Termo de busca cadastrado pelo revendedor (ex: "parafusadeira", "Nike Air Max") |
| **Vendedor favorito** | Perfil de vendedor em Shopee/TikTok monitorado para alertas de live |
| **Plano** | Nível de assinatura: `free`, `starter`, `pro` |
| **RLS** | Row Level Security — policies PostgreSQL que restringem acesso por `auth.uid()` |
| **BFF** | Backend For Frontend — Route Handlers do Next.js servindo como API intermediária |
| **Keyset pagination** | Paginação por cursor (`detected_at` + `id`) ao invés de OFFSET |
| **ScrapingBee** | Serviço externo de scraping com JS rendering e proxies gerenciados |
| **pg_trgm** | Extensão PostgreSQL para busca por similaridade textual |
| **Feature flag** | Variável de ambiente que habilita/desabilita funcionalidade em runtime |
| **Dismissed** | Oportunidade marcada como "não tenho interesse" pelo revendedor (ocultada do dashboard) |
| **Bought** | Oportunidade marcada como "comprei" pelo revendedor |
| **Silence** | Horário configurado pelo revendedor para não receber notificações push |

## Siglas

| Sigla | Significado |
|-------|-----------|
| ML | Mercado Livre |
| Magalu | Magazine Luiza |
| MVP | Minimum Viable Product |
| PRD | Product Requirements Document |
| RLS | Row Level Security |
| BFF | Backend For Frontend |
| SSR | Server-Side Rendering |
| LGPD | Lei Geral de Proteção de Dados |
| CTA | Call To Action |
| FAB | Floating Action Button |
| HOT | Indicador "Em Alta" (top 30% margem) |

## Documentação Externa

### Frameworks e Bibliotecas

| Recurso | URL |
|---------|-----|
| Next.js 15 App Router | https://nextjs.org/docs/app |
| React 19 | https://react.dev/ |
| Tailwind CSS | https://tailwindcss.com/docs |
| TanStack Query v5 | https://tanstack.com/query/latest |
| Zod | https://zod.dev/ |
| Cheerio | https://cheerio.js.org/docs/intro |

### Serviços

| Recurso | URL |
|---------|-----|
| Supabase Docs | https://supabase.com/docs |
| Supabase + Next.js | https://supabase.com/docs/guides/auth/quickstarts/nextjs |
| Stripe Subscriptions | https://stripe.com/docs/billing/subscriptions |
| Telegram Bot API | https://core.telegram.org/bots/api |
| ScrapingBee | https://www.scrapingbee.com/documentation/ |
| Mercado Livre API | https://developers.mercadolivre.com.br/ |
| IBGE Localidades | https://servicodados.ibge.gov.br/api/docs/localidades |

### Observabilidade e Testes

| Recurso | URL |
|---------|-----|
| Sentry (Next.js) | https://docs.sentry.io/platforms/javascript/guides/nextjs/ |
| Vitest | https://vitest.dev/ |
| Playwright | https://playwright.dev/ |

### Plataformas de Live

| Recurso | URL |
|---------|-----|
| Shopee Brasil | https://shopee.com.br/ |
| TikTok Live | https://www.tiktok.com/live |

## Documentos Internos

| Documento | Caminho | Descrição |
|-----------|---------|-----------|
| PRD | `.tasks/avisus-mvp/prd.md` | Requisitos de produto completos |
| Tech Spec | `.tasks/avisus-mvp/tech-spec.md` | Especificação técnica detalhada (DDL, contratos, desvios) |
| Design System | `docs/design-system.md` | Paleta, tipografia, componentes visuais |
| Protótipo | `src/prototype.jsx` | UI completa com mock data (~5.200 linhas JSX) |

## Custo Operacional

| Serviço | Plano | Custo/mês |
|---------|-------|-----------|
| Vercel | Pro | $20 |
| ScrapingBee | Freelance | $49 |
| Supabase | Free | $0 |
| Stripe | Pay-as-you-go | $0 fixo |
| Telegram | Gratuito | $0 |
| Sentry | Developer | $0 |
| **Total** | | **~$69 (~R$ 380)** |

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [12-troubleshooting.md](12-troubleshooting.md)*
