# Task ID: 17

**Title:** Feature profile com integração IBGE e LGPD

**Status:** done

**Dependencies:** 12

**Priority:** high

**Description:** Formulário de perfil (nome, email, telefone, UF/cidade via API IBGE, telegram_username, alert_channels, consentimento LGPD) com feedback "Salvo" e card de plano.

**Details:**

Contexto:
- Equivalente a T-035 (tasks.md). F13 (RF-45 a RF-51) + CA-20.

Escopo:
- `src/features/profile/`: `ProfileForm.tsx`, `ProfileCompleteness.tsx` (RF-48), `RegionSelector.tsx` (IBGE), `hooks.ts` (`useProfile`, `useIBGE`, `useCompleteness`).
- API IBGE: buscar cidades ao trocar UF (`https://servicodados.ibge.gov.br/api/v1/localidades/estados/<UF>/municipios`).
- Indicação LGPD com link para política.
- Card de plano ativo com CTA Upgrade vs "Planos" (CA-18).

Fora de escopo:
- Margem de revenda customizada (T-038).

Implementação:
- Arquivos/módulos: `src/features/profile/*.tsx`, `src/app/(app)/perfil/page.tsx`, `src/lib/ibge.ts`.
- Regras e validações: TanStack Query com `staleTime: 24h` para IBGE (T-091); cidades em cache por UF.

Critérios de pronto:
- Trocar UF carrega cidades automaticamente (CA-20).
- Feedback "Salvo" aparece ao alterar qualquer campo.
- Barra de completude considera apenas campos RF-48.

**Test Strategy:**

Cenários de teste:
- [ ] UF = SC carrega cidades incluindo Florianópolis.
- [ ] Salvar campo exibe "Salvo" por 2s.
- [ ] Usuário PRO vê card com CTA "Planos".

Validações técnicas:
- [ ] Requests IBGE cacheados (não refetch a cada render).
- [ ] Conformidade LGPD visível com link.

## Subtasks

### 17.1. Criar o formulário de perfil (ProfileForm) com campos básicos e lógica de salvamento

**Status:** done  
**Dependencies:** None  

Implementar a estrutura inicial do `ProfileForm.tsx` contendo os campos de dados básicos do usuário (nome, email, telefone, telegram_username) e o checkbox de consentimento LGPD. Incluir a lógica de salvamento automático com feedback 'Salvo'.

**Details:**

Criar o componente `ProfileForm` e um hook `useProfile` para gerenciar o estado e as mutações. A cada alteração em um campo, uma função de salvamento deve ser chamada, exibindo um feedback visual para o usuário.

### 17.2. Desenvolver e integrar o seletor de região (RegionSelector) com API do IBGE

**Status:** done  
**Dependencies:** 17.1  

Criar o componente `RegionSelector.tsx` para buscar estados e cidades da API do IBGE. O seletor de cidades deve ser atualizado dinamicamente com base no estado selecionado. Integrar este componente ao `ProfileForm`.

**Details:**

Utilizar TanStack Query com caching (`staleTime: 24h`) para as requisições à API do IBGE. Criar um hook `useIBGE` para encapsular essa lógica. O componente `RegionSelector` deve ser adicionado ao `ProfileForm` e seu valor conectado à lógica de salvamento geral.

### 17.3. Implementar o indicador de completude do perfil (ProfileCompleteness)

**Status:** done  
**Dependencies:** 17.1  

Desenvolver o componente `ProfileCompleteness.tsx` que exibe uma barra de progresso visual indicando o quão completo está o perfil do usuário, com base nos campos definidos no requisito RF-48.

**Details:**

Criar um hook `useCompleteness` que recebe os dados do perfil e calcula a porcentagem de preenchimento. O componente `ProfileCompleteness` usará este hook para renderizar a barra de progresso de forma reativa.

### 17.4. Adicionar o card do plano atual do usuário com CTA de upgrade

**Status:** done  
**Dependencies:** None  

Implementar um componente de card que exibe o plano de assinatura ativo do usuário (ex: FREE, PRO). O card deve conter um botão de Call to Action (CTA) que muda dinamicamente para 'Upgrade' ou 'Gerenciar Planos'.

**Details:**

O componente buscará os dados do plano do usuário. Se o usuário não estiver no plano mais alto, o CTA deve levar para a página de planos (`/planos`). Caso contrário, pode ser um link para gerenciar a assinatura.
