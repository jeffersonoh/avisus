# PRD: Dashboard Administrativo

## Visão Geral

O Dashboard Administrativo é uma área interna do Avisus acessível apenas ao administrador da plataforma. Ele centraliza métricas operacionais essenciais — usuários ativos, termos de interesse populares, distribuição de planos e engajamento com alertas — e permite ações de gestão de usuários sem depender de ferramentas externas como Supabase Studio ou Stripe.

O problema que resolve é a falta de visibilidade consolidada sobre a saúde da plataforma para um desenvolvedor solo que precisa tomar decisões rápidas de operação (promover plano, banir usuário, entender adoção) sem alternar entre múltiplos painéis externos.

## Objetivos

- Fornecer ao administrador uma visão consolidada do estado da plataforma em uma única tela
- Reduzir o tempo necessário para executar ações operacionais recorrentes (alterar plano, banir usuário) de minutos para segundos
- Permitir exportação de dados brutos para análises pontuais sem acesso direto ao banco
- **Métrica de sucesso:** 100% das ações de gestão de usuário realizáveis sem sair do Avisus

## Premissas

- Existe exatamente um administrador (Jefferson); não há necessidade de múltiplos roles admin
- O controle de acesso é binário: `is_admin = true` no perfil do Supabase
- Os dados exibidos são totais agregados — sem séries históricas ou gráficos de evolução
- Ações financeiras (reembolsos, cancelamentos) continuam sendo feitas no painel do Stripe
- Logs de infra e erros de scanner continuam no Vercel/Sentry

## Histórias de Usuário

- Como administrador, quero ver quantos usuários estão ativos na plataforma para avaliar crescimento e saúde geral
- Como administrador, quero ver quais termos de interesse são mais cadastrados para entender o perfil da base e otimizar o scanner
- Como administrador, quero ver a distribuição de usuários por plano (FREE/STARTER/PRO) para estimar receita e taxa de conversão
- Como administrador, quero ver métricas de engajamento com alertas para avaliar se os usuários estão clicando e comprando
- Como administrador, quero acessar o perfil detalhado de qualquer usuário para entender seu uso e resolver suporte
- Como administrador, quero alterar o plano de um usuário manualmente para corrigir erros de pagamento ou conceder acesso de cortesia
- Como administrador, quero desativar um usuário que viole os termos de uso sem precisar acessar o Supabase Studio
- Como administrador, quero exportar um CSV de usuários ou alertas para análises pontuais fora da plataforma

## Funcionalidades Principais

### F01 — Painel de Métricas Agregadas

Exibe totais operacionais sem série histórica:

- Total de usuários cadastrados
- Usuários ativos nos últimos 7 dias e 30 dias (com base em `last_active_at` ou uso de alertas)
- Novos cadastros no mês corrente
- Distribuição por plano: contagem de FREE, STARTER e PRO
- MRR estimado (STARTER × preço + PRO × preço — sem integração Stripe)
- Total de termos de interesse cadastrados
- Top 10 termos mais populares na base
- Total de alertas enviados no dia e no mês
- Taxa de clique geral (`clicked_at not null / total alertas`)
- Contagem de ações `comprei` e `dismissed`

**RF-01:** O painel exibe todos os totais acima em uma única visualização sem paginação.
**RF-02:** Os valores refletem o estado atual do banco no momento do carregamento da página.

### F02 — Lista e Busca de Usuários

Tabela com todos os usuários cadastrados:

- Nome, e-mail, plano atual, data de cadastro, status (ativo/banido)
- Busca por nome ou e-mail
- Ordenação por data de cadastro e por plano
- Paginação (50 itens por página)

**RF-03:** A listagem suporta busca por nome ou e-mail parcial.
**RF-04:** O administrador pode ordenar a lista por data de cadastro (asc/desc) e plano.

### F03 — Detalhe de Usuário

Tela de detalhe acessível ao clicar em qualquer usuário da lista:

- Dados do perfil: nome, e-mail, plano, data de cadastro, Telegram conectado (sim/não)
- Lista de termos de interesse cadastrados pelo usuário
- Contagem de alertas recebidos, clicados, dismissed e comprei
- Histórico das últimas ações do usuário (últimos alertas com status)

**RF-05:** O detalhe exibe todos os campos acima sem necessidade de acesso externo ao banco.

### F04 — Ações de Gestão de Usuário

Disponíveis na tela de detalhe:

- **Alterar plano:** selecionar FREE, STARTER ou PRO e salvar — atualiza `plan` diretamente no banco sem passar pelo Stripe
- **Desativar/reativar usuário:** marca `is_banned = true/false` — o usuário banido não consegue fazer login nem receber alertas
- **Exportar dados do usuário:** baixa CSV com perfil + termos + alertas desse usuário (para fins de suporte ou LGPD)

