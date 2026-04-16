# Task ID: 36

**Title:** Limite de 5 alertas/dia FREE com CTA de upgrade

**Status:** pending

**Dependencies:** 35

**Priority:** high

**Description:** Ao atingir 5 alertas no dia (ofertas + lives), não enviar push e destacar CTA de upgrade na UI (CA-03).

**Details:**

Contexto:
- Equivalente a T-062 (tasks.md). F04 (RF-12) + CA-03.

Escopo:
- Checar `alerts_sent_today` antes de enviar (ofertas e lives).
- Marcar como `skipped_limit` em `live_alerts` e `silenced` em `alerts` quando exceder (ou não criar).
- UI Alertas: banner/CTA prominente quando limite atingido.

Fora de escopo:
- Upgrade direto pela UI (já existe em Planos — T-018).

Implementação:
- Arquivos/módulos: `src/lib/scanner/alert-sender.ts`, `src/features/notifications/UpgradeCTA.tsx`.
- Regras e validações: contagem atômica via função SQL; fuso horário correto.

Critérios de pronto:
- Usuário FREE com 5 alertas hoje não recebe o 6º.
- UI destaca CTA com gradiente e ícone.

**Test Strategy:**

Cenários de teste:
- [ ] Criar 5 alerts hoje → 6º marcado como `skipped_limit` (live) ou bloqueado (oferta).
- [ ] CTA aparece somente quando limite atingido.

Validações técnicas:
- [ ] `alerts_sent_today` chamado apenas no servidor.
- [ ] CTA tem aria-label para acessibilidade.

## Subtasks

### 36.1. Backend: Implementar verificação de limite de 5 alertas/dia

**Status:** pending  
**Dependencies:** None  

No `alert-sender`, adicionar a lógica para consultar a função `alerts_sent_today` antes de enviar um alerta para um usuário do plano FREE. Se o limite de 5 alertas for atingido, o novo alerta deve ser devidamente marcado e não enviado.

**Details:**

Modificar `src/lib/scanner/alert-sender.ts`. Antes de enfileirar o envio, verificar o plano do usuário. Se for FREE, chamar a função SQL `alerts_sent_today`. Se a contagem for >= 5, marcar `live_alerts` como `skipped_limit` ou `alerts` como `silenced` e interromper o fluxo de envio.

### 36.2. Frontend: Exibir CTA de upgrade ao atingir o limite de alertas

**Status:** pending  
**Dependencies:** 36.1  

Criar um componente de UI que exibe um banner/CTA proeminente na tela de Alertas quando um usuário do plano FREE atinge o seu limite diário de 5 alertas.

**Details:**

Desenvolver o componente `src/features/notifications/UpgradeCTA.tsx`. Este componente deve obter o estado do limite do usuário (se atingido ou não) e, caso positivo, renderizar um banner visualmente destacado com um gradiente, ícone e um chamado para ação que redirecione para a página de planos.
