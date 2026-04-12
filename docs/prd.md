# PRD — Avisus (avisus.app) — Plataforma de Inteligência para Revendedores

## Visão Geral

Revendedores que dependem de comprar produtos com desconto para revender com margem enfrentam um problema crescente: a fragmentação das fontes de oportunidades. Cupons, promoções relâmpago e descontos em marketplaces como Mercado Livre, Shopee e Magazine Luiza surgem e desaparecem rapidamente, e o revendedor que não monitora constantemente perde oportunidades de lucro.

Esta plataforma — **Avisus** (avisus.app) — resolve esse problema ao rastrear automaticamente ofertas e descontos nos principais marketplaces brasileiros, identificar oportunidades relevantes para o perfil de cada revendedor e notificá-lo em tempo real — permitindo que compre com desconto e revenda com margem superior.

O Avisus segue modelo Freemium (gratuito limitado + plano pago) e entrega valor por dois canais: um web app com dashboard e um bot (Telegram/WhatsApp) como canal de notificação push.

## Objetivos

- **Reduzir o tempo de descoberta de oportunidades** de horas de monitoramento manual para notificações automáticas em minutos.
- **Aumentar a margem média do revendedor** ao apresentar preço de compra vs. preço estimado de revenda, permitindo decisões informadas.
- **Atingir 1.000 usuários cadastrados nos primeiros 3 meses** após lançamento do MVP.
- **Alcançar taxa de conversão freemium → pago de pelo menos 5%** nos primeiros 6 meses.
- **Métricas principais**: MAU (Monthly Active Users), taxa de abertura de alertas, conversão free→paid, NPS, quantidade de oportunidades identificadas por dia.

## Premissas

- Os marketplaces-alvo (Mercado Livre, Shopee, Magazine Luiza) possuem dados de preço e desconto acessíveis publicamente ou via APIs/programas de afiliados.
- O revendedor já possui conhecimento prático sobre os produtos que revende e sabe avaliar se uma oportunidade é viável para seu contexto.
- O preço de revenda estimado pode ser calculado com base em histórico de preços e preço médio praticado no mercado, sem garantia de venda ao valor sugerido.
- O volume de ofertas nos marketplaces-alvo é suficiente para gerar valor diário ao revendedor.
- O MVP não contempla monitoramento de lives em tempo real (TikTok Shop etc.) — isso é uma evolução futura.
- Dados de frete variam por vendedor, modalidade e região; o sistema trabalhará com estimativas baseadas nas informações disponíveis publicamente nos marketplaces, sem garantia de exatidão.

## Histórias de Usuário

**US-01** — Como revendedor, eu quero cadastrar os produtos ou categorias que me interessam para que o sistema monitore apenas o que é relevante para mim.

**US-02** — Como revendedor, eu quero receber notificações automáticas quando uma oportunidade de compra com desconto for identificada para que eu possa agir rapidamente antes que a oferta expire.

**US-03** — Como revendedor, eu quero ver o preço de compra ao lado do preço estimado de revenda para que eu saiba antecipadamente qual será minha margem aproximada.

**US-04** — Como revendedor, eu quero acessar um dashboard com as oportunidades ativas para que eu possa comparar e priorizar quais compras fazer.

**US-05** — Como revendedor no plano gratuito, eu quero entender o que o plano pago oferece a mais para que eu possa decidir se vale a pena assinar.

**US-06** — Como revendedor, eu quero configurar por qual canal desejo receber notificações (Telegram, WhatsApp ou apenas web) para que os alertas cheguem onde eu prefiro.

**US-07** — Como revendedor, eu quero marcar uma oportunidade como "comprada" para que o sistema aprenda melhor minhas preferências ao longo do tempo.

**US-08** — Como revendedor, eu quero filtrar oportunidades pela minha região para que eu veja apenas ofertas com frete viável e prazos de entrega compatíveis com a minha operação de revenda.

## Funcionalidades Principais

### F01 — Cadastro de Perfil de Interesse

Permite ao revendedor definir quais produtos, categorias ou palavras-chave deseja monitorar (ex: "parafusadeira", "PlayStation 5", "tênis Nike"). O perfil de interesse é a base para a filtragem e relevância dos alertas.

- **RF-01**: O sistema deve permitir o cadastro de pelo menos 5 termos de interesse no plano gratuito e ilimitados no plano pago.
- **RF-02**: O sistema deve sugerir categorias populares durante o cadastro inicial (onboarding).
- **RF-03**: O sistema deve permitir edição e exclusão de termos a qualquer momento.

### F02 — Scanner de Marketplaces

Motor de rastreamento que varre periodicamente os marketplaces-alvo em busca de produtos com desconto, cupons ativos ou promoções que correspondam aos perfis de interesse cadastrados.

