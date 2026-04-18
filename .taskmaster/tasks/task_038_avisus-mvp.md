# Task ID: 38

**Title:** Flag `ENABLE_TELEGRAM_ALERTS` para desligar envios em staging

**Status:** done

**Dependencies:** 34

**Priority:** medium

**Description:** Permitir desligar envio real no staging via env flag; logs indicam skip.

**Details:**

Contexto:
- Equivalente a T-064 (tasks.md). Evita spam em ambientes não-prod.

Escopo:
- Ler `ENABLE_TELEGRAM_ALERTS` no `alert-sender.ts`.
- Se `false`: registrar alert mas não chamar Telegram; log com marcador `[TELEGRAM_DISABLED]`.

Fora de escopo:
- Flags separadas para Shopee/TikTok (T-070).

Implementação:
- Arquivos/módulos: `src/lib/scanner/alert-sender.ts`.
- Regras e validações: default `true` em prod; `false` em staging.

Critérios de pronto:
- Staging não envia Telegram quando flag off.
- Logs deixam claro o motivo do skip.

**Test Strategy:**

Cenários de teste:
- [ ] Flag off → alert registrado como `sent`? (ou `skipped`) com marcador no log.
- [ ] Flag on → envio real.

Validações técnicas:
- [ ] Flag lida uma única vez por invocação.
- [ ] Sem drift entre features (centralizar leitura).

## Subtasks

### 38.1. Definir e validar a variável de ambiente ENABLE_TELEGRAM_ALERTS

**Status:** done  
**Dependencies:** None  

Adicionar a nova variável de ambiente `ENABLE_TELEGRAM_ALERTS` ao schema de validação (provavelmente Zod), garantindo que seja tratada como um booleano e tenha um valor padrão seguro.

**Details:**

No arquivo de configuração de variáveis de ambiente (ex: `src/lib/env.ts`), adicione `ENABLE_TELEGRAM_ALERTS` ao schema Zod. Defina-a para ser opcional com um valor padrão de `true`, para que a funcionalidade existente não quebre em produção se a variável não estiver definida explicitamente.

### 38.2. Atualizar o arquivo .env.local.example com a nova flag

**Status:** done  
**Dependencies:** 38.1  

Documentar a nova variável `ENABLE_TELEGRAM_ALERTS` no arquivo de exemplo de ambiente para que outros desenvolvedores possam configurar seus ambientes locais corretamente.

**Details:**

Adicione a linha `ENABLE_TELEGRAM_ALERTS=true` ao arquivo `.env.local.example`. Inclua um comentário explicativo, como `# Controla o envio de alertas para o Telegram. Use 'false' para desativar em ambientes de desenvolvimento/staging.`.

### 38.3. Implementar lógica condicional de envio no alert-sender.ts

**Status:** done  
**Dependencies:** 38.1  

Modificar o arquivo `src/lib/scanner/alert-sender.ts` para que a função de envio de alertas verifique o estado da flag `ENABLE_TELEGRAM_ALERTS` antes de executar a chamada para a API do Telegram.

**Details:**

Importe o objeto de ambiente validado. Na função responsável pelo envio, envolva a chamada à API do Telegram (ex: `telegram.sendMessage(...)`) em uma estrutura condicional `if (env.ENABLE_TELEGRAM_ALERTS) { ... }`.

### 38.4. Adicionar log específico para envios de Telegram desabilitados

**Status:** done  
**Dependencies:** 38.3  

Implementar um log informativo que será registrado sempre que um alerta do Telegram for pulado devido à flag `ENABLE_TELEGRAM_ALERTS` estar desativada.

**Details:**

No bloco `else` da condição adicionada na tarefa anterior, adicione uma instrução de log. A mensagem deve incluir um marcador claro, como `[TELEGRAM_DISABLED]`, e informações sobre o alerta que não foi enviado, para facilitar a depuração em ambientes de staging.

### 38.5. Documentar processo de configuração da flag nos ambientes

**Status:** done  
**Dependencies:** 38.2  

Atualizar a documentação do projeto (ex: README.md ou um guia de deploy) com instruções sobre como configurar a variável `ENABLE_TELEGRAM_ALERTS` nos ambientes de produção e staging.

**Details:**

Adicione uma seção à documentação explicando que a variável de ambiente `ENABLE_TELEGRAM_ALERTS` deve ser configurada como `false` nas configurações do provedor de hospedagem (ex: Vercel) para o ambiente de staging, e como `true` (ou deixada em branco para usar o padrão) para o ambiente de produção.
