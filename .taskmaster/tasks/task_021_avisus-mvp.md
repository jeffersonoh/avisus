# Task ID: 21

**Title:** Server Actions: CRUD de interesses com validação Zod e limites

**Status:** done

**Dependencies:** 8, 14

**Priority:** high

**Description:** Implementar mutações de interests validando com Zod, checando `COUNT(active)` vs `PLAN_LIMITS` e respeitando índice único `LOWER(term)`.

**Details:**

Contexto:
- Equivalente a T-040 (tasks.md). Enforcement autoritativo no servidor para RF-01/CA-26.

Escopo:
- Server Actions `createInterest`, `updateInterest`, `deleteInterest` em `src/features/interests/actions.ts`.
- Checagem: `SELECT COUNT(*) WHERE user_id = auth.uid() AND active`; comparar com `PLAN_LIMITS[plan].maxInterests`.
- Erro tipado `LIMIT_REACHED` tratado na UI.

Fora de escopo:
- UI de bloqueio (T-032/T-093).

Implementação:
- Arquivos/módulos: `src/features/interests/actions.ts`, `src/lib/errors.ts`.
- Regras e validações: Zod `CreateInterestSchema` (term 2–60 chars); rejeitar duplicatas com mensagem amigável; `revalidatePath('/interesses')`.

Critérios de pronto:
- FREE bloqueado no 6º termo.
- UI trata `LIMIT_REACHED` com CTA upgrade.

**Test Strategy:**

Cenários de teste:
- [ ] Criar 5 termos FREE → sucesso; 6º → `LIMIT_REACHED`.
- [ ] Termo duplicado (case-insensitive) → erro.
- [ ] Deletar termo libera vaga para novo.

Validações técnicas:
- [ ] Ações executam com `auth.uid()` do usuário logado.
- [ ] `revalidatePath` chamado nas mutações.

## Subtasks

### 21.1. Implementar Server Action 'createInterest' com validação e checagem de limite

**Status:** done  
**Dependencies:** None  

Desenvolver a Server Action 'createInterest' que valida os dados de entrada com Zod, verifica se o usuário atingiu o limite de interesses do seu plano e, em caso de sucesso, insere o novo interesse no banco de dados.

**Details:**

A ação deve ser criada em 'src/features/interests/actions.ts'. Utilizar um schema Zod ('CreateInterestSchema') para validar o termo (2-60 caracteres). Antes de inserir, contar os interesses ativos do usuário ('auth.uid()') e comparar com 'PLAN_LIMITS'. Se o limite for atingido, retornar um erro 'LIMIT_REACHED'. Tratar duplicatas (usando LOWER(term)) com uma mensagem de erro amigável. Em sucesso, chamar 'revalidatePath('/interesses')'.

### 21.2. Implementar Server Action 'updateInterest' para edição de interesses

**Status:** done  
**Dependencies:** 21.1  

Desenvolver a Server Action 'updateInterest' que permite a modificação de um interesse existente, como a alteração do termo. A ação deve validar os dados de entrada e garantir que o usuário só possa editar seus próprios interesses.

**Details:**

A ação deve ser implementada em 'src/features/interests/actions.ts'. Validar a entrada usando um schema Zod. A lógica deve garantir que um usuário só possa atualizar interesses que lhe pertencem, verificando a propriedade 'user_id' contra o 'auth.uid()'. Ao concluir a atualização com sucesso, invocar 'revalidatePath('/interesses')'.

### 21.3. Implementar Server Action 'deleteInterest' para remoção de interesses

**Status:** done  
**Dependencies:** 21.1  

Desenvolver a Server Action 'deleteInterest' que permite aos usuários removerem seus interesses. A remoção deve ser segura e atualizar a interface do usuário após a conclusão.

**Details:**

A ação deve ser implementada em 'src/features/interests/actions.ts'. Ela receberá o ID do interesse a ser deletado como parâmetro. A segurança será garantida verificando se o interesse pertence ao usuário autenticado ('auth.uid()'). Após a exclusão, chamar 'revalidatePath('/interesses')' para refletir a mudança na UI.
