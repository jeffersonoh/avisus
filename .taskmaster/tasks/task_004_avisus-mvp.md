# Task ID: 4

**Title:** Aplicar migrations SQL completas no Supabase

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** Criar migrations com extensão `pg_trgm`, todas as tabelas, índices, constraints e triggers (`handle_new_user`, `set_updated_at`, `sync_profile_plan`) conforme Tech Spec.

**Details:**

Contexto:
- Equivalente a T-010 (tasks.md). Fundação do banco; pré-requisito para todas as Server Actions e o scanner.

Escopo:
- Migrations em `supabase/migrations/` cobrindo: `profiles`, `interests`, `products`, `price_history`, `marketplace_fees`, `opportunities`, `channel_margins`, `alerts`, `user_opportunity_status`, `subscriptions`, `favorite_sellers`, `live_alerts`.
- Habilitar `pg_trgm`; criar índices GIN `gin_trgm_ops` nas colunas `name`.
- Triggers: `handle_new_user` (signup → profile), `set_updated_at`, `sync_profile_plan` (subscriptions → profiles.plan).
- Seed mínimo opcional para dev (`marketplace_fees` já tem INSERTS na DDL).

Fora de escopo:
- Policies RLS (T-011).
- Funções `alerts_sent_today` e `refresh_hot_flags` (T-012).

Implementação:
- Arquivos/módulos: `supabase/migrations/0001_init.sql`, `supabase/config.toml`.
- Regras e validações: constraints CHECK, UNIQUE (marketplace, external_id), LOWER(term) único por usuário; `NOT NULL` onde PRD exige.

Critérios de pronto:
- `supabase db push` (ou `supabase migration up`) aplica sem erro.
- `\dt public.*` lista todas as tabelas esperadas.

**Test Strategy:**

Cenários de teste:
- [ ] Reset + migrations recriam o banco inteiro sem erro.
- [ ] Inserir profile manualmente dispara defaults (`plan = 'free'`).
- [ ] Signup em `auth.users` cria automaticamente `public.profiles`.

Validações técnicas:
- [ ] `pg_trgm` habilitado (`SELECT extname FROM pg_extension`).
- [ ] Índices GIN `name_trgm` existem em `products` e `opportunities`.
- [ ] Constraints de marketplace só aceitam `Mercado Livre` e `Magazine Luiza`.

## Subtasks

### 4.1. Criar migration inicial e habilitar a extensão pg_trgm

**Status:** pending  
**Dependencies:** None  

Iniciar o arquivo de migração SQL principal e incluir o comando para habilitar a extensão `pg_trgm`, que é essencial para buscas textuais eficientes usando trigramas.

**Details:**

No diretório `supabase/migrations/`, criar um novo arquivo SQL para a migração (ex: `0001_initial_schema.sql`). Adicionar o comando `CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;` no início do arquivo.

### 4.2. Definir tabelas de usuários, perfis e assinaturas (`profiles`, `subscriptions`)

**Status:** pending  
**Dependencies:** 4.1  

Adicionar o SQL para criar as tabelas `profiles` e `subscriptions`. A tabela `profiles` armazenará dados públicos dos usuários, enquanto `subscriptions` gerenciará os planos e status de pagamento.

**Details:**

No arquivo de migração, adicionar os comandos `CREATE TABLE` para `public.profiles` (com `id` referenciando `auth.users` e colunas para `full_name`, `plan`, `onboarded`) e `public.subscriptions` (com colunas para `user_id`, `stripe_customer_id`, `status`).

### 4.3. Definir tabelas centrais de negócio (`products`, `interests`, `opportunities`)

**Status:** pending  
**Dependencies:** 4.2  

Criar as tabelas que formam o núcleo do modelo de dados do negócio, incluindo produtos, interesses dos usuários, oportunidades de mercado e histórico de preços.

**Details:**

Adicionar `CREATE TABLE` para `products` (com índice GIN/trgm na coluna `name`), `interests` (ligando `user_id` a um termo), `opportunities` e `price_history`. Garantir que todas as constraints `NOT NULL`, `UNIQUE` e chaves estrangeiras (ex: para `profiles`) sejam definidas.

### 4.4. Definir tabelas de suporte e alertas

**Status:** pending  
**Dependencies:** 4.2, 4.3  

Implementar as tabelas secundárias que suportam funcionalidades como alertas, vendedores favoritos, taxas de marketplace e status de oportunidades por usuário.

**Details:**

Adicionar `CREATE TABLE` para `alerts`, `favorite_sellers`, `marketplace_fees`, `channel_margins`, `user_opportunity_status` e `live_alerts`. A tabela `marketplace_fees` deve ser pré-populada com `INSERT`s contendo os valores iniciais.

### 4.5. Implementar funções e triggers do banco de dados

**Status:** pending  
**Dependencies:** 4.2  

Criar as funções PostgreSQL e os triggers associados para automatizar lógicas no banco de dados, como criar um perfil para um novo usuário, atualizar timestamps e sincronizar o plano do usuário.

**Details:**

Definir a função `handle_new_user` para inserir em `public.profiles` e criar um trigger em `auth.users` que a execute após um `INSERT`. Implementar a função genérica `set_updated_at` e a função `sync_profile_plan` para refletir mudanças de `subscriptions` em `profiles`, com seus respectivos triggers.
