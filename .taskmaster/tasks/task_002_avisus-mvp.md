# Task ID: 2

**Title:** Documentar variáveis de ambiente e criar `.env.local.example`

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** Catalogar todas as env vars da Tech Spec (Supabase, Stripe, Telegram, ML, ScrapingBee, cron, flags, Sentry) em um arquivo exemplo sem segredos reais.

**Details:**

Contexto:
- Equivalente a T-001 (tasks.md). Base para configuração segura do app em staging/prod (sem segredos no repo).

Escopo:
- Criar `.env.local.example` listando: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`, `TELEGRAM_BOT_TOKEN`, `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REFRESH_TOKEN`, `SCRAPINGBEE_API_KEY`, `MAGALU_SCRAPE_MODE`, `CRON_SECRET`, `ENABLE_TELEGRAM_ALERTS`, `ENABLE_SHOPEE_LIVE`, `ENABLE_TIKTOK_LIVE`, `SENTRY_DSN`.
- Documentar origem de cada chave (README ou comentário no próprio arquivo).

Fora de escopo:
- Provisionamento real dos serviços (Supabase, Stripe, etc.).

Implementação:
- Arquivos/módulos: `.env.local.example`, `README.md` (seção “Variáveis de ambiente”).
- Regras e validações: nenhuma chave real committed; `.env.local` no `.gitignore`.

Critérios de pronto:
- Arquivo exemplo presente, com valores placeholder e comentário por variável.
- README/CONTRIBUTING aponta como obter cada chave.

**Test Strategy:**

Cenários de teste:
- [ ] Copiar `.env.local.example` para `.env.local` permite `npm run build` local (com chaves dummy quando suficientes).
- [ ] `git grep` não encontra chaves reais no repo.

Validações técnicas:
- [ ] Todas as envs citadas na Tech Spec listadas no exemplo.
- [ ] `.gitignore` protege arquivos `.env*` locais.

## Subtasks

### 2.1. Criar arquivo .env.local.example e garantir que .env.local esteja no .gitignore

**Status:** pending  
**Dependencies:** None  

Estabelecer a base para a documentação de variáveis de ambiente criando o arquivo de exemplo e garantindo que os segredos locais não sejam enviados para o repositório.

**Details:**

Crie um novo arquivo chamado `.env.local.example` na raiz do projeto. Verifique o arquivo `.gitignore` para confirmar que a entrada `.env.local` já existe. Se não existir, adicione-a para prevenir o commit de variáveis de ambiente locais.

### 2.2. Adicionar variáveis de ambiente do Supabase e Sentry

**Status:** pending  
**Dependencies:** 2.1  

Catalogar e documentar as variáveis de ambiente necessárias para a integração com o Supabase e o Sentry no arquivo de exemplo.

**Details:**

Adicione as seguintes variáveis ao `.env.local.example` com valores de exemplo e comentários explicativos sobre sua finalidade: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`.

### 2.3. Adicionar variáveis de ambiente do Stripe

**Status:** pending  
**Dependencies:** 2.1  

Documentar todas as chaves e configurações do Stripe, incluindo chaves de API, segredo do webhook e IDs dos planos de preços.

**Details:**

Edite o arquivo `.env.local.example` para incluir as variáveis do Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`. Use valores de exemplo como 'sk_test_...' e 'price_...' e adicione comentários sobre onde encontrá-los no dashboard do Stripe.

### 2.4. Adicionar variáveis de ambiente de integrações (Telegram, ML, ScrapingBee)

**Status:** pending  
**Dependencies:** 2.1  

Catalogar as chaves de API e configurações para serviços de terceiros como Telegram, Mercado Livre e ScrapingBee.

**Details:**

Acrescente ao `.env.local.example` as variáveis para integrações: `TELEGRAM_BOT_TOKEN`, `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REFRESH_TOKEN`, `SCRAPINGBEE_API_KEY`. Inclua placeholders e comentários indicando a origem de cada chave.

### 2.5. Adicionar variáveis de cron, feature flags e documentar obtenção das chaves no README

**Status:** pending  
**Dependencies:** 2.2, 2.3, 2.4  

Finalizar o arquivo de exemplo com o segredo do cron e as feature flags, e criar uma seção no README.md explicando como obter todas as chaves.

**Details:**

Adicione as últimas variáveis ao `.env.local.example`: `CRON_SECRET`, `MAGALU_SCRAPE_MODE`, `ENABLE_TELEGRAM_ALERTS`, `ENABLE_SHOPEE_LIVE`, `ENABLE_TIKTOK_LIVE`. Em seguida, crie uma nova seção 'Configuração de Ambiente' no `README.md` detalhando o passo a passo para um novo desenvolvedor obter cada uma das variáveis listadas no arquivo de exemplo.
