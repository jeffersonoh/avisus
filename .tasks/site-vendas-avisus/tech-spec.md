# Tech Spec — Site de Vendas Avisus

## Contexto

- PRD: [`prd.md`](./prd.md)
- Problema: a rota pública `/` ainda exibe uma página técnica de base do MVP em `src/app/page.tsx`, mas o produto precisa de uma home comercial que explique o Avisus, destaque o PRO e converta visitantes para cadastro.
- Estado atual: o projeto usa Next.js 15 App Router, React 19, TypeScript strict, Supabase Auth, Stripe para checkout autenticado, design system em `src/app/globals.css` e rotas públicas existentes em `/login` e `/registro`.

Será implementado um site público de vendas na rota `/`, com conteúdo estático versionado no código, CTAs para rotas públicas existentes e instrumentação via Vercel Analytics. A implementação não cria novas funcionalidades de produto nem altera regras da área autenticada.

## Escopo Técnico

Será modificado:

- `src/app/page.tsx`: substituir placeholder pela landing pública.
- `src/app/layout.tsx`: adicionar Vercel Analytics e revisar metadata global.
- `package.json` e `package-lock.json`: adicionar `@vercel/analytics`.

Será criado:

- `src/features/marketing/content.ts`: conteúdo estático, planos, depoimentos, FAQs e eventos de analytics.
- `src/features/marketing/SalesLandingPage.tsx`: composição principal da landing.
- `src/features/marketing/PublicPlanComparison.tsx`: cards públicos de FREE, STARTER e PRO, separado de `PlanComparison` autenticado.
- `src/features/marketing/MarketingAnalytics.tsx`: Client Component para tracking de CTAs e visualização da seção de planos.
- `src/__tests__/features/marketing/SalesLandingPage.test.tsx`: testes de comportamento da landing.

Não será alterado:

- `(auth)/login/page.tsx`, `(auth)/registro/page.tsx`, onboarding, dashboard, alertas, perfil, favoritos, planos internos e checkout autenticado.
- Modelo de dados Supabase, migrations, RLS ou Stripe webhook.
- `src/features/plans/PlanComparison.tsx`, exceto se uma futura refatoração for explicitamente aprovada.

## Arquitetura e Design

### Visão Geral da Solução

A rota `/` continuará sendo um Server Component (`HomePage`) e renderizará `<SalesLandingPage />`. A landing será uma árvore majoritariamente server-rendered, com apenas tracking de eventos em Client Components pequenos. Dados de copy, planos e FAQ ficarão em constantes tipadas em `content.ts` para evitar espalhar texto comercial no JSX.

Fluxo principal:

```text
Visitante -> GET / -> src/app/page.tsx
  -> SalesLandingPage
    -> Header público: Logo + Login (/login) + CTA PRO (/registro?plan=pro)
    -> Hero, funcionalidades, planos, prova social, FAQ, CTA final
    -> MarketingAnalytics registra cliques/scroll com Vercel Analytics
```

Decisões:

- CTA principal **Assinar PRO** aponta para `/registro?plan=pro`.
- CTA STARTER aponta para `/registro?plan=starter`.
- CTA FREE/secundário aponta para `/registro`.
- Entrada de login aponta para `/login`.
- `PublicPlanComparison` não usará `CheckoutButton`, `usePlanCheckout` ou `createCheckoutSession`, pois checkout atual exige usuário autenticado.
- O design seguirá `docs/agents/14-design-system.md`: inline styles para tokens visuais, Tailwind para estrutura/responsividade e `AppIcon` para ícones.

### Componentes Envolvidos

| Componente | Tipo | Ação | Descrição |
|------------|------|------|-----------|
| `src/app/page.tsx` | Next.js Page / Server Component | Modificar | Renderizar a landing comercial em `/` no lugar do placeholder técnico. |
| `src/app/layout.tsx` | Root Layout | Modificar | Adicionar `<Analytics />` de `@vercel/analytics/next` e ajustar metadata padrão. |
| `src/features/marketing/SalesLandingPage.tsx` | React Server Component | Criar | Compor seções públicas: header, hero, benefícios, funcionalidades, planos, prova social, FAQ e CTA final. |
| `src/features/marketing/PublicPlanComparison.tsx` | React Server Component | Criar | Renderizar cards públicos de planos usando conteúdo estático e links de cadastro. |
| `src/features/marketing/MarketingAnalytics.tsx` | React Client Component | Criar | Expor wrappers de CTA e observer da seção de planos para eventos externos. |
| `src/features/marketing/content.ts` | Módulo TypeScript | Criar | Centralizar copy, URLs, cards, depoimentos, FAQ, planos e nomes de eventos. |
| `src/__tests__/features/marketing/SalesLandingPage.test.tsx` | Vitest + Testing Library | Criar | Validar render, CTAs, login, planos, FAQ e claims críticos. |

