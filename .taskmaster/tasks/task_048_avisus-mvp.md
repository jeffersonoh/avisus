# Task ID: 48

**Title:** Badge HOT e quality nos cards e templates Telegram

**Status:** pending

**Dependencies:** 13, 34, 43

**Priority:** high

**Description:** Exibir `hot` e `quality` nos cards do dashboard e refletir em templates Telegram (RF-32 parcial — HOT global D1).

**Details:**

Contexto:
- Equivalente a T-092 (tasks.md). F09 + F03 (qualidade).

Escopo:
- Atualizar `ProductCard` para mostrar badge HOT (se `hot = true`) e chip de qualidade (exceptional/great/good).
- Template Telegram incluir indicador quando aplicável.
- Documentar limitação D1 na UI se necessário ("destaque nacional").

Fora de escopo:
- Recalcular HOT por dashboard filtrado (fora do MVP por D1).

Implementação:
- Arquivos/módulos: `src/features/dashboard/ProductCard.tsx`, `src/lib/scanner/telegram.ts`.
- Regras e validações: classes Tailwind por variante; acessibilidade (aria-label).

Critérios de pronto:
- Usuário vê HOT e quality nos cards e notificações.
- Documentação UI explica o escopo do HOT.

**Test Strategy:**

Cenários de teste:
- [ ] Oportunidade exceptional mostra chip roxo.
- [ ] Sem quality → nenhum chip.
- [ ] Telegram contém "Em alta" quando hot=true.

Validações técnicas:
- [ ] `quality` do banco = classe Tailwind mapeada.
- [ ] Sem duplicação de threshold entre UI e calculator.

## Subtasks

### 48.1. Atualizar ProductCard para exibir badges de 'HOT' e 'Quality'

**Status:** pending  
**Dependencies:** None  

Modificar o componente ProductCard.tsx para renderizar condicionalmente um badge para oportunidades 'HOT' e um chip de cor para o nível de 'quality' (exceptional, great, good).

**Details:**

Em 'src/features/dashboard/ProductCard.tsx', adicione lógica para mostrar um badge de destaque se 'hot' for verdadeiro e um chip de qualidade baseado no valor do campo 'quality', utilizando classes Tailwind para estilização.

### 48.2. Adicionar indicadores 'HOT' e 'Quality' aos templates do Telegram

**Status:** pending  
**Dependencies:** None  

Atualizar os templates de mensagem, provavelmente em 'alert-sender.ts' ou um arquivo relacionado, para incluir um texto ou emoji que indique quando uma oportunidade é 'HOT' ou seu nível de 'quality'.

**Details:**

No arquivo 'src/lib/scanner/alert-sender.ts', modifique a função que formata a mensagem de alerta para incluir prefixos como '🔥 EM ALTA' e 'Qualidade: Boa' quando os dados da oportunidade forem aplicáveis.
