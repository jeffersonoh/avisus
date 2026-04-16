# Task ID: 54

**Title:** Integração com Sentry (front + server) sem PII em breadcrumbs

**Status:** pending

**Dependencies:** 1, 2

**Priority:** medium

**Description:** Adicionar `@sentry/nextjs` em front e server, com DSN por env; garantir que breadcrumbs/eventos não contenham PII.

**Details:**

Contexto:
- Equivalente a T-103 (tasks.md). Observabilidade mínima em produção.

Escopo:
- `@sentry/nextjs` com wizard de setup.
- Sanitizar dados sensíveis em `beforeSend`.
- Source maps configurados.

Fora de escopo:
- Alertas customizados (pós-MVP).

Implementação:
- Arquivos/módulos: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- Regras e validações: DSN por env; não enviar body de requests de usuário.

Critérios de pronto:
- Eventos aparecem no Sentry staging.
- Nenhum email, telefone ou token em breadcrumbs.

**Test Strategy:**

Cenários de teste:
- [ ] Disparar erro proposital em staging → aparece no Sentry.
- [ ] `beforeSend` remove campos sensíveis.

Validações técnicas:
- [ ] Source maps publicados apenas para builds de produção.
- [ ] Sem performance overhead (tracesSampleRate ≤ 0.2).

## Subtasks

### 54.1. Configurar @sentry/nextjs e DSNs via Variáveis de Ambiente

**Status:** pending  
**Dependencies:** None  

Executar o wizard de setup do @sentry/nextjs para criar os arquivos de configuração iniciais e configurar as DSNs (Data Source Name) para os ambientes de front-end, back-end e edge usando variáveis de ambiente.

**Details:**

Utilize o comando `npx @sentry/wizard@latest -i nextjs`. Adicione as variáveis de ambiente, como SENTRY_DSN, ao arquivo `.env.local.example` e configure-as nos ambientes de deploy.

### 54.2. Implementar Filtro de Dados Sensíveis (PII) com `beforeSend`

**Status:** pending  
**Dependencies:** 54.1  

Implementar a função de callback `beforeSend` na configuração do Sentry para inspecionar, filtrar e remover dados pessoais identificáveis (PII) como e-mails, telefones e tokens de todos os eventos e breadcrumbs antes de serem enviados aos servidores do Sentry.

**Details:**

Nos arquivos `*.config.ts`, adicione a lógica `beforeSend`. Esta função deve percorrer a estrutura do evento e substituir ou remover campos sensíveis, como dados de requisição de usuário, para evitar o vazamento de informações.

### 54.3. Validar Configuração e Upload de Source Maps

**Status:** pending  
**Dependencies:** 54.1  

Garantir que os source maps sejam gerados corretamente durante o build de produção e enviados ao Sentry. Isso é crucial para que os erros reportados na plataforma sejam mapeados para o código-fonte original, facilitando a depuração.

**Details:**

Verifique se a configuração do Next.js (`next.config.mjs`) está envolvida pela função `withSentryConfig`. Certifique-se de que o upload de source maps está habilitado no processo de build e que a opção `hideSourceMaps` está ativa para evitar que fiquem publicamente acessíveis.
