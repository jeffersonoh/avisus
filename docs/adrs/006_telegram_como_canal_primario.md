# ADR 006: Telegram como canal primário de notificação no MVP

## Status

Aceita

## Data

2026-04-16

## Contexto

A proposta de valor central do Avisus é notificar oportunidades e o início de lives em **tempo real**. O canal de notificação é crítico: precisa ser push, universalmente acessível no celular do revendedor e viável de integrar em 4 semanas por um solo dev. O PRD menciona WhatsApp como canal preferencial dos revendedores brasileiros, mas a realidade técnica é desfavorável para o MVP.

- **WhatsApp Business API (Meta):** exige aprovação de conta, templates pré-aprovados, custo por conversa e parceiro BSP. Inviável para MVP.
- **Evolution API (não oficial):** depende de WhatsApp Web, pode ser banido, sem SLA.
- **SMS:** custo por mensagem, sem rich links confiáveis.
- **Push Web nativo:** exige service worker + permissão + estado online; entrega errática em iOS PWA.

## Decisão

Adotar o **Telegram Bot API** como canal primário de notificação do MVP. Integração via bot criado no BotFather; usuário conecta o Telegram por deep link (`t.me/<bot>?start=<codigo>`), o webhook recebe o `/start` e persiste o `chat_id` real para envio. O `@username` é apenas metadado visual e não deve ser usado como identificador de entrega.

- **API:** `api.telegram.org/bot{token}/sendMessage` com `parse_mode=HTML`
- **Conexão:** `/api/telegram/webhook` recebe eventos do bot e vincula `profiles.telegram_chat_id`
- **Rate limit:** 30 mensagens/segundo (muito acima do volume projetado)
- **Templates:** oferta (custo, margem, qualidade, link direto) e live (plataforma, título, link)
- **Retry:** 3 tentativas (`alerts.attempts`); após falha final `status = 'failed'`
- **Feature flag:** `ENABLE_TELEGRAM_ALERTS=false` em staging/dev para evitar envios reais
- **Variável secreta:** `TELEGRAM_BOT_TOKEN`
- **Variáveis:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`
- **Regra CA-24 para lives:** alertas em horário de silêncio são **descartados**, não enfileirados
- **Canal "web":** alertas também são gravados em `alerts`/`live_alerts` e ficam visíveis na UI, independente do Telegram

## Alternativas Consideradas

- **WhatsApp Business API (Meta BSP)** → adiada para pós-MVP por custo, fricção de aprovação e templates pré-aprovados
- **Evolution API (WhatsApp Web não oficial)** → descartada pelo risco de ban e ausência de SLA; incompatível com LGPD do projeto
- **SMS (Twilio/Zenvia)** → descartada pelo custo por mensagem e UX inferior (sem formatação, links encurtados)
- **E-mail** → descartada por latência e baixa taxa de abertura no perfil de uso (mobile-first, alerta reativo)

## Consequências

**Positivas:**

- API gratuita, documentada e estável; pode ser integrada em horas
- Mensagens com `parse_mode=HTML`, emojis e deep links — ótima UX mobile
- Rate limit folgado para o volume do MVP
- Usuário controla opt-in informando explicitamente `@username`

**Negativas:**

- Telegram tem penetração inferior ao WhatsApp no público-alvo brasileiro — impacto direto na conversão
- Depende de o revendedor já ter ou criar conta Telegram
- Falhas de entrega (usuário bloqueou bot, não iniciou conversa) precisam de UX para reabilitar
- O usuário precisa tocar em **Iniciar** no bot para concluir o vínculo; sem isso, o canal Telegram não é ativado
- Não cobre o canal preferido do PRD; reabertura como follow-up pós-MVP

**Neutras:**

- O modelo (`alerts`, `live_alerts`) é agnóstico ao canal via `alert_channels TEXT[]`; adicionar WhatsApp posteriormente é incremental

## Referências

- Integração Telegram: `docs/agents/09-integrations.md` (seção 3)
- Modelo de alertas e tabela `alerts`: `docs/agents/06-domain-model.md`
- Overview e desvios do PRD: `docs/agents/01-project-overview.md`
- Feature flags: `docs/agents/12-troubleshooting.md`

> Todo ADR deve ter no máximo uma página.