### Contratos e Interfaces

Tipos em `src/features/marketing/content.ts`:

```ts
export type MarketingPlanId = "free" | "starter" | "pro";

export type MarketingCtaEvent =
  | "hero_assinar_pro_click"
  | "header_login_click"
  | "plan_free_click"
  | "plan_starter_click"
  | "plan_pro_click"
  | "final_assinar_pro_click"
  | "plans_section_view";

export type MarketingLink = {
  label: string;
  href: string;
  event: MarketingCtaEvent;
};

export type PublicPlanCard = {
  id: MarketingPlanId;
  name: string;
  price: string;
  period: string;
  subtitle: string;
  accent: string;
  featured?: boolean;
  features: string[];
  cta: MarketingLink;
};
```

Contratos de navegação:

- Header `Entrar`: `href="/login"`, evento `header_login_click`.
- Hero `Assinar PRO`: `href="/registro?plan=pro"`, evento `hero_assinar_pro_click`.
- Plano FREE: `href="/registro"`, evento `plan_free_click`.
- Plano STARTER: `href="/registro?plan=starter"`, evento `plan_starter_click`.
- Plano PRO: `href="/registro?plan=pro"`, evento `plan_pro_click`.

Contrato de analytics:

```ts
track(eventName, {
  source: "marketing_home",
  href,
  plan,
});
```

`MarketingAnalytics.tsx` deve importar `track` de `@vercel/analytics` apenas em Client Component. A visualização da seção de planos deve usar `IntersectionObserver` e disparar `plans_section_view` no máximo uma vez por carregamento de página.

## Modelo de Dados

Não há mudança de modelo de dados.

```sql
-- Nenhum DDL necessário.
-- Não criar tabelas, índices, constraints, migrations ou alterações de RLS.
```

## Integrações

### Vercel Analytics

- Adicionar dependência `@vercel/analytics`.
- Importar `Analytics` de `@vercel/analytics/next` em `src/app/layout.tsx`.
- Renderizar `<Analytics />` dentro de `<body>`, após `{children}`.
- Habilitar Analytics no projeto Vercel antes de validar dados em produção.
- Usar eventos customizados para cliques em CTAs e visualização da seção de planos.

### Rotas Internas

- `/login`: entrada para usuários existentes, sem alteração da página atual.
- `/registro`: cadastro gratuito.
- `/registro?plan=starter` e `/registro?plan=pro`: preservam intenção comercial para uso futuro; nesta entrega, a página de registro pode ignorar o parâmetro sem quebrar o fluxo.
- `/planos`: não deve ser usada como CTA primário público porque hoje exige autenticação e redireciona para `/login` quando não há usuário.

## Segurança

- Não haverá formulários novos, coleta de dados pessoais ou chamadas autenticadas na landing.
- Links para `/registro` e `/login` usam rotas internas existentes e não devem incluir dados sensíveis em query string.
- O parâmetro `plan` em `/registro?plan=pro|starter` é apenas intenção de marketing; não deve conceder plano, desconto ou bypass de checkout.
- Conteúdo estático não deve usar `dangerouslySetInnerHTML`.
- Claims comerciais devem ser escritos como apoio à decisão e exemplos, sem promessa de lucro garantido.
- A landing deve manter textos de garantia, cancelamento e ausência de lucro garantido conforme PRD.

## Performance

- A página deve ser renderizada majoritariamente no servidor, sem data fetching externo no carregamento inicial.
- Evitar dependências visuais pesadas e imagens externas. Usar logos/assets locais existentes em `public/assets/` quando necessário.
- `MarketingAnalytics.tsx` deve ser o único Client Component novo, mantendo baixo JavaScript no cliente.
- `IntersectionObserver` deve ser registrado uma vez e desconectado após disparar `plans_section_view`.
- Metadata deve ser adequada para compartilhamento e SEO básico, sem criar páginas editoriais.

## Internacionalização (i18n)

