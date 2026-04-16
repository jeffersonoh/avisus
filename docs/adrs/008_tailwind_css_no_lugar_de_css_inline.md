# ADR 008: Tailwind CSS 4 no lugar de CSS inline do protótipo

## Status

Aceita

## Data

2026-04-16

## Contexto

O protótipo (`src/prototype.jsx`) aplica estilos de três formas distintas:

- Variáveis CSS globais em `:root` e `[data-theme="dark"]` (paleta Montserrat, Navy/Teal/Lime/Purple)
- Atributos `style={{ ... }}` inline em JSX
- Objetos JavaScript que geram strings de CSS concatenadas

Essa abordagem funcionou para validar o design system (documentado em `docs/design-system.md`), mas gera problemas ao migrar para Next.js 15 + React Server Components:

- Server Components não suportam `useState` para alternância de tema
- Estilos inline impedem purge de CSS morto e aumentam o bundle
- Sem sistema de design tokens tipado, o tema dark é difícil de manter consistente
- Falta padronização de espaçamento, tipografia responsiva e breakpoints

## Decisão

Adotar **Tailwind CSS 4+** como único sistema de estilização da stack alvo.

- **Tokens de cor** do design system exportados no `tailwind.config.ts` (theme extend): Navy `#1B2E63`, Teal `#1D8F95`, Lime `#B7DB47`, Purple `#7B42C9` e escalas neutras
- **Dark mode** via estratégia `class`: `<html class="dark">` alternado por toggle no layout raiz; todas as classes condicionais em `dark:`
- **Tipografia** Montserrat configurada em `tailwind.config.ts` (display + body); `globals.css` importa a fonte
- **Componentes shared** (`Badge`, `Toggle`, `Chip`, `StatCard`, `AppIcon`, `BottomSheet`, `Toast`, `MiniSparkline`) em `src/components/` reutilizam classes Tailwind — sem CSS modules, sem styled-components
- **Responsive mobile-first** com breakpoints `sm:`, `md:`, `lg:`
- **Sem CSS inline em componentes**. Exceção única: estilos dinâmicos calculados em runtime (ex.: largura de uma barra de progresso baseada em dado)

`globals.css` centraliza a importação do Tailwind e quaisquer tokens remanescentes (ex.: fontes externas, reset customizado).

## Alternativas Consideradas

- **Styled-components / Emotion** → descartada por incompatibilidade plena com React Server Components e por adicionar runtime CSS-in-JS desnecessário
- **CSS Modules** → descartada por exigir manutenção de arquivo `.module.css` por componente e não oferecer design tokens tipados
- **Vanilla Extract** → descartada pela curva de aprendizado e menor ecossistema para o MVP
- **Manter CSS inline + custom properties** → descartada pelo débito técnico acumulado e por não resolver a limitação em Server Components

## Consequências

**Positivas:**

- Um único sistema de estilização em toda a aplicação, consistente e tipável
- Dark mode com `class` strategy funciona em Server Components sem hydration mismatch
- Purge automático mantém o CSS enviado ao browser enxuto
- Design tokens centralizados em `tailwind.config.ts` — mudanças de paleta em um único lugar
- Integração nativa com o design system já documentado em `docs/design-system.md`

**Negativas:**

- Reescrita visual de todas as telas do protótipo — trabalho incremental mas obrigatório
- Classes Tailwind podem ficar longas em componentes complexos; mitigado extraindo subcomponentes
- Curva inicial para quem não usa Tailwind — pequena, dada a natureza utility-first

**Neutras:**

- Tailwind 4 estabiliza a nova engine e simplifica a configuração; caso surja regressão, fallback para Tailwind 3.x é trivial

## Referências

- Design system completo: `docs/design-system.md`
- Padrões de código (seção Tailwind CSS): `docs/agents/04-coding-standards.md`
- Migração protótipo → produção: `docs/agents/03-architecture.md`
- Tech Spec: `.tasks/avisus-mvp/tech-spec.md`

> Todo ADR deve ter no máximo uma página.
