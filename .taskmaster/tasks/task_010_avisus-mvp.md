# Task ID: 10

**Title:** Layout autenticado com header, bottom nav e tema

**Status:** pending

**Dependencies:** 9

**Priority:** high

**Description:** Migrar shell do protótipo (`src/prototype.jsx`) para `(app)/layout.tsx` com header, bottom nav mobile-first, tema dark/light via Tailwind.

**Details:**

Contexto:
- Equivalente a T-021 (tasks.md). Base visual consistente para todas as páginas autenticadas.

Escopo:
- Layout `(app)/layout.tsx` com header (logo, perfil, tema), bottom nav (Dashboard / Interesses / Alertas / Favoritos / Perfil).
- Tema dark/light via classe `dark:` do Tailwind; preferência persistida em cookie ou localStorage.
- Substituir CSS inline do protótipo por tokens Tailwind.

Fora de escopo:
- Conteúdo das rotas (dashboards, forms etc.).

Implementação:
- Arquivos/módulos: `src/app/(app)/layout.tsx`, `src/components/AppHeader.tsx`, `src/components/BottomNav.tsx`, `tailwind.config.ts` (tokens do design system).
- Regras e validações: mobile-first (`sm:`, `md:` breakpoints); rota ativa destacada no bottom nav; CTA "Upgrade" no FREE/STARTER e "Planos" no PRO (CA-18).

Critérios de pronto:
- Navegar entre rotas principais mantém o shell.
- Troca de tema afeta toda a aplicação sem flash.

**Test Strategy:**

Cenários de teste:
- [ ] Bottom nav muda rota ativa ao clicar.
- [ ] Toggle tema alterna classes `dark` no `<html>`.
- [ ] Usuário PRO vê "Planos" em vez de "Upgrade".

Validações técnicas:
- [ ] Sem CSS inline residual do protótipo.
- [ ] Breakpoints Tailwind respeitam mobile-first.

## Subtasks

### 10.1. Implementar componente AppHeader com logo, perfil e seletor de tema

**Status:** pending  
**Dependencies:** None  

Criar o componente de cabeçalho reutilizável (`AppHeader`) que incluirá o logotipo da aplicação, um menu de acesso ao perfil do usuário e o controle para alternar entre os temas claro e escuro.

**Details:**

Desenvolver em `src/components/AppHeader.tsx`. Usar Tailwind CSS para estilização responsiva. O menu de perfil deve conter links para a página de perfil e a funcionalidade de logout, além do CTA de plano (Upgrade/Planos).

### 10.2. Implementar componente BottomNav mobile-first com navegação principal

**Status:** pending  
**Dependencies:** None  

Desenvolver a barra de navegação inferior (`BottomNav`) para dispositivos móveis, contendo os links para as seções principais (Dashboard, Interesses, Alertas, Favoritos, Perfil) e um indicador visual para a rota ativa.

**Details:**

Criar o arquivo `src/components/BottomNav.tsx`. Utilizar o hook `usePathname` para identificar e destacar a rota atual. A barra deve ser fixa na parte inferior da tela e ser exibida apenas em breakpoints mobile, conforme o design.

### 10.3. Implementar lógica de persistência e troca de tema (dark/light)

**Status:** pending  
**Dependencies:** None  

Desenvolver a lógica para gerenciamento do tema da aplicação, permitindo a troca entre os modos claro e escuro e persistindo a escolha do usuário no `localStorage` para manter a consistência entre as sessões.

**Details:**

Criar um provedor de contexto (`ThemeProvider`) que gerenciará o estado do tema. Este provedor deve ler o valor do `localStorage` na inicialização, aplicar a classe `dark` ao elemento `<html>` e expor uma função para alternar o tema.

### 10.4. Integrar componentes e provedor de tema no layout principal

**Status:** pending  
**Dependencies:** 10.1, 10.2, 10.3  

Montar a estrutura final do layout autenticado, integrando os componentes `AppHeader` e `BottomNav`, e envolvendo toda a aplicação com o `ThemeProvider` para habilitar a funcionalidade de tema.

**Details:**

Atualizar o arquivo `src/app/(app)/layout.tsx` para importar e posicionar os componentes `AppHeader` e `BottomNav`. Envolver o conteúdo principal (`children`) com o `ThemeProvider` para que o estado do tema seja acessível globalmente.
