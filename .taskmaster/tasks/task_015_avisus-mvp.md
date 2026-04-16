# Task ID: 15

**Title:** Feature notifications — página Alertas com canais e silêncio

**Status:** pending

**Dependencies:** 12

**Priority:** high

**Description:** Implementar listagem de alertas e configuração de canais (Telegram/web) e horário de silêncio (`silence_start` / `silence_end`) persistidos em profiles (desvio D7).

**Details:**

Contexto:
- Equivalente a T-033 (tasks.md). F04 do PRD (RF-10/11/12).

Escopo:
- `src/features/notifications/`: `AlertList.tsx`, `ChannelConfig.tsx`, `hooks.ts`.
- Listar `alerts` + `live_alerts` unificados (tipo `AlertType = 'opportunity' | 'live'`).
- Configurar canais (`alert_channels`) e horário de silêncio.

Fora de escopo:
- Envio real via Telegram (T-060).
- Métricas de engajamento (T-073, fora da UI conforme D8).

Implementação:
- Arquivos/módulos: `src/features/notifications/*.tsx`, `src/app/(app)/alertas/page.tsx`.
- Regras e validações: toggle por canal; inputs time (HH:mm) com validação; feedback "Salvo".

Critérios de pronto:
- Alterar silêncio persiste em `profiles.silence_start/silence_end`.
- Lista mostra ofertas e lives ordenadas por data.

**Test Strategy:**

Cenários de teste:
- [ ] Definir silêncio 22:00→07:00 e confirmar persistência.
- [ ] Alternar canal Telegram off desabilita envio futuro.
- [ ] Lista diferencia alertas de oferta e live visualmente.

Validações técnicas:
- [ ] Time validado (formato HH:mm).
- [ ] Feedback visual "Salvo" aparece e some em ~2s.

## Subtasks

### 15.1. Implementar Componente de Configuração de Canais e Horário de Silêncio (`ChannelConfig`)

**Status:** pending  
**Dependencies:** None  

Desenvolver o componente React `ChannelConfig.tsx` para permitir que o usuário ative/desative canais de notificação (Telegram, web) e defina um horário de silêncio (início e fim) usando inputs de tempo.

**Details:**

Criar a UI com toggles para os canais e dois inputs de tempo (HH:mm) para o horário de silêncio. Incluir validação de formato para os inputs de tempo e gerenciar o estado localmente antes da persistência.

### 15.2. Implementar Lista Unificada de Alertas (`AlertList`)

**Status:** pending  
**Dependencies:** None  

Criar o componente `AlertList.tsx` que busca e exibe uma lista unificada de `alerts` (oportunidades) e `live_alerts` (lives), ordenados por data de criação de forma decrescente.

**Details:**

Desenvolver a lógica no hook `useAlerts` para unificar os dois tipos de alertas. O componente `AlertList` deve iterar sobre a lista unificada e renderizar cada item, diferenciando visualmente entre um alerta de oportunidade e um alerta de live.

### 15.3. Implementar Lógica de Persistência e Feedback para Configurações de Notificação

**Status:** pending  
**Dependencies:** 15.1  

Conectar o componente `ChannelConfig` ao backend para salvar as configurações de canais e horário de silêncio no perfil do usuário. Implementar um feedback visual, como uma mensagem 'Salvo!', após a conclusão bem-sucedida da operação.

**Details:**

Criar uma Server Action ou mutação no hook correspondente para atualizar os campos `alert_channels`, `silence_start`, e `silence_end` na tabela `profiles`. Ao salvar, exibir uma notificação temporária (toast) ou texto de feedback na UI.