- O projeto não usa i18n no MVP; todos os textos serão em português do Brasil.
- Textos de UI ficam centralizados em `src/features/marketing/content.ts`.
- Valores monetários podem ser estáticos (`R$49/mês`, `R$99/mês`) ou formatados com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` se houver números em código.
- Não criar bundles PT/EN/ES.

## Tratamento de Erros

- A landing não depende de chamadas remotas para renderizar; falhas de analytics não devem bloquear navegação ou render.
- Se `track` falhar ou estiver inativo em desenvolvimento, os links continuam funcionando normalmente.
- Eventos de analytics devem ser best-effort e não devem exibir erro ao usuário.
- Fallback visual: se imagem de logo não carregar, o `alt="Avisus"` deve preservar identificação textual.

## Plano de Testes

Testes automatizados:

- Criar `src/__tests__/features/marketing/SalesLandingPage.test.tsx`.
- Mockar `next/link` conforme padrão existente nos testes.
- Mockar `@/components/AppIcon`.
- Mockar `@vercel/analytics` para validar chamadas de `track` quando houver interação com CTAs.

Cenários mínimos:

- Renderiza headline comercial e proposta de valor em `/`.
- Exibe CTA principal **Assinar PRO** com `href="/registro?plan=pro"`.
- Exibe entrada de login com `href="/login"`.
- Exibe planos FREE, STARTER e PRO com preços e limites principais.
- Exibe FAQ com garantia, cancelamento, funcionamento de alertas e ausência de lucro garantido.
- Clique nos CTAs dispara evento de analytics correspondente sem impedir navegação.

Comandos de verificação:

- `npm test -- SalesLandingPage`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| CTA para `/registro?plan=pro` não ser consumido pelo registro | Alta | Médio | Documentar como intenção de marketing nesta entrega e manter cadastro funcional mesmo ignorando o parâmetro. |
| Reutilizar tela interna de planos acoplaria checkout autenticado à página pública | Média | Alto | Criar `PublicPlanComparison` separado, sem `CheckoutButton`. |
| Analytics externo adicionar JavaScript excessivo | Baixa | Médio | Usar apenas `@vercel/analytics` e um Client Component pequeno. |
| Claims estáticos ficarem divergentes do produto | Média | Médio | Centralizar conteúdo em `content.ts` e revisar contra `PlanComparison` antes do rollout. |
| Página longa prejudicar mobile | Média | Médio | Usar seções escaneáveis, cards responsivos e testes de links/conteúdo crítico. |

## Alternativas Consideradas

- **Reutilizar `src/features/plans/PlanComparison.tsx` na home pública:** descartado porque o componente depende de estado de plano atual e checkout autenticado, enquanto a landing deve converter visitantes não logados.
- **Abrir checkout Stripe diretamente a partir do site público:** descartado porque `createCheckoutSession` exige usuário autenticado e profile existente.
- **Criar rota `/vendas` e manter `/` atual:** descartado por decisão de produto de substituir integralmente a home pública.
- **Não adicionar analytics nesta entrega:** descartado porque o PRD mede cliques, scroll e conversão, e o usuário escolheu analytics externo.

## Plano de Rollout

Pré-requisitos:

- Instalar `@vercel/analytics`.
- Habilitar Vercel Analytics no projeto Vercel.
- Revisar conteúdo estático de `content.ts` contra preços/claims atuais.

Ordem de implementação:

1. Criar `src/features/marketing/content.ts` com dados tipados.
2. Criar `MarketingAnalytics.tsx` com tracking best-effort.
3. Criar `PublicPlanComparison.tsx`.
4. Criar `SalesLandingPage.tsx`.
5. Substituir `src/app/page.tsx` para renderizar `SalesLandingPage`.
6. Adicionar `<Analytics />` em `src/app/layout.tsx`.
7. Criar testes de UI.
8. Rodar verificações.

Rollback:

- Reverter `src/app/page.tsx` para o placeholder anterior se a landing causar falha crítica.
- Remover `<Analytics />` de `src/app/layout.tsx` se analytics causar erro de build.
- Como não há migration, rollback não envolve banco de dados.

Checklist pós-deploy:

- `/` abre sem autenticação.
- CTAs PRO/STARTER/FREE levam para `/registro` com query quando aplicável.
- Login leva para `/login`.
- `/planos` autenticado permanece inalterado.
- Vercel Analytics registra page views e eventos em produção.

## Referências

- PRD: [`./prd.md`](./prd.md)
- Design system: [`docs/agents/14-design-system.md`](../../docs/agents/14-design-system.md)
- Arquitetura: [`docs/agents/03-architecture.md`](../../docs/agents/03-architecture.md)
- Padrões de código: [`docs/agents/04-coding-standards.md`](../../docs/agents/04-coding-standards.md)
- Testes: [`docs/agents/15-testing-standards.md`](../../docs/agents/15-testing-standards.md)
- Página atual: [`src/app/page.tsx`](../../src/app/page.tsx)
- Registro: [`src/app/(auth)/registro/page.tsx`](../../src/app/(auth)/registro/page.tsx)
- Login: [`src/app/(auth)/login/page.tsx`](../../src/app/(auth)/login/page.tsx)
- Planos autenticados: [`src/features/plans/PlanComparison.tsx`](../../src/features/plans/PlanComparison.tsx)
- Vercel Analytics: `@vercel/analytics/next` no App Router, com `<Analytics />` no root layout e eventos customizados via `track`.
