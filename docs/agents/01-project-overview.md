# 01-project-overview.md: Visão Geral do Projeto

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [02-technology-stack.md](02-technology-stack.md) | [06-domain-model.md](06-domain-model.md)

## Visão Geral

O **Avisus** (avisus.app) é uma plataforma de inteligência de preços para revendedores brasileiros. Rastreia automaticamente ofertas e descontos nos principais marketplaces (Mercado Livre, Magazine Luiza, Shopee, etc.), identifica oportunidades relevantes para o perfil de cada revendedor e o notifica em tempo real via Telegram e web dashboard (WhatsApp planejado para pós-MVP).

O modelo de negócio é **freemium** em três camadas: FREE, STARTER e PRO.

## Escopo

- **Inclui:** Web app (dashboard + perfil + interesses + alertas + favoritos + planos), scanner de marketplaces, pipeline de margem, notificações Telegram, monitoramento de lives, assinaturas Stripe
- **Não inclui:** App mobile nativo, compra integrada, gestão de estoque, monitoramento de conteúdo de lives com IA
- **Público-alvo da doc:** Solo dev + assistentes de IA

## Problema Resolvido

Revendedores que dependem de comprar produtos com desconto para revender enfrentam a fragmentação das fontes de oportunidades. Cupons, promoções relâmpago e descontos surgem e desaparecem rapidamente. O Avisus automatiza essa vigilância:

1. **Scanner** varre marketplaces a cada 5 min (PRO) / 30 min (STARTER) / 2h (FREE)
2. **Margem estimada** calcula custo real (preço + frete) vs. melhor margem líquida por canal de revenda
3. **Notificação push** via Telegram com dados acionáveis (custo, margem, qualidade, link direto)
4. **Live Monitor** detecta início de transmissões ao vivo de vendedores favoritos (Shopee/TikTok) em até 2 min

## Persona Principal

**"Carlos, o Revendedor"** — pessoa física ou micro-empreendedor que compra com desconto e revende localmente ou online. Usa celular como ferramenta principal. Valoriza rapidez e praticidade.

**Fluxo principal:** Cadastro → Definir interesses → Receber primeiro alerta → Clicar → Comprar. Tempo entre cadastro e primeiro valor < 24h.

## Modelo Freemium


| Recurso               | FREE                    | STARTER           | PRO                      |
| --------------------- | ----------------------- | ----------------- | ------------------------ |
| Termos de interesse   | 5                       | Ilimitados        | Ilimitados               |
| Alertas/dia           | 5 (ofertas + lives)     | Ilimitados        | Ilimitados               |
| Frequência de scan    | 2h                      | 30 min            | 5 min                    |
| Histórico de preços   | 7 dias                  | 30 dias           | 90 dias                  |
| Vendedores favoritos  | 3                       | 15                | Ilimitados               |
| Alertas de live       | Contam no limite diário | Ilimitados        | Ilimitados               |
| Quality badge         | Sim                     | Sim               | Sim                      |
| Score de oportunidade | Não                     | Básico (pós-MVP)  | Completo c/ IA (pós-MVP) |
| Tendências de preço   | Não                     | 30 dias (pós-MVP) | 90 dias (pós-MVP)        |


## Features do MVP


| ID  | Feature                                                              | Status MVP                 |
| --- | -------------------------------------------------------------------- | -------------------------- |
| F01 | Cadastro de Perfil de Interesse                                      | Must Have                  |
| F02 | Scanner de Marketplaces (ML + Magalu)                                | Must Have (2 marketplaces) |
| F03 | Cálculo de Margem Estimada + quality badge                           | Must Have                  |
| F04 | Notificações Push (Telegram + silêncio)                              | Must Have (parcial)        |
| F05 | Dashboard de Oportunidades (filtros + ordenação + comprei/dismissed) | Must Have                  |
| F06 | Gestão de Planos (FREE / STARTER / PRO)                              | Must Have                  |
| F09 | Indicador HOT (top 30% margem)                                       | Must Have                  |
| F13 | Perfil Simplificado + LGPD                                           | Must Have                  |
| F14 | Alerta de Início de Live                                             | Must Have                  |
| —   | Coleta price_history (pré-req F08)                                   | Must Have (invisível)      |


### Should Have (pós-MVP imediato)

- Terceiro marketplace no scanner — Shopee (F02 completo)
- Notificação via WhatsApp (F04 completo)
- Cadastro de região e filtro básico por localização (F07 parcial)
- Tendências de preço com janela por plano — 30d STARTER, 90d PRO (F10)
- Score básico de oportunidade — margem + desconto (F08 parcial / STARTER) — requer ~60 dias de dados
- Métricas de engajamento em lives — UI analytics (F14 parcial / PRO)

### Fora do MVP

- Score inteligente completo com IA (F08 completo) — apenas coleta de dados no MVP
- Sazonalidade (F11), Sugestão de Volume (F12)
- Sugestão de categorias populares no onboarding (RF-02 — Could Have)
- Preview de ofertas ao digitar interesses
- Frete estimado integrado + teto de frete configurável (F07 completo)

## Restrições do Projeto

- **Desenvolvedor solo**, prazo de 4 semanas
- **Custo operacional:** ~$69/mês (Vercel Pro $20 + ScrapingBee $49 + serviços gratuitos)
- **Serverless-first:** sem VMs, Docker ou processos long-running em produção
- **LGPD:** dados pessoais tratados conforme regulamentação, exclusão via cascade

## Notas de Alinhamento

> Este overview segue a **Tech Spec** como fonte de verdade para o escopo do MVP. A Tech Spec documenta desvios conscientes do PRD na seção "Desvios do PRD e Justificativas" (D1–D14).

**Itens promovidos pela Tech Spec (PRD → MVP):**

| Desvio | Item | PRD classifica como | Justificativa Tech Spec |
|--------|------|---------------------|------------------------|
| D7 | Horário de silêncio | Should Have | Essencial para Telegram (notificar às 3h destrói percepção) |
| D7 | Filtros e ordenação no dashboard | Should Have | UI já existe no protótipo; dashboard sem filtro é catálogo estático |
| D12 | Quality badge (indicador visual) | Should Have | Implementação trivial (~2h); badge já existe no protótipo |
| D14 | Ações comprei/dismissed (UI básica) | Could Have | ~4h de trabalho; coleta dados valiosos desde o dia 1 |

**Inconsistência interna do PRD:** RF-04 afirma "pelo menos 3 marketplaces no MVP", mas a priorização define 2 marketplaces como Must Have (D11). Este overview segue a priorização.

## Documentos de Referência


| Documento     | Caminho                                                    |
| ------------- | ---------------------------------------------------------- |
| PRD           | `.tasks/avisus-mvp/prd.md`                                 |
| Tech Spec     | `.tasks/avisus-mvp/tech-spec.md`                           |
| Design System | `docs/design-system.md`                                    |
| Protótipo UI  | `src/prototype.jsx` (~5.200 linhas JSX, React 19 + Vite 8) |


## Evidências do Codebase

- `package.json` — React 19.2.5, Vite 8.0.8 (estado atual do protótipo)
- `src/prototype.jsx` — Protótipo monolítico com mock data e toda a UI implementada
- `src/main.jsx` — Entrypoint do protótipo
- `docs/design-system.md` — Design system com paleta, tipografia Montserrat, componentes
- `public/assets/marketplaces/` — Logos SVG de ML, Shopee, Magalu

---

*Retornar ao [Índice Principal](AGENTS.md) | Próximo: [02-technology-stack.md*](02-technology-stack.md)