# Task ID: 11

**Title:** Criar `loading.tsx` e `error.tsx` por rota crítica

**Status:** done

**Dependencies:** 10

**Priority:** medium

**Description:** Adicionar skeletons de Suspense e páginas de erro por rota (dashboard, onboarding, interesses, alertas, favoritos, perfil) conforme metas de performance.

**Details:**

Contexto:
- Equivalente a T-022 (tasks.md). Evita tela em branco durante SSR/fetch e melhora LCP percebido.

Escopo:
- `loading.tsx` com skeletons adequados em: `dashboard`, `onboarding`, `interesses`, `alertas`, `favoritos`, `perfil`, `planos`.
- `error.tsx` correspondente com CTA "tentar novamente" e link para suporte.

Fora de escopo:
- Instrumentação de Sentry (T-103).

Implementação:
- Arquivos/módulos: `src/app/(app)/**/loading.tsx`, `src/app/(app)/**/error.tsx`.
- Regras e validações: skeleton não deve "piscar" para fetches ≤ 200ms (usar delay/suspense boundary adequado).

Critérios de pronto:
- Ao fazer SSR com rede lenta, cada rota exibe skeleton coerente.
- Erro simulado exibe `error.tsx` com botão de retry.

**Test Strategy:**

Cenários de teste:
- [ ] Throttle de rede mostra skeleton, nunca tela em branco.
- [ ] Lançar erro em Server Component renderiza `error.tsx`.

Validações técnicas:
- [ ] `useTransition` / Suspense boundary configurados.
- [ ] `error.tsx` marcado com `'use client'` conforme Next 15 exige.

## Subtasks

### 11.1. Implementar `loading.tsx` com Skeletons para Rotas Críticas

**Status:** done  
**Dependencies:** None  

Criar os arquivos `loading.tsx` para as rotas principais (`dashboard`, `interesses`, `alertas`), implementando componentes de skeleton que evitem layout shift e melhorem a percepção de performance durante o carregamento de dados.

**Details:**

A implementação deve seguir as convenções do Next.js App Router. Os skeletons devem ser visualmente alinhados com o layout final da página para evitar CLS (Cumulative Layout Shift). Focar nas rotas: `dashboard`, `interesses`, e `alertas`.

### 11.2. Criar `error.tsx` com Funcionalidade de 'Tentar Novamente'

**Status:** done  
**Dependencies:** None  

Implementar os arquivos `error.tsx` para as rotas da aplicação, fornecendo uma interface de erro clara para o usuário com uma chamada para ação (CTA) de 'Tentar novamente' e um link para o suporte.

**Details:**

Criar um componente de erro genérico reutilizável e arquivos `error.tsx` específicos para cada rota crítica. O componente deve ser um Client Component ('use client'). A funcionalidade 'Tentar novamente' deve re-renderizar o segmento da rota.
