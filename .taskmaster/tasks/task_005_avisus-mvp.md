# Task ID: 5

**Title:** Habilitar RLS e criar policies de segurança

**Status:** pending

**Dependencies:** 4

**Priority:** high

**Description:** Habilitar Row Level Security em todas as tabelas e criar policies conforme Tech Spec (próprio usuário para dados sensíveis; leitura pública em opportunities/channel_margins/products/price_history/marketplace_fees).

**Details:**

Contexto:
- Equivalente a T-011 (tasks.md). Isolamento por usuário é o mecanismo principal de segurança da aplicação.

Escopo:
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` em todas as tabelas públicas.
- Policies `FOR ALL USING (auth.uid() = user_id)` em: `profiles`, `interests`, `subscriptions`, `user_opportunity_status`, `favorite_sellers`.
- `FOR SELECT` em `alerts` e `live_alerts` + `FOR UPDATE` para marcar `read`/`clicked_at`.
- `FOR SELECT USING (TRUE)` em: `opportunities`, `channel_margins`, `products`, `price_history`, `marketplace_fees`.

Fora de escopo:
- Lógica de enforcement de limites (feita nas Server Actions).

Implementação:
- Arquivos/módulos: `supabase/migrations/0002_rls_policies.sql`.
- Regras e validações: políticas nunca expõem dados de outro usuário; `service_role` usado apenas no servidor.

Critérios de pronto:
- Usuário autenticado A não consegue ler `interests`/`alerts` de usuário B.
- Leitura anônima funciona em `opportunities` (dashboard público/SEO futuro).

**Test Strategy:**

Cenários de teste:
- [ ] Teste manual com 2 usuários: A não vê interesses/alertas/favoritos de B.
- [ ] SELECT anônimo em `opportunities` retorna linhas.
- [ ] UPDATE em `alerts` só funciona para o próprio usuário.

Validações técnicas:
- [ ] `pg_policies` lista todas as políticas esperadas.
- [ ] RLS habilitado em todas as tabelas (`SELECT relname, relrowsecurity FROM pg_class`).

## Subtasks

### 5.1. Habilitar Row-Level Security em Todas as Tabelas Públicas

**Status:** pending  
**Dependencies:** None  

Executar o comando `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` em todas as tabelas do schema `public` como passo inicial para a implementação das políticas de segurança.

**Details:**

Criar uma nova migration SQL, por exemplo `supabase/migrations/0002_enable_rls.sql`, e adicionar os comandos `ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;` para todas as tabelas do escopo.

### 5.2. Criar Policies de RLS para Isolamento de Dados Privados do Usuário

**Status:** pending  
**Dependencies:** 5.1  

Implementar políticas de segurança que garantam que um usuário autenticado só possa acessar e modificar seus próprios dados em tabelas sensíveis como `profiles`, `interests` e `alerts`.

**Details:**

Adicionar ao arquivo de migration as policies `FOR ALL` baseadas em `USING (auth.uid() = user_id)` para `profiles`, `interests`, `subscriptions`, etc. Para `alerts`, criar policies específicas `FOR SELECT` e `FOR UPDATE` que permitam ao usuário ler seus alertas e marcá-los como lidos.

### 5.3. Criar Policies de RLS para Acesso Público de Leitura

**Status:** pending  
**Dependencies:** 5.1  

Definir políticas de segurança que permitam acesso de leitura (`SELECT`) público e anônimo a tabelas de dados compartilhados, como `opportunities`, `products` e `price_history`.

**Details:**

Adicionar ao mesmo arquivo de migration SQL as policies `CREATE POLICY "Public read access" ON nome_da_tabela FOR SELECT USING (TRUE);` para as tabelas `opportunities`, `channel_margins`, `products`, `price_history` e `marketplace_fees`.
