# Task ID: 9

**Title:** Páginas de login e registro com Supabase Auth

**Status:** done

**Dependencies:** 8

**Priority:** high

**Description:** Implementar `/login` e `/registro` com email/senha + Google OAuth, UI alinhada ao design system e redirect pós-autenticação.

**Details:**

Contexto:
- Equivalente a T-020 (tasks.md). Primeiro contato do usuário com o produto.

Escopo:
- Páginas `src/app/(auth)/login/page.tsx` e `src/app/(auth)/registro/page.tsx` em PT-BR.
- Form email/senha + botão Google OAuth.
- Redirect: se `profiles.onboarded = false` → `/onboarding`; senão → `/dashboard`.
- Validação inline (email format, senha ≥ 8).

Fora de escopo:
- Recuperação de senha (pode ser futura).
- Onboarding em si (T-037).

Implementação:
- Arquivos/módulos: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/registro/page.tsx`, Server Action para signUp/signIn.
- Regras e validações: Zod schema `LoginSchema`, `RegisterSchema`; mensagens de erro genéricas para não vazar existência de email.

Critérios de pronto:
- Fluxo login email/senha funcional contra Supabase staging.
- Login Google OAuth redireciona e cria profile via trigger.

**Test Strategy:**

Cenários de teste:
- [x] Registro com email válido cria `auth.users` + `profiles`.
- [x] Login correto redireciona conforme estado de onboarding.
- [x] Credenciais inválidas mostram mensagem genérica.

Validações técnicas:
- [x] OAuth Google configurado no Supabase (doc no README).
- [x] Nenhuma senha logada em qualquer lugar.

## Subtasks

### 9.1. Criar UI da Página de Login (/login)

**Status:** done  
**Dependencies:** None  

Desenvolver a interface de usuário para a página de login, incluindo o formulário de email/senha e o botão para login com Google OAuth, alinhada ao design system.

**Details:**

Criar o componente React em `src/app/(auth)/login/page.tsx`. Utilizar componentes de UI pré-existentes do design system para campos de formulário, botões e mensagens de erro.

### 9.2. Criar UI da Página de Registro (/registro)

**Status:** done  
**Dependencies:** None  

Desenvolver a interface de usuário para a página de registro, incluindo o formulário de email/senha e o botão para registro com Google OAuth, seguindo o design system.

**Details:**

Criar o componente React em `src/app/(auth)/registro/page.tsx`. A estrutura deve ser similar à de login, com validação de front-end para formato de email e complexidade da senha (mínimo 8 caracteres).

### 9.3. Implementar Server Actions para Autenticação com Supabase

**Status:** done  
**Dependencies:** None  

Criar e configurar as Server Actions para lidar com os processos de login com email/senha, registro de novo usuário e login via Google OAuth, utilizando o cliente Supabase.

**Details:**

Desenvolver as funções `signInWithPassword`, `signUp` e `signInWithOAuth`. Utilizar Zod (`LoginSchema`, `RegisterSchema`) para validação dos dados. As funções devem interagir com o SDK do Supabase e retornar mensagens de erro genéricas para segurança.

### 9.4. Implementar Lógica de Redirecionamento Pós-Autenticação

**Status:** done  
**Dependencies:** 9.1, 9.2, 9.3  

Integrar as páginas de UI com as Server Actions e implementar a lógica que redireciona o usuário após um login ou registro bem-sucedido.

**Details:**

Nos componentes de página, chamar as Server Actions. Após uma resposta de sucesso, obter o perfil do usuário para verificar o campo `onboarded`. Redirecionar para `/onboarding` se `onboarded` for `false`, ou para `/dashboard` se for `true`.
