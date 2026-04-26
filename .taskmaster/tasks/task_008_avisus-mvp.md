# Task ID: 8

**Title:** Configurar clients Supabase com `@supabase/ssr` e middleware de sessão

**Status:** done

**Dependencies:** 7

**Priority:** high

**Description:** Implementar `createBrowserClient`, `createServerClient` e middleware Next.js para refresh automático de sessão e proteção de rotas `(app)`.

**Details:**

Contexto:
- Equivalente a T-014 (tasks.md). Base para auth em Server Components, Client Components, Route Handlers e Server Actions.

Escopo:
- Criar `src/lib/supabase/client.ts` (`createBrowserClient`), `server.ts` (`createServerClient` com cookies), `middleware.ts` para refresh.
- Registrar `middleware.ts` na raiz para rodar em rotas `(app)/*`.
- Redirecionar usuário não autenticado para `/login` ao acessar rota protegida.

Fora de escopo:
- UI das páginas de login/registro (T-020).

Implementação:
- Arquivos/módulos: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `middleware.ts` (raiz), `src/app/(app)/layout.tsx` usa `createServerClient`.
- Regras e validações: cookies `httpOnly`, `secure`, `sameSite=lax`; nunca expor `SUPABASE_SERVICE_ROLE_KEY` no client.

Critérios de pronto:
- Login persiste entre reloads.
- Acessar `/dashboard` sem sessão redireciona para `/login`.
- Renovação automática funciona em páginas SSR.

**Test Strategy:**

Cenários de teste:
- [x] Usuário autenticado acessa `/dashboard` sem redirect.
- [x] Sessão expira e middleware renova silenciosamente.
- [x] Logout invalida cookies e bloqueia `(app)`.

Validações técnicas:
- [x] `cookies()` usado apenas em Server Components (não em Client).
- [x] `NEXT_PUBLIC_*` não contém secrets sensíveis.

## Subtasks

### 8.1. Criar o client Supabase para o navegador (createBrowserClient)

**Status:** done  
**Dependencies:** None  

Implementar a função `createBrowserClient` utilizando o pacote `@supabase/ssr` para ser consumida em Componentes de Cliente (Client Components) no Next.js.

**Details:**

Criar o arquivo `src/lib/supabase/client.ts`. Este arquivo deve exportar uma função que inicializa o client do Supabase para o lado do cliente, usando as variáveis de ambiente públicas (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### 8.2. Criar o client Supabase para o servidor (createServerClient)

**Status:** done  
**Dependencies:** None  

Implementar a função `createServerClient` utilizando `@supabase/ssr` para gerenciar a autenticação em Server Components, Server Actions e Route Handlers.

**Details:**

Criar o arquivo `src/lib/supabase/server.ts`. A implementação deve usar a `cookies()` store do Next.js para ler e escrever a sessão do usuário de forma segura no lado do servidor, garantindo que a autenticação persista entre renderizações SSR.

### 8.3. Implementar middleware para atualização de sessão e proteção de rotas

**Status:** done  
**Dependencies:** 8.2  

Desenvolver um middleware (`middleware.ts`) na raiz do projeto para interceptar requisições, atualizar a sessão Supabase e proteger o grupo de rotas `(app)`.

**Details:**

O middleware deve usar uma implementação do client Supabase para servidor para verificar a sessão do usuário. Caso o usuário não esteja autenticado e tente acessar uma rota dentro do matcher (ex: `'/((?!api|_next/static|_next/image|favicon.ico).*)'`), ele deve ser redirecionado para a página `/login`.

### 8.4. Integrar e validar o client no layout da aplicação protegida

**Status:** done  
**Dependencies:** 8.2, 8.3  

Utilizar o `createServerClient` no layout principal do grupo de rotas `(app)` para buscar a sessão do usuário e garantir que todo o fluxo de autenticação está funcionando corretamente.

**Details:**

No arquivo `src/app/(app)/layout.tsx`, importar e usar o `createServerClient` para obter os dados da sessão. Embora o middleware já forneça a proteção, esta etapa serve como uma validação final e permite passar dados da sessão para componentes filhos via contexto ou props.
