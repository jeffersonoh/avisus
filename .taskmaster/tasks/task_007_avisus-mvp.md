# Task ID: 7

**Title:** Gerar tipos TypeScript do banco (`supabase gen types`)

**Status:** pending

**Dependencies:** 4, 5, 6

**Priority:** high

**Description:** Gerar `src/types/database.ts` a partir do schema Supabase e criar script npm para regenerar após migrations.

**Details:**

Contexto:
- Equivalente a T-013 (tasks.md). Tipagem forte end-to-end elimina uso de `any` e mantém contratos consistentes entre DB e app.

Escopo:
- Executar `supabase gen types typescript --local > src/types/database.ts`.
- Adicionar script `npm run db:types` no `package.json`.
- Documentar no README que toda migration exige regenerar tipos.

Fora de escopo:
- Tipos de domínio derivados (Plan, Marketplace etc.) — criados à medida que as features consomem.

Implementação:
- Arquivos/módulos: `src/types/database.ts`, `package.json` (script), `README.md` (seção de dev workflow).
- Regras e validações: CI deve falhar se `database.ts` estiver desatualizado em relação ao schema.

Critérios de pronto:
- Arquivo `database.ts` existe e tipa todas as tabelas.
- Script `db:types` roda com `supabase start` ativo.

**Test Strategy:**

Cenários de teste:
- [ ] Rodar `npm run db:types` regenera o arquivo.
- [ ] Importar `Database['public']['Tables']['profiles']['Row']` tipa corretamente um profile.

Validações técnicas:
- [ ] Sem `any` em `database.ts`.
- [ ] Colunas novas aparecem após migration + regeneração.

## Subtasks

### 7.1. Iniciar ambiente de desenvolvimento local do Supabase

**Status:** pending  
**Dependencies:** None  

Garantir que a instância local do Supabase esteja ativa e acessível, o que é um pré-requisito para gerar os tipos do banco de dados a partir do schema atual.

**Details:**

Execute o comando `supabase start` na raiz do projeto. Confirme que os contêineres Docker estão rodando e que a API está acessível localmente antes de prosseguir.

### 7.2. Gerar arquivo `database.ts` com os tipos do schema

**Status:** pending  
**Dependencies:** 7.1  

Executar o comando da CLI do Supabase para inspecionar o schema do banco de dados local e gerar o arquivo TypeScript correspondente em `src/types/database.ts`.

**Details:**

Com o Supabase local em execução, execute o comando: `supabase gen types typescript --local > src/types/database.ts`. Verifique se o arquivo foi criado e contém a estrutura `export type Json = ...` e `export interface Database { ... }`.

### 7.3. Adicionar script `db:types` ao `package.json`

**Status:** pending  
**Dependencies:** 7.2  

Criar um atalho no `package.json` para simplificar e padronizar o comando de regeneração dos tipos do banco de dados para toda a equipe.

**Details:**

Edite o arquivo `package.json` e adicione a seguinte linha dentro do objeto `scripts`: `"db:types": "supabase gen types typescript --local > src/types/database.ts"`.

### 7.4. Documentar o processo de regeneração de tipos no README.md

**Status:** pending  
**Dependencies:** 7.3  

Atualizar a documentação do projeto para instruir os desenvolvedores sobre quando e como atualizar os tipos do banco de dados, garantindo a consistência do código.

**Details:**

Adicione uma seção no `README.md` (por exemplo, em 'Rotinas de Desenvolvimento') explicando que após qualquer alteração no schema do banco (via migrations), o comando `npm run db:types` deve ser executado.

### 7.5. Validar o uso dos tipos gerados em um arquivo do projeto

**Status:** pending  
**Dependencies:** 7.2  

Realizar um teste prático importando e utilizando um dos tipos gerados para garantir que o TypeScript os reconhece corretamente e fornece o intellisense esperado.

**Details:**

Em um arquivo de serviço ou helper, adicione `import type { Database } from '@/types/database';`. Em seguida, declare uma variável com um tipo como `const userProfile: Database['public']['Tables']['profiles']['Row'] | null = null;`. Verifique se não há erros de compilação.
