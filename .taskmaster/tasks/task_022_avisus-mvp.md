# Task ID: 22

**Title:** Server Actions: atualização de perfil com validação

**Status:** pending

**Dependencies:** 8, 17

**Priority:** high

**Description:** Atualização parcial de profile com Zod (formato Telegram/WhatsApp), consentimento LGPD e persistência segura (RF-47/48).

**Details:**

Contexto:
- Equivalente a T-041 (tasks.md). F13 (RF-47/48).

Escopo:
- Server Actions `updateProfile`, `updateAlertChannels`, `updateSilenceWindow`.
- Validar `telegram_username` com regex `^@?[A-Za-z0-9_]{5,32}$`; limpar @ inicial.
- Atualização parcial apenas dos campos enviados.

Fora de escopo:
- Validação ativa de @username via Telegram getChat (T-063).

Implementação:
- Arquivos/módulos: `src/features/profile/actions.ts`.
- Regras e validações: Zod schemas por ação; retornar diff salvo para UI exibir "Salvo".

Critérios de pronto:
- Trocar canal Telegram persiste e valida formato.
- Silence window aceita apenas HH:mm.

**Test Strategy:**

Cenários de teste:
- [ ] `@usuario_valido` aceita e normaliza.
- [ ] `@xx` (menos de 5) rejeita.
- [ ] UF sem cidade rejeita.

Validações técnicas:
- [ ] Sanitização consistente (trim, lower onde aplicável).
- [ ] Nenhum dado sensível em logs.

## Subtasks

### 22.1. Implementar Server Action `updateProfile` para dados básicos do perfil

**Status:** pending  
**Dependencies:** None  

Criar a Server Action para atualizar dados básicos do usuário (ex: nome, telefone) com validação via Zod, permitindo atualizações parciais.

**Details:**

A ação deve ser implementada em `src/features/profile/actions.ts`. Será necessário definir um schema Zod para os dados básicos do perfil e usar `partial()` para validar apenas os campos enviados no formulário. A função deve persistir os dados validados no banco e retornar um objeto indicando o sucesso da operação.

### 22.2. Implementar Server Action `updateAlertChannels` com validação de Telegram

**Status:** pending  
**Dependencies:** 22.1  

Desenvolver a Server Action para atualizar os canais de notificação, com foco especial na validação e normalização do nome de usuário do Telegram.

**Details:**

Na mesma `actions.ts`, criar `updateAlertChannels`. Utilizar a regex `^@?[A-Za-z0-9_]{5,32}$` dentro de um schema Zod para validar o `telegram_username`. Implementar a lógica para remover o caractere '@' inicial antes de salvar no banco de dados.

### 22.3. Implementar Server Action `updateSilenceWindow` com validação de formato de hora

**Status:** pending  
**Dependencies:** 22.1  

Criar a Server Action para que o usuário possa configurar sua janela de silêncio, garantindo que os horários de início e fim estejam no formato 'HH:mm'.

**Details:**

Implementar a função `updateSilenceWindow` em `src/features/profile/actions.ts`. O schema Zod para esta ação deve validar que os campos `start` e `end` são strings que correspondem ao formato de hora `HH:mm` (ex: usando uma regex como `^([0-1][0-9]|2[0-3]):[0-5][0-9]$`).