- **RF-04**: O sistema deve monitorar pelo menos 3 marketplaces no MVP: Mercado Livre, Shopee e Magazine Luiza.
- **RF-05**: O sistema deve identificar ofertas com desconto igual ou superior a um percentual mínimo configurável pelo usuário (padrão: 15%).
- **RF-06**: O sistema deve atualizar as ofertas com frequência mínima de 30 minutos no plano pago e 2 horas no plano gratuito.

### F03 — Cálculo de Margem Estimada

Para cada oportunidade identificada, o sistema exibe o preço de compra atual e uma estimativa do preço de revenda praticado no mercado, calculando a margem bruta estimada.

- **RF-07**: O sistema deve exibir: preço atual, preço médio de mercado (sem desconto), percentual de desconto e margem bruta estimada.
- **RF-08**: O preço de revenda estimado deve ser baseado no preço médio praticado nos mesmos marketplaces nos últimos 30 dias.
- **RF-09**: O sistema deve exibir um indicador visual de qualidade da oportunidade (ex: "boa", "ótima", "excepcional") baseado na margem.

### F04 — Sistema de Notificações Push

Envia alertas automáticos ao revendedor quando oportunidades relevantes são detectadas, via bot em Telegram ou WhatsApp, além de notificação no web app.

- **RF-10**: O sistema deve enviar notificação push contendo: nome do produto, marketplace de origem, preço com desconto, margem estimada, frete estimado (quando disponível) e link direto para compra.
- **RF-11**: O sistema deve permitir configuração de horário de silêncio (não perturbe).
- **RF-12**: O sistema deve limitar a 5 alertas/dia no plano gratuito e ilimitados no plano pago.

### F05 — Dashboard de Oportunidades

Interface web onde o revendedor visualiza todas as oportunidades ativas, filtra por categoria, marketplace ou margem, e acessa links diretos de compra.

- **RF-13**: O dashboard deve listar oportunidades ativas com filtros por: categoria, marketplace, faixa de desconto, margem estimada e região.
- **RF-14**: O sistema deve permitir ordenação por margem, desconto ou data de detecção.
- **RF-15**: O sistema deve indicar a validade estimada da oferta (quando disponível).

### F06 — Gestão de Planos (Freemium)

Controle de acesso e limites de funcionalidade conforme o plano do usuário (gratuito vs. pago).

- **RF-16**: O plano gratuito deve permitir: até 5 termos de interesse, até 5 alertas/dia, frequência de scan de 2h.
- **RF-17**: O plano pago deve permitir: termos ilimitados, alertas ilimitados, frequência de scan de 30min, acesso a histórico de preços.
- **RF-18**: O sistema deve exibir indicações claras de funcionalidades bloqueadas no plano gratuito com CTA para upgrade.

### F07 — Filtragem por Região

Permite ao revendedor definir sua localização (estado, cidade ou CEP) para que o sistema priorize ofertas com frete viável, filtre vendedores por proximidade geográfica e considere o custo de frete na margem estimada. Isso é essencial porque o frete pode inviabilizar uma oportunidade aparentemente boa.

- **RF-19**: O sistema deve permitir que o revendedor cadastre sua região de atuação (estado e cidade) no perfil.
- **RF-20**: O sistema deve exibir o custo estimado de frete para a região do revendedor em cada oportunidade, quando a informação estiver disponível no marketplace.
- **RF-21**: O sistema deve permitir filtro de oportunidades por: "minha região", "meu estado", "frete grátis" e "todo o Brasil".
- **RF-22**: O sistema deve considerar o custo de frete no cálculo da margem estimada (margem líquida de frete), quando o dado de frete estiver disponível.
- **RF-23**: O sistema deve permitir que o revendedor defina um teto máximo de frete aceitável para filtrar oportunidades automaticamente.

## Critérios de Aceite

- **CA-01**: Dado que um revendedor cadastrou "parafusadeira" como interesse, quando o scanner detectar uma parafusadeira com desconto ≥ 15% na Shopee, então o revendedor deve receber uma notificação no canal configurado em até 10 minutos (plano pago).
- **CA-02**: Dado que uma oportunidade foi identificada, quando o revendedor visualizar o alerta, então deve ver: nome do produto, preço com desconto, preço médio de mercado, margem estimada e link direto.
- **CA-03**: Dado que um revendedor está no plano gratuito, quando ele atingir 5 alertas no dia, então não deve receber mais alertas até o dia seguinte, e deve ver uma mensagem sugerindo upgrade.
- **CA-04**: Dado que um revendedor configurou horário de silêncio das 22h às 7h, quando uma oportunidade for detectada às 23h, então a notificação deve ser enfileirada e entregue às 7h.
- **CA-05**: Dado que o revendedor acessa o dashboard, quando filtrar por "margem > 30%", então apenas oportunidades com margem estimada superior a 30% devem ser exibidas.
- **CA-06**: Dado que um revendedor cadastrou sua região como "Florianópolis/SC" e definiu teto de frete de R$ 30, quando uma oportunidade tiver frete estimado de R$ 45 para a região dele, então essa oportunidade não deve gerar notificação push (mas deve aparecer no dashboard com indicação de frete acima do teto).
- **CA-07**: Dado que um revendedor filtrar por "frete grátis" no dashboard, quando existirem oportunidades com frete grátis para a região dele, então apenas essas devem ser exibidas.

