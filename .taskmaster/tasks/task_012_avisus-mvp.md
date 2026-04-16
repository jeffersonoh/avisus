# Task ID: 12

**Title:** Migrar design system para componentes Tailwind reutilizáveis

**Status:** pending

**Dependencies:** 10

**Priority:** high

**Description:** Converter Badge, Toggle, Chip, StatCard, BottomSheet, Toast, AppIcon e MiniSparkline do protótipo para componentes modulares com Tailwind.

**Details:**

Contexto:
- Equivalente a T-030 (tasks.md). Elimina CSS inline e unifica visual conforme `docs/design-system.md`.

Escopo:
- Componentes em `src/components/`: `Badge.tsx`, `Toggle.tsx`, `Chip.tsx`, `StatCard.tsx`, `BottomSheet.tsx`, `Toast.tsx`, `AppIcon.tsx`, `MiniSparkline.tsx`.
- Props tipadas; variantes via `class-variance-authority` ou combinação de classes Tailwind.

Fora de escopo:
- Integração em features (feita em cada feature module).

Implementação:
- Arquivos/módulos: `src/components/*.tsx`, `src/components/index.ts`.
- Regras e validações: sem CSS inline; dark mode via `dark:` em todas variantes.

Critérios de pronto:
- Visual equivalente ao protótipo em dark/light.
- Storybook opcional, não obrigatório para MVP.

**Test Strategy:**

Cenários de teste:
- [ ] Cada componente renderiza em dark e light.
- [ ] Toggle controlado e não-controlado funcionam.
- [ ] BottomSheet abre/fecha com animação.

Validações técnicas:
- [ ] Sem `style={{}}` com valores fixos no JSX.
- [ ] Props booleanas têm defaults documentados.

## Subtasks

### 12.1. Implementar Componente Badge com Tailwind e CVA

**Status:** pending  
**Dependencies:** None  

Criar o componente Badge.tsx reutilizável, convertendo o protótipo para Tailwind CSS. Deve suportar variantes de cor e tamanho, além dos modos claro e escuro.

**Details:**

Criar o arquivo `src/components/Badge.tsx`. Utilizar `class-variance-authority` (CVA) para gerenciar as variantes de estilo (ex: `default`, `success`, `danger`). As propriedades (props) devem ser tipadas com TypeScript. Implementar suporte para modo escuro usando o prefixo `dark:` do Tailwind.

### 12.2. Implementar Componente Toggle com Tailwind

**Status:** pending  
**Dependencies:** None  

Desenvolver o componente Toggle.tsx para alternância de estados (on/off). Deve ser estilizado com Tailwind, suportar tema escuro e funcionar como componente controlado e não-controlado.

**Details:**

Criar o arquivo `src/components/Toggle.tsx`. Implementar a lógica de estado interno para o modo não-controlável e aceitar props `checked` e `onChange` para o modo controlável. Estilizar os estados `checked` e `unchecked`, incluindo o modo `dark:`.

### 12.3. Implementar Componente Chip com Tailwind e CVA

**Status:** pending  
**Dependencies:** None  

Criar o componente Chip.tsx para exibir informações compactas ou tags. Deve incluir variantes de estilo, suporte a um ícone opcional e uma ação de remoção.

**Details:**

Criar o arquivo `src/components/Chip.tsx`. Usar CVA para variantes de cor e tamanho. Permitir a passagem de um ícone (componente) e uma função `onRemove` para exibir um botão de fechar. Garantir a estilização completa para o modo `dark:`.

### 12.4. Implementar Componente StatCard com Tailwind

**Status:** pending  
**Dependencies:** None  

Desenvolver o componente StatCard.tsx para exibir métricas e estatísticas. O componente deve ser flexível para acomodar título, valor, ícone e uma mudança percentual.

**Details:**

Criar o arquivo `src/components/StatCard.tsx`. Estruturar o componente com slots ou props para título, valor principal, ícone e um indicador de variação (ex: `+5%`). Estilizar com Tailwind, incluindo todas as variações necessárias para o modo escuro.

### 12.5. Implementar Componente BottomSheet com Tailwind e Animações

**Status:** pending  
**Dependencies:** None  

Criar o componente BottomSheet.tsx que desliza da parte inferior da tela. Deve gerenciar seu estado de abertura/fechamento e incluir animações de transição suaves.

**Details:**

Criar `src/components/BottomSheet.tsx`. Usar transições CSS do Tailwind ou uma biblioteca como `framer-motion` para a animação de entrada e saída. O componente deve ser controlado por uma prop `isOpen` e chamar um callback `onClose`.

### 12.6. Implementar Componente Toast para Notificações

**Status:** pending  
**Dependencies:** None  

Desenvolver o componente Toast.tsx para exibir notificações breves e auto-expiráveis. Deve suportar diferentes tipos (sucesso, erro, info) e ser gerenciado por um contexto global.

**Details:**

Criar `src/components/Toast.tsx` e um provedor/hook para gerenciar a fila de toasts. Usar CVA para as variantes de tipo (`success`, `error`, `warning`). Incluir animação de entrada/saída e estilização para o modo `dark:`.

### 12.7. Implementar Componente AppIcon para Ícones SVG

**Status:** pending  
**Dependencies:** None  

Criar um componente AppIcon.tsx genérico para renderizar ícones SVG a partir de um conjunto pré-definido. Deve permitir a customização de tamanho e cor via props.

**Details:**

Criar `src/components/AppIcon.tsx`. O componente deve aceitar uma prop `name` para selecionar o ícone e encaminhar `className` para permitir estilização com Tailwind (ex: `w-4 h-4 text-gray-500 dark:text-gray-400`).

### 12.8. Implementar Componente MiniSparkline para Gráficos Compactos

**Status:** pending  
**Dependencies:** None  

Desenvolver o componente MiniSparkline.tsx para exibir pequenos gráficos de linha, como os usados em cartões de estatísticas, utilizando SVG e Tailwind.

**Details:**

Criar `src/components/MiniSparkline.tsx`. O componente receberá um array de números como dados e irá gerar um `path` SVG para desenhar a linha. A cor e a espessura da linha devem ser customizáveis via `className`.
