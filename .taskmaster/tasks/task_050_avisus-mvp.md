# Task ID: 50

**Title:** `min_discount_pct` lido do perfil e aplicado pelo scanner (sem UI)

**Status:** done

**Dependencies:** 29

**Priority:** low

**Description:** Scanner respeita `profiles.min_discount_pct` (default 15%) para filtrar ofertas; UI não expõe (desvio D3).

**Details:**

Contexto:
- Equivalente a T-094 (tasks.md). RF-05.

Escopo:
- Ler `min_discount_pct` no matcher; descartar ofertas com `discount_pct < min_discount_pct`.
- Documentar que UI para ajuste é futura.

Fora de escopo:
- UI de ajuste (pós-MVP).

Implementação:
- Arquivos/módulos: `src/lib/scanner/opportunity-matcher.ts`.
- Regras e validações: fallback para 15 quando `NULL`.

Critérios de pronto:
- Ofertas abaixo do threshold não geram oportunidade/alerta.
- Teste de unidade cobre fallback.

**Test Strategy:**

Cenários de teste:
- [ ] Usuário com `min_discount_pct = 25` ignora oferta de 20%.
- [ ] Usuário sem valor cai em default 15.

Validações técnicas:
- [ ] Consulta usa índice adequado.
- [ ] Documentação inline referencia D3.

## Subtasks

### 50.1. Adicionar coluna `min_discount_pct` à tabela `profiles`

**Status:** done  
**Dependencies:** None  

Criar uma nova migração de banco de dados para adicionar a coluna `min_discount_pct` na tabela `profiles`. A coluna deve ser do tipo numérico e permitir valores nulos.

**Details:**

Use o Drizzle Kit para gerar uma nova migração. A coluna deve ser `min_discount_pct` do tipo `integer`. Não é necessário definir um valor padrão no nível do banco de dados, pois a lógica de fallback será tratada na aplicação.

### 50.2. Atualizar o schema do Drizzle para a tabela `profiles`

**Status:** done  
**Dependencies:** 50.1  

Modificar o arquivo de schema do Drizzle ORM (`src/db/schema.ts`) para incluir o novo campo `min_discount_pct` na definição da tabela `profiles`.

**Details:**

No arquivo `src/db/schema.ts`, adicione `min_discount_pct: integer('min_discount_pct')` ao objeto que define a tabela `profiles`. Isso garantirá que o TypeScript e o Drizzle reconheçam o novo campo.

### 50.3. Modificar a consulta de perfis para incluir `min_discount_pct`

**Status:** done  
**Dependencies:** 50.2  

Ajustar a função que busca os perfis de usuário para o scanner, garantindo que o novo campo `min_discount_pct` seja selecionado do banco de dados.

**Details:**

Localize a query que busca perfis ativos para o `opportunity-matcher`. Certifique-se de que `min_discount_pct` está incluído na lista de campos selecionados. Isso pode estar em `src/lib/db/queries.ts` ou diretamente no matcher.

### 50.4. Implementar lógica de filtro de desconto no `opportunity-matcher`

**Status:** done  
**Dependencies:** 50.3  

Alterar o `opportunity-matcher.ts` para filtrar ofertas com base no percentual de desconto mínimo definido no perfil do usuário, com um valor padrão de 15%.

**Details:**

Dentro da função de correspondência em `src/lib/scanner/opportunity-matcher.ts`, obtenha o `min_discount_pct` do perfil. Use o operador '??' ou um 'if' para definir um valor padrão de 15 se o campo for nulo. Adicione uma condição para pular a criação da oportunidade se `offer.discount_pct < profile.min_discount_pct`.

### 50.5. Adicionar testes de unidade para a lógica de filtro de desconto

**Status:** done  
**Dependencies:** 50.4  

Criar ou atualizar os testes de unidade para `opportunity-matcher.ts` para cobrir os cenários da nova lógica de filtro de desconto, incluindo o caso de fallback.

**Details:**

No arquivo de teste correspondente, adicione casos de teste para: 1) Um perfil com `min_discount_pct` definido que ignora uma oferta abaixo do seu limiar. 2) Um perfil com `min_discount_pct` nulo que usa o fallback de 15% e ignora uma oferta de 10%. 3) Um perfil que corresponde a uma oferta que atende ao seu requisito de desconto.
