# Task ID: 1

**Title:** Inicializar repositório Next.js 15 com TypeScript strict e Tailwind

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Bootstrap do app Next.js 15 (App Router) com TypeScript strict, Tailwind CSS e tokens base do design system, preparando a estrutura de pastas alvo da Tech Spec.

**Details:**

Contexto:
- Equivalente a T-000 (tasks.md). Substitui o protótipo monolítico `src/prototype.jsx` por aplicação Next.js 15 mobile-first em PT-BR.

Escopo:
- Inicializar Next.js 15 App Router em `avisus/` (ou raiz, conforme decisão) com TypeScript strict.
- Configurar Tailwind CSS e tokens base alinhados a `docs/design-system.md`.
- Criar estrutura de diretórios conforme Tech Spec § Estrutura de diretórios (`src/app`, `src/lib`, `src/features`, `src/components`, `src/types`).
- Adicionar scripts `dev`, `build`, `start`, `lint`, `typecheck` no `package.json`.

Fora de escopo:
- Autenticação, Supabase, Stripe e scanners (tratados em tarefas próprias).
- Migração real do código do protótipo (feita nas features).

Implementação:
- Arquivos/módulos: `next.config.ts`, `tsconfig.json` (strict: true), `tailwind.config.ts`, `postcss.config.js`, `src/app/layout.tsx`, `src/app/globals.css`.
- Comandos: `npx create-next-app@latest`, `npm install -D typescript tailwindcss postcss autoprefixer`.
- Regras e validações: `tsconfig` strict ligado; `noUncheckedIndexedAccess: true`; ESLint + Next defaults.

Critérios de pronto:
- `npm run build` passa sem erros.
- `npm run lint` e `npm run typecheck` rodam verdes.
- Estrutura de pastas corresponde à Tech Spec.

**Test Strategy:**

Cenários de teste:
- [ ] Projeto inicia com `npm run dev` e carrega página raiz.
- [ ] `npm run build` gera artefatos sem erros.
- [ ] Remoção de um tipo força erro de compilação (strict ativo).

Validações técnicas:
- [ ] `tsconfig.json` com `strict: true` e `noUncheckedIndexedAccess: true`.
- [ ] Tailwind aplicado (classe utilitária funciona na rota inicial).
- [ ] Estrutura de diretórios idêntica à Tech Spec §3.

## Subtasks

### 1.1. Bootstrap da Aplicação Next.js 15 com `create-next-app`

**Status:** pending  
**Dependencies:** None  

Inicializar um novo projeto Next.js 15 usando o App Router e TypeScript, que servirá como base para toda a aplicação. Esta é a primeira etapa para configurar o ambiente de desenvolvimento.

**Details:**

Executar o comando `npx create-next-app@latest` com as opções para TypeScript, ESLint, e App Router. O projeto deve ser criado no diretório raiz do repositório.

### 1.2. Instalar e Configurar o Tailwind CSS e PostCSS

**Status:** pending  
**Dependencies:** 1.1  

Integrar o Tailwind CSS ao projeto Next.js para estilização, incluindo a configuração de `tailwind.config.ts` e `postcss.config.js`, e a definição dos tokens base do design system.

**Details:**

Instalar `tailwindcss`, `postcss`, `autoprefixer`. Inicializar os arquivos de configuração (`tailwind.config.ts`, `postcss.config.js`). Incluir as diretivas `@tailwind` no `src/app/globals.css`.

### 1.3. Ajustar `tsconfig.json` para Modo `strict` e `noUncheckedIndexedAccess`

**Status:** pending  
**Dependencies:** 1.1  

Configurar o TypeScript para operar em modo estrito, ativando as checagens mais rigorosas para garantir a qualidade e segurança do código, conforme especificado na Tech Spec.

**Details:**

Editar o arquivo `tsconfig.json` para garantir que a opção `compilerOptions.strict` esteja definida como `true`. Adicionalmente, habilitar a flag `noUncheckedIndexedAccess: true` para maior segurança no acesso a arrays e objetos.

### 1.4. Criar Estrutura de Diretórios Alvo

**Status:** pending  
**Dependencies:** 1.1  

Estabelecer a arquitetura de pastas base do projeto dentro do diretório `src/`, conforme definido na especificação técnica, para organizar o código de forma escalável e manutenível.

**Details:**

Dentro do diretório `src/`, criar as seguintes pastas: `lib/`, `features/`, `components/`, e `types/`. O diretório `src/app/` já deve existir. Adicionar um arquivo `.gitkeep` em cada pasta vazia para garantir que elas sejam versionadas.

### 1.5. Adicionar e Validar Scripts (`dev`, `build`, `start`, `lint`, `typecheck`)

**Status:** pending  
**Dependencies:** 1.1, 1.2, 1.3  

Configurar e validar os scripts essenciais no `package.json` para desenvolvimento, build, linting e checagem de tipos, garantindo um fluxo de trabalho consistente e automatizado.

**Details:**

Revisar e garantir a presença dos scripts `dev`, `build`, `start`, `lint`, e `typecheck` no arquivo `package.json`. Os scripts devem corresponder às ferramentas configuradas (Next.js, ESLint, TypeScript).
