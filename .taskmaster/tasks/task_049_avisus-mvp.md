# Task ID: 49

**Title:** Bloqueios por plano na UI e CTA dinâmico (Upgrade vs Planos)

**Status:** pending

**Dependencies:** 10, 18, 46

**Priority:** high

**Description:** FREE sem tendências/score (F08/F10 fora — D5/D6); CTAs upgrade no FREE/STARTER; PRO mostra "Planos" (CA-18).

**Details:**

Contexto:
- Equivalente a T-093 (tasks.md). Paridade com matriz F06 do PRD dentro do escopo.

Escopo:
- Revisar toda a UI para esconder/exibir features com base em `profiles.plan`.
- CTA de upgrade em pontos estratégicos (alertas atingido, favoritos atingido, tentativa de usar tendências).
- Substituir "Upgrade" por "Planos" quando plano = PRO.

Fora de escopo:
- Tendências/sazonalidade/volume (D5/D6).

Implementação:
- Arquivos/módulos: `src/components/AppHeader.tsx`, `src/features/dashboard/*`, `src/features/notifications/UpgradeCTA.tsx`.
- Regras e validações: fonte única de verdade sobre o plano (hook `usePlan()`).

Critérios de pronto:
- FREE não acessa recursos bloqueados.
- PRO não vê CTA de upgrade.

**Test Strategy:**

Cenários de teste:
- [ ] FREE vê CTA Upgrade em 3 pontos.
- [ ] PRO vê somente "Planos".
- [ ] STARTER vê CTA Upgrade para PRO.

Validações técnicas:
- [ ] Props derivadas de `plan` único.
- [ ] Nenhum bypass via CSS.

## Subtasks

### 49.1. Criar hook `usePlan()` para centralizar o estado do plano do usuário

**Status:** pending  
**Dependencies:** None  

Desenvolver um hook React `usePlan` que acessa o perfil do usuário para fornecer o plano de assinatura atual (FREE, STARTER, PRO). Este hook será a fonte única de verdade para toda a lógica de planos na UI.

**Details:**

O hook deve ser implementado em `src/hooks/usePlan.ts`. Ele deve obter os dados do perfil do usuário a partir de um contexto de autenticação ou chamada de dados e retornar o valor da propriedade `plan`, além de funções auxiliares como `isFree`, `isPro`.

### 49.2. Bloquear/ocultar features da UI com base no plano do usuário

**Status:** pending  
**Dependencies:** 49.1  

Utilizar o hook `usePlan()` recém-criado para revisar toda a interface do usuário e aplicar renderização condicional, escondendo ou desabilitando funcionalidades pagas para usuários que não têm permissão.

**Details:**

Revisar sistematicamente os componentes em `src/features/*`. Identificar features como filtros avançados, número máximo de favoritos e acesso a seções específicas. Envolver estes elementos em lógica condicional baseada no retorno do `usePlan()`.

### 49.3. Implementar lógica de CTA dinâmico ('Upgrade' vs 'Gerenciar Planos')

**Status:** pending  
**Dependencies:** 49.1  

Criar e posicionar componentes de Call-to-Action (CTA) dinâmicos. O texto e o link do CTA devem mudar com base no plano do usuário: 'Fazer Upgrade' para FREE/STARTER e 'Gerenciar Planos' para PRO.

**Details:**

Modificar/criar o componente `src/features/notifications/UpgradeCTA.tsx` para consumir o `usePlan()`. Integrar este CTA no cabeçalho principal (`AppHeader.tsx`) e em telas onde um limite de plano é atingido (ex: ao tentar adicionar um favorito além do limite).