## Experiência do Usuário

**Persona primária — "Carlos, o Revendedor"**: Pessoa física ou micro-empreendedor que compra produtos com desconto em marketplaces e revende localmente ou em outros canais online. Usa o celular como ferramenta principal de trabalho. Valoriza rapidez e praticidade — não quer dashboards complexos, quer saber "o que comprar agora".

**Fluxo principal**: Cadastro → Definir interesses → Receber primeiro alerta → Clicar no link → Comprar. O tempo entre cadastro e primeiro valor entregue (primeiro alerta útil) deve ser inferior a 24 horas.

**Considerações de UX**:
- Mobile-first: a maioria dos revendedores opera pelo celular.
- Onboarding simplificado: máximo 3 passos até o primeiro interesse cadastrado.
- Alertas acionáveis: cada notificação deve conter informação suficiente para decisão imediata, sem exigir abrir o app.
- Linguagem acessível: evitar jargão técnico; usar termos como "margem", "lucro estimado", "desconto".

**Acessibilidade**: Contraste adequado, fontes legíveis em telas pequenas, navegação por teclado no web app.

## Restrições Técnicas de Alto Nível

- O sistema deve respeitar os termos de uso dos marketplaces-alvo ao coletar dados de preços e ofertas.
- Dados pessoais dos usuários (e-mail, telefone, preferências) devem ser tratados conforme LGPD.
- O sistema deve suportar pelo menos 10.000 perfis de interesse monitorados simultaneamente sem degradação perceptível.
- Latência entre detecção de oportunidade e entrega de notificação deve ser inferior a 10 minutos no plano pago.
- Integrações necessárias: APIs ou scraping dos marketplaces, API do Telegram Bot, API do WhatsApp Business (ou provedor como Evolution API).

## Riscos de Negócio

- **Bloqueio por marketplaces**: Marketplaces podem bloquear ou limitar acesso automatizado. *Mitigação*: usar APIs oficiais e programas de afiliados sempre que disponíveis; diversificar fontes.
- **Imprecisão na margem estimada**: O preço de revenda estimado pode não refletir a realidade do revendedor local. *Mitigação*: comunicar claramente que é uma estimativa; permitir que o revendedor ajuste manualmente seu markup esperado.
- **Baixa retenção no plano gratuito**: Revendedores podem abandonar se os 5 alertas/dia não gerarem valor. *Mitigação*: priorizar qualidade dos alertas sobre quantidade; usar feedback ("comprou?") para refinar relevância.
- **Custo de infraestrutura de scraping**: Monitoramento frequente de múltiplos marketplaces pode gerar custos elevados de compute. *Mitigação*: escalonamento progressivo; iniciar com menor frequência e aumentar conforme receita.

## Fora de Escopo

- Monitoramento de lives em tempo real (TikTok Shop, YouTube, Instagram) — evolução futura.
- Funcionalidade de compra direta pela plataforma (o sistema redireciona ao marketplace).
- Gestão de estoque ou controle de vendas do revendedor.
- Comparação de preços entre marketplaces para consumidores finais (o foco é revenda, não economia pessoal).
- App mobile nativo — o MVP será web responsivo + bot como canal de notificação.
- Integração com sistemas de e-commerce do revendedor (ex: loja própria no Mercado Livre).

## Priorização

### Must have (MVP)
- Cadastro de perfil de interesse (F01)
- Scanner de pelo menos 2 marketplaces (F02 parcial)
- Notificação via Telegram com link direto (F04 parcial)
- Dashboard básico com lista de oportunidades (F05 parcial)
- Cálculo de margem estimada (F03)

### Should have
- Terceiro marketplace no scanner (F02 completo)
- Notificação via WhatsApp (F04 completo)
- Filtros e ordenação no dashboard (F05 completo)
- Horário de silêncio nas notificações
- Indicador visual de qualidade da oportunidade
- Cadastro de região e filtro básico por localização (F07 parcial)

### Could have
- Histórico de preços por produto
- Feedback "comprei" para refinamento de relevância
- Onboarding com sugestão de categorias populares
- Ranking de melhores oportunidades do dia
- Frete estimado integrado ao cálculo de margem e teto de frete configurável (F07 completo)

### Won't have (nesta entrega)
- Monitoramento de lives
- App mobile nativo
- Compra integrada
- Gestão de estoque/vendas
- Integrações com lojas do revendedor
