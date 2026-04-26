# Task ID: 52

**Title:** Teste de integração com Supabase local (CRUD e webhook mock)

**Status:** done

**Dependencies:** 21, 23, 45, 51

**Priority:** medium

**Description:** Cenários E2E no banco: onboarding completo, CRUD de interesses/favoritos e webhook Stripe mockado.

**Details:**

Contexto:
- Equivalente a T-101 (tasks.md). Valida integração entre camadas.

Escopo:
- Supabase local (`supabase start`) para rodar testes.
- Suites: onboarding, CRUD interesses, CRUD favoritos, webhook Stripe mockado.

Fora de escopo:
- UI (T-102).

Implementação:
- Arquivos/módulos: `tests/integration/**/*.test.ts`.
- Regras e validações: usar `service_role` apenas no setup/teardown.

Critérios de pronto:
- Suíte verde contra Supabase local.
- Documentação no README de como rodar.

**Test Strategy:**

Cenários de teste:
- [ ] Usuário completa onboarding e aparece em `profiles.onboarded = true`.
- [ ] Adicionar 6º interesse FREE falha.
- [ ] Webhook mock altera plano.

Validações técnicas:
- [ ] Cada teste isolado (limpa tabelas relevantes).
- [ ] Sem flakiness por ordem.

## Subtasks

### 52.1. Implementar teste de integração para o fluxo de onboarding de usuário

**Status:** done  
**Dependencies:** None  

Criar um teste de integração que simula o cadastro de um novo usuário e verifica se o perfil correspondente é criado corretamente na tabela `profiles` com o status `onboarded` como verdadeiro.

**Details:**

O teste deve usar o cliente Supabase para criar um usuário de teste, simular o fluxo de onboarding e então consultar o banco de dados diretamente para validar que um registro foi criado na tabela `profiles` com os dados corretos.

### 52.2. Implementar testes de integração para CRUD de interesses/favoritos com limites de plano

**Status:** done  
**Dependencies:** 52.1  

Desenvolver testes para as operações de criar, ler, atualizar e deletar interesses e favoritos. Incluir um cenário de falha ao tentar adicionar um item além do limite permitido pelo plano 'FREE'.

**Details:**

Utilizar um usuário de teste no plano 'FREE' criado na etapa anterior. O teste deve tentar adicionar interesses até o limite e validar que a sexta tentativa falha. O mesmo deve ser feito para favoritos, de acordo com as regras em `plan-limits.ts`.

### 52.3. Implementar teste de integração para o webhook mockado do Stripe

**Status:** done  
**Dependencies:** 52.1  

Criar um teste que simula o recebimento de um evento de webhook do Stripe e verifica se a trigger `sync_profile_plan` atualiza corretamente o plano do usuário na tabela `profiles`.

**Details:**

O teste irá inserir manualmente um evento mock na tabela apropriada para acionar a função de trigger `sync_profile_plan`. Após a execução, o teste deve consultar o perfil do usuário para confirmar que o campo `plan` foi atualizado de 'FREE' para o plano correspondente ao evento mockado.