**RF-06:** Alteração de plano exige confirmação explícita (diálogo de confirmação) antes de salvar.
**RF-07:** Banimento exige confirmação explícita com campo de motivo (texto livre, armazenado internamente).
**RF-08:** Ação de banimento é reversível pelo administrador a qualquer momento.

### F05 — Exportação de Dados

Disponível no painel principal:

- **Exportar usuários:** CSV com todos os usuários (nome, e-mail, plano, data de cadastro, status)
- **Exportar alertas:** CSV com alertas do período (configurável: hoje, 7d, 30d)
- **Exportar termos:** CSV com todos os termos cadastrados e frequência

**RF-09:** Exportações são geradas sob demanda e baixadas diretamente pelo browser.

## Critérios de Aceite

- **CA-01:** Dado que o administrador acessa `/admin`, quando está autenticado com `is_admin = true`, então vê o painel de métricas sem redirecionamento
- **CA-02:** Dado que um usuário sem `is_admin = true` tenta acessar `/admin`, quando a rota é carregada, então é redirecionado para `/dashboard` com erro 403
- **CA-03:** Dado que o administrador está no painel, quando a página carrega, então todos os totais de RF-01 são exibidos corretamente
- **CA-04:** Dado que o administrador busca um usuário por e-mail parcial, quando digita ao menos 3 caracteres, então a lista filtra em tempo real
- **CA-05:** Dado que o administrador altera o plano de um usuário, quando confirma no diálogo, então o plano é atualizado e a mudança é visível imediatamente na listagem
- **CA-06:** Dado que o administrador bane um usuário, quando confirma com motivo, então o usuário não consegue mais fazer login na plataforma
- **CA-07:** Dado que o administrador solicita exportação de usuários, quando clica em "Exportar CSV", então o arquivo é baixado com todos os campos esperados e sem dados de senha ou tokens
- **CA-08:** Dado que um usuário está banido, quando o administrador clica em "Reativar", então o acesso é restaurado imediatamente

## Experiência do Usuário

**Persona:** Jefferson (administrador solo) — acessa esporadicamente para checar saúde da plataforma, resolver suporte ou corrigir planos. Usa desktop. Prioriza eficiência: quer ver o que precisa sem scroll excessivo ou múltiplas telas.

**Fluxo principal:**
1. Acessa `/admin` → vê painel de métricas em uma tela
2. Identifica usuário com problema via busca → acessa detalhe
3. Executa ação (alterar plano ou banir) → confirma → volta à lista

**Considerações de UX:**
- Ações destrutivas (banir, alterar plano) devem ter diálogo de confirmação obrigatório
- Status de usuário banido deve ser visível na lista (badge/cor distinta)
- Exportações devem ter feedback visual de progresso (loading state)
- Interface em Português do Brasil, seguindo o design system do Avisus (CSS vars, cards, botões existentes)

## Restrições Técnicas de Alto Nível

- Acesso restrito por role `is_admin` verificado no servidor (middleware Next.js + RLS Supabase) — nunca apenas no cliente
- Alterações de plano feitas diretamente no banco não disparam webhooks do Stripe; devem ser registradas em log interno
- Exportações CSV geradas server-side para evitar exposição de dados sensíveis no cliente
- Dados sensíveis (tokens, hashes de senha) nunca devem aparecer nas exportações ou na UI
- Conformidade LGPD: exportação de dados de usuário deve ser disponível para atender requisições de portabilidade

## Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Alteração manual de plano desincronizar com Stripe | Alta | Médio | Registrar log da alteração com motivo; reconciliar periodicamente |
| Admin banir usuário errado sem revisão | Baixa | Alto | Confirmação obrigatória + campo de motivo + ação reversível |
| Exportação CSV expor dados sensíveis | Baixa | Alto | Geração server-side com lista explícita de campos permitidos |
| Acesso não autorizado à rota `/admin` | Baixa | Alto | Validação de `is_admin` no middleware, não apenas na UI |

## Fora de Escopo

- Gestão financeira: reembolsos, disputas e cancelamento de assinaturas (permanecem no Stripe)
- Logs de infra e erros de scanner (permanecem no Vercel e Sentry)
- Múltiplos roles de admin ou permissões granulares por funcionalidade
- Notificações automáticas para o admin (email/Telegram sobre eventos da plataforma)
- Gráficos e séries históricas (apenas totais agregados no MVP admin)
- Criação de usuários pelo admin (somente gestão de existentes)
- Gestão de conteúdo de alertas (editar ou reenviar alertas)

## Priorização

**Must have:**
- RF-01: Painel de métricas agregadas
- RF-02: Dados em tempo real ao carregar
- CA-01/CA-02: Controle de acesso por role admin
- RF-06/RF-07/RF-08: Ações de gestão com confirmação

**Should have:**
- RF-03/RF-04: Busca e ordenação na lista de usuários
- RF-05: Detalhe completo do usuário
- RF-09: Exportação CSV

**Could have:**
- Filtro de usuários por plano na listagem
- Histórico de ações do admin (audit log)
