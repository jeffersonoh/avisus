# Task ID: 37

**Title:** Validação opcional de `@username` Telegram via `getChat`

**Status:** pending

**Dependencies:** 22, 34

**Priority:** medium

**Description:** Validar formato e existência do @username no cadastro/alteração do perfil via `getChat` do Bot API (opcional no MVP).

**Details:**

Contexto:
- Equivalente a T-063 (tasks.md). Reduz falha de entrega por username inválido.

Escopo:
- Server Action `validateTelegramUsername(username)` chamando Bot API.
- Cachear resultado por 10min para evitar flood.

Fora de escopo:
- Verificação ativa antes de cada envio (assumido já resolvido por getChat no cadastro).

Implementação:
- Arquivos/módulos: `src/lib/scanner/telegram.ts` (função `validateUsername`).
- Regras e validações: tratar 400 (chat not found) como inválido; 429 não invalida.

Critérios de pronto:
- Formulário de perfil sinaliza username inválido inline.
- Se adiado: documentar no README.

**Test Strategy:**

Cenários de teste:
- [ ] Username inexistente → erro inline.
- [ ] Username válido → "Salvo" normal.

Validações técnicas:
- [ ] Cache 10min impede N chamadas consecutivas.
- [ ] Token nunca exposto no client.

## Subtasks

### 37.1. Criar função `validateUsername` no wrapper da API do Telegram

**Status:** pending  
**Dependencies:** None  

Adicionar uma nova função ao wrapper da API do Telegram que chama o endpoint `getChat` para verificar a existência e validade de um nome de usuário.

**Details:**

A função deve ser implementada em `src/lib/scanner/telegram.ts`. Ela receberá um username (string) e fará uma chamada à API do Telegram (getChat). Um código de status 200 confirma a validade, enquanto um 400 ('chat not found') indica que o username é inválido. Outros códigos de erro, como 429, não devem invalidar o username, mas podem ser registrados.

### 37.2. Integrar validação com cache na Server Action de atualização de perfil

**Status:** pending  
**Dependencies:** 37.1  

Incorporar a função de validação de username na Server Action responsável por atualizar o perfil do usuário, adicionando uma camada de cache para otimizar o desempenho e evitar chamadas excessivas à API.

**Details:**

Na Server Action de atualização de perfil, chame a função `validateUsername`. Implemente um mecanismo de cache (ex: `unstable_cache` do Next.js) com duração de 10 minutos para o resultado da validação. Se o username for inválido, a ação deve retornar um erro para ser exibido no formulário da interface do usuário.
