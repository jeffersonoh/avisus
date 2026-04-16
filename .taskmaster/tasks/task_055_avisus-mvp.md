# Task ID: 55

**Title:** Checklist pós-deploy copiado para runbook interno

**Status:** pending

**Dependencies:** 54

**Priority:** medium

**Description:** Copiar o checklist da Tech Spec para `docs/runbook.md`, permitindo que o time marque itens a cada release.

**Details:**

Contexto:
- Equivalente a T-104 (tasks.md). Checklist operacional para releases.

Escopo:
- `docs/runbook.md` com seções: pré-deploy, pós-deploy, rollback.
- Checklist extraído da Tech Spec §Deploy.

Fora de escopo:
- Automação do runbook (pós-MVP).

Implementação:
- Arquivos/módulos: `docs/runbook.md`.
- Regras e validações: referenciar troubleshooting em `docs/agents/12-troubleshooting.md`.

Critérios de pronto:
- Runbook acessível e citado no CONTRIBUTING.
- Primeira release usa o checklist.

**Test Strategy:**

Cenários de teste:
- [ ] Time consegue seguir o checklist completo em release de staging.
- [ ] Rollback seguindo o runbook funciona.

Validações técnicas:
- [ ] Markdown lint OK.
- [ ] Links internos funcionam.

## Subtasks

### 55.1. Criar e Estruturar o Arquivo `docs/runbook.md`

**Status:** pending  
**Dependencies:** None  

Criar o novo arquivo de documentação `docs/runbook.md` e adicionar os cabeçalhos principais para as seções: Pré-Deploy, Pós-Deploy e Rollback.

**Details:**

Crie o arquivo `docs/runbook.md`. Adicione os títulos de nível 2 (##) para 'Checklist Pré-Deploy', 'Checklist Pós-Deploy' e 'Plano de Rollback', estabelecendo a estrutura básica do documento.

### 55.2. Adicionar o Checklist de Pré-Deploy ao Runbook

**Status:** pending  
**Dependencies:** 55.1  

Copiar o checklist de atividades a serem executadas antes do deploy da Tech Spec e adicioná-lo à seção 'Pré-Deploy' do `docs/runbook.md`.

**Details:**

Preencha a seção '## Checklist Pré-Deploy' com itens como: verificação de migrations, backup do banco de dados, comunicação ao time e confirmação de que a pipeline de CI está verde. Use a sintaxe de checklist do Markdown (`- [ ]`).

### 55.3. Adicionar o Checklist de Pós-Deploy e Referência de Troubleshooting

**Status:** pending  
**Dependencies:** 55.1  

Preencher a seção 'Pós-Deploy' com o checklist de verificação pós-release e adicionar um link para o guia de troubleshooting `docs/agents/12-troubleshooting.md`.

**Details:**

Na seção '## Checklist Pós-Deploy', adicione itens como: verificar logs da aplicação, realizar smoke tests em funcionalidades críticas e monitorar métricas. Inclua uma nota com um link para `docs/agents/12-troubleshooting.md`.

### 55.4. Detalhar o Plano de Rollback no Runbook

**Status:** pending  
**Dependencies:** 55.1  

Elaborar e documentar os passos necessários para reverter um deploy com falha na seção 'Plano de Rollback' do `docs/runbook.md`.

**Details:**

Na seção '## Plano de Rollback', descreva o procedimento passo a passo para reverter a versão. Inclua comandos para reverter a aplicação (ex: re-deploy da tag anterior) e como lidar com migrations (rollback ou forward-fix).

### 55.5. Atualizar `CONTRIBUTING.md` para Referenciar o Novo Runbook

**Status:** pending  
**Dependencies:** 55.1, 55.2, 55.3, 55.4  

Editar o arquivo `CONTRIBUTING.md` para incluir um link e uma breve descrição do `docs/runbook.md`, garantindo que o time saiba de sua existência e quando usá-lo.

**Details:**

Localize o arquivo `CONTRIBUTING.md`. Adicione uma nova seção ou item, como 'Processo de Release', explicando que o `docs/runbook.md` deve ser seguido durante os deploys. Inclua um link relativo para o arquivo.
