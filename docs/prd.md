# PRD — Avisus (avisus.app) — Plataforma de Inteligência para Revendedores

## Visão Geral

Revendedores que dependem de comprar produtos com desconto para revender com margem enfrentam um problema crescente: a fragmentação das fontes de oportunidades. Cupons, promoções relâmpago e descontos em marketplaces como Mercado Livre, Shopee e Magazine Luiza surgem e desaparecem rapidamente, e o revendedor que não monitora constantemente perde oportunidades de lucro.

Esta plataforma — **Avisus** (avisus.app) — resolve esse problema ao rastrear automaticamente ofertas e descontos nos principais marketplaces brasileiros, identificar oportunidades relevantes para o perfil de cada revendedor e notificá-lo em tempo real — permitindo que compre com desconto e revenda com margem superior.

O Avisus segue modelo Freemium em três camadas — **FREE** (entrada limitada), **STARTER** (revendedor ativo) e **PRO** (revendedor profissional com IA) — e entrega valor por dois canais: um web app com dashboard e um bot (Telegram/WhatsApp) como canal de notificação push.

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
- As taxas dos marketplaces de revenda (comissão, frete, meios de pagamento) variam por categoria e tipo de anúncio; o MVP trabalhará com percentuais médios por marketplace, refinando por categoria em evoluções futuras.
- O volume de ofertas nos marketplaces-alvo é suficiente para gerar valor diário ao revendedor.
- O MVP não contempla monitoramento de lives em tempo real (TikTok Shop etc.) — isso é uma evolução futura.
- Dados de frete variam por vendedor, modalidade e região; o sistema trabalhará com estimativas baseadas nas informações disponíveis publicamente nos marketplaces, sem garantia de exatidão.
- O score inteligente (F08) exige um período mínimo de acumulação de dados (~60 dias) para que os sinais preditivos (tendência de preço, sazonalidade, raridade de desconto) sejam confiáveis. Antes desse período, apenas o score básico (margem + desconto) deve ser oferecido.

## Histórias de Usuário

**US-01** — Como revendedor, eu quero cadastrar os produtos ou categorias que me interessam para que o sistema monitore apenas o que é relevante para mim.

**US-02** — Como revendedor, eu quero receber notificações automáticas quando uma oportunidade de compra com desconto for identificada para que eu possa agir rapidamente antes que a oferta expire.

**US-03** — Como revendedor, eu quero ver o custo real de aquisição e a melhor margem líquida por canal de revenda para que eu saiba antecipadamente quanto vou lucrar e onde é mais vantajoso revender.

**US-04** — Como revendedor, eu quero acessar um dashboard com as oportunidades ativas para que eu possa comparar e priorizar quais compras fazer.

**US-05** — Como revendedor no plano gratuito, eu quero entender o que o plano pago oferece a mais para que eu possa decidir se vale a pena assinar.

**US-06** — Como revendedor, eu quero configurar por qual canal desejo receber notificações (Telegram, WhatsApp ou apenas web) para que os alertas cheguem onde eu prefiro.

**US-07** — Como revendedor, eu quero marcar uma oportunidade como "comprada" para que o sistema aprenda melhor minhas preferências ao longo do tempo.

**US-08** — Como revendedor, eu quero filtrar oportunidades pela minha região para que eu veja apenas ofertas com frete viável e prazos de entrega compatíveis com a minha operação de revenda.

**US-09** — Como revendedor no plano PRO, eu quero ver um score que me diga se devo comprar agora ou esperar, com uma explicação do porquê, para que eu tome decisões mais seguras sem precisar analisar múltiplos fatores manualmente.

**US-10** — Como revendedor no plano PRO, eu quero ver oportunidades sazonais futuras (Copa, Natal, Festa Junina etc.) para que eu possa comprar produtos com antecedência e revender com margem maior durante os picos de demanda.

**US-11** — Como revendedor no plano PRO, eu quero receber sugestões de quantidade de compra com lucro estimado e nível de risco para que eu saiba quanto investir em cada produto de forma segura.

**US-12** — Como revendedor, eu quero identificar rapidamente quais produtos estão "Em alta" (melhor margem) para que eu priorize as compras mais lucrativas.

**US-13** — Como revendedor no plano STARTER ou PRO, eu quero ver tendências de preço dos produtos que monitoro para que eu saiba se é o momento certo de comprar ou se o preço está em queda.

**US-14** — Como revendedor, eu quero que meu perfil seja simples e rápido de preencher, com apenas os dados essenciais e cidades carregadas automaticamente pelo meu estado, para que eu não perca tempo com formulários complexos.

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

O cálculo de margem segue um modelo em duas camadas que reflete a realidade do revendedor:

**Camada 1 — Custo real de aquisição**: preço do produto + frete de compra = custo final.

**Camada 2 — Margem por canal de revenda**: para cada marketplace onde o revendedor poderia revender, o sistema calcula: preço médio de mercado do produto − taxas do marketplace de destino (comissão, frete reverso etc.). A melhor margem líquida (Camada 2 − Camada 1) é exibida como valor principal; o detalhamento por canal fica disponível na visão expandida.

Esse modelo é a base para o score de oportunidade em evoluções futuras.

- **RF-07**: O sistema deve calcular o custo de aquisição como: preço do produto + frete estimado para a região do revendedor.
- **RF-08**: O sistema deve calcular a margem líquida por canal de revenda considerando: preço médio de mercado (últimos 30 dias) − taxas praticadas pelo marketplace de destino (Mercado Livre, Shopee, Magazine Luiza).
- **RF-08.1**: O sistema deve manter uma tabela de taxas médias por categoria/marketplace para uso no cálculo. Essa tabela pode ser simplificada no MVP (percentual médio por marketplace) e refinada por categoria em evoluções futuras.
- **RF-09**: O sistema deve exibir como informação principal a melhor margem entre os canais de revenda calculados, junto com o nome do canal correspondente (ex: "Melhor margem: 32% via Shopee").
- **RF-09.1**: O sistema deve permitir ao revendedor expandir o detalhe para ver a margem estimada em cada canal de revenda.
- **RF-09.2**: O sistema deve exibir um indicador visual de qualidade da oportunidade (ex: "boa", "ótima", "excepcional") baseado na melhor margem líquida.

### F04 — Sistema de Notificações Push

Envia alertas automáticos ao revendedor quando oportunidades relevantes são detectadas, via bot em Telegram ou WhatsApp, além de notificação no web app.

- **RF-10**: O sistema deve enviar notificação push contendo: nome do produto, custo de aquisição (preço + frete), melhor margem líquida e canal correspondente, e link direto para compra.
- **RF-11**: O sistema deve permitir configuração de horário de silêncio (não perturbe).
- **RF-12**: O sistema deve limitar a 5 alertas/dia no plano gratuito e ilimitados no plano pago.

### F05 — Dashboard de Oportunidades

Interface web onde o revendedor visualiza todas as oportunidades ativas, filtra por categoria, marketplace ou margem, e acessa links diretos de compra.

- **RF-13**: O dashboard deve listar oportunidades ativas com filtros por: categoria, marketplace de origem, faixa de desconto, melhor margem líquida e região.
- **RF-14**: O sistema deve permitir ordenação por melhor margem líquida, desconto ou data de detecção.
- **RF-15**: O sistema deve indicar a validade estimada da oferta (quando disponível).

### F06 — Gestão de Planos (Freemium)

Controle de acesso e limites de funcionalidade conforme o plano do usuário. O sistema opera com três camadas: FREE, STARTER e PRO.

- **RF-16**: O plano FREE deve permitir: até 5 termos de interesse, até 5 alertas/dia, frequência de scan de 2h, histórico de 7 dias. Sem score, sem tendências, sem sazonalidade.
- **RF-17**: O plano STARTER deve permitir: termos ilimitados, alertas ilimitados, frequência de scan de 30min, histórico de 30 dias, score básico de oportunidade, tendências de preço (30 dias).
- **RF-17.1**: O plano PRO deve permitir: todos os benefícios do STARTER + frequência de scan de 5min, histórico de 90 dias, tendências de preço (90 dias + períodos de 3m, 6m, 1 ano), sazonalidade detectada, score completo com IA, sugestão de volume de compra.
- **RF-18**: O sistema deve exibir indicações claras de funcionalidades bloqueadas no plano inferior com CTA para upgrade. Quando o usuário já está no plano máximo (PRO), o CTA "Upgrade" deve ser substituído por "Planos" em toda a interface (nav, perfil, dashboard).

### F07 — Filtragem por Região

Permite ao revendedor definir sua localização (estado, cidade ou CEP) para que o sistema priorize ofertas com frete viável, filtre vendedores por proximidade geográfica e considere o custo de frete na margem estimada. Isso é essencial porque o frete pode inviabilizar uma oportunidade aparentemente boa.

- **RF-19**: O sistema deve permitir que o revendedor cadastre sua região de atuação (estado e cidade) no perfil.
- **RF-20**: O sistema deve exibir o custo estimado de frete para a região do revendedor em cada oportunidade, quando a informação estiver disponível no marketplace.
- **RF-21**: O sistema deve permitir filtro de oportunidades por: "minha região", "meu estado", "frete grátis" e "todo o Brasil".
- **RF-22**: O custo de frete de compra já é considerado no custo de aquisição (F03, RF-07). Este requisito garante que a margem líquida exibida por F03 já desconta o frete automaticamente.
- **RF-23**: O sistema deve permitir que o revendedor defina um teto máximo de frete aceitável para filtrar oportunidades automaticamente.

### F08 — Score Inteligente de Oportunidade (IA) — *Pós-MVP*

> **Esta feature não faz parte do MVP.** O score será ativado em entregas posteriores, após acúmulo mínimo de ~60 dias de dados históricos. Porém, a coleta dos dados que alimentam o score (histórico de preços, demanda, frequência de descontos) **deve iniciar desde o MVP** — esse é o único item de F08 que entra na primeira entrega, como investimento invisível para o usuário mas essencial para viabilizar a feature no futuro.

O sistema utiliza inteligência artificial para analisar múltiplos sinais de cada oportunidade e gerar um score preditivo que responde a pergunta central do revendedor: "devo comprar agora ou esperar?". O score transforma dados brutos (margem, preço, demanda, sazonalidade) em uma recomendação acionável.

**Sinais de entrada do modelo:**

- Margem líquida (F03) — quanto maior, melhor o score
- Tendência de preço — o preço está caindo (espere) ou subindo (compre agora)?
- Raridade do desconto — com que frequência esse produto atinge esse nível de desconto? Quanto mais raro, maior o score
- Velocidade de venda — proxy de demanda do produto (ex: "X vendidos" no marketplace); alta demanda = revenda mais rápida
- Sazonalidade — o produto está entrando em um período de alta demanda? (ex: ferramentas antes do Dia dos Pais, games antes do Natal)
- Tempo restante da oferta — urgência; oferta prestes a expirar com bons indicadores eleva o score

**Saída para o revendedor:**

- Score numérico (0–100)
- Rótulo acionável: "Compre agora", "Boa oportunidade", "Espere baixar mais", "Risco alto"
- Justificativa curta explicando o porquê (ex: "Preço no menor patamar dos últimos 90 dias + demanda alta pré-Natal")

**Diferenciação por plano:**

- FREE: sem score
- STARTER: score básico (baseado apenas em margem + percentual de desconto)
- PRO: score completo (todos os sinais + justificativa + recomendação de ação)

**Requisitos funcionais:**

- **RF-24**: O sistema deve calcular um score de 0 a 100 para cada oportunidade identificada, combinando os sinais de entrada descritos acima.
- **RF-25**: O sistema deve exibir um rótulo de ação junto ao score: "Compre agora" (score ≥ 80), "Boa oportunidade" (60–79), "Espere baixar mais" (40–59), "Risco alto" (< 40).
- **RF-26**: No plano PRO, o sistema deve exibir uma justificativa em linguagem natural explicando os principais fatores que compõem o score (ex: "Desconto raro + alta demanda + sazonalidade favorável").
- **RF-27**: No plano STARTER, o sistema deve exibir um score simplificado baseado apenas em margem líquida e percentual de desconto, sem justificativa.
- **RF-28**: O sistema deve permitir ordenação e filtragem das oportunidades por score no dashboard.
- **RF-29**: O score deve ser recalculado sempre que os dados de entrada mudarem (novo preço, oferta expirada, variação de demanda).

### F09 — Indicador "Em Alta" (HOT)

O sistema classifica dinamicamente os produtos como "Em alta" com base na margem efetiva. Não é um flag estático — é recalculado sempre que o catálogo ou filtros mudam.

- **RF-30**: O sistema deve classificar como "Em alta" (HOT) os produtos que estiverem no **top 30% de margem efetiva** entre os produtos visíveis no contexto atual (dashboard filtrado ou alertas).
- **RF-31**: O badge HOT deve ser recalculado automaticamente quando filtros, interesses ou dados de preço mudarem.
- **RF-32**: O indicador HOT deve ser exibido tanto nos cards de produto no dashboard quanto nos alertas de notificação.

### F10 — Tendências de Preço

O sistema exibe o histórico de preços de produtos monitorados, permitindo ao revendedor identificar se o preço atual está em queda, estável ou subindo.

- **RF-33**: No plano FREE, o sistema não deve exibir tendências de preço.
- **RF-34**: No plano STARTER, o sistema deve exibir tendências de preço com janela de **30 dias**.
- **RF-35**: No plano PRO, o sistema deve exibir tendências de preço com janela de até **90 dias**, com opções de visualização por 3 meses, 6 meses e 1 ano.
- **RF-36**: As tendências devem ser acessíveis via botão flutuante (FAB) no dashboard, abrindo um painel em bottom sheet.
- **RF-37**: No modal de detalhe do produto, a tendência de preço em mini-gráfico deve respeitar a janela do plano do usuário (30 dias para STARTER, 3 meses para PRO).

### F11 — Sazonalidade (PRO)

O sistema detecta e exibe oportunidades de compra antecipada baseadas em eventos sazonais futuros. O objetivo é orientar o revendedor a **comprar antes** e **revender com margem maior** durante picos de demanda.

- **RF-38**: O sistema deve manter um calendário de eventos sazonais relevantes para o mercado de revenda brasileiro: Verão/Liquidações (jan), Volta às aulas (fev), Carnaval (mar), Copa/Eventos esportivos, Dia das Mães (mai), Festa Junina (jun), Inverno (jul), Dia dos Pais (ago), Dia das Crianças (out), Black Friday (nov), Natal (dez).
- **RF-39**: Para cada evento, o sistema deve exibir: nome do evento, tempo estimado até o evento, categorias de produto com alta demanda esperada, e dica estratégica de compra antecipada.
- **RF-40**: Os eventos devem ser ordenados por proximidade temporal, priorizando os mais próximos.
- **RF-41**: A sazonalidade deve ser acessível via botão flutuante (FAB) exclusivo para o plano PRO, abrindo um painel em bottom sheet com todos os eventos do ano.

### F12 — Sugestão de Volume de Compra (PRO)

O sistema sugere quantidades de compra para os produtos com melhor oportunidade, baseado em margem, lucro estimado e nível de risco.

- **RF-42**: O sistema deve calcular uma sugestão de volume para os top 5 produtos do catálogo filtrado, baseada na margem e lucro unitário.
- **RF-43**: Para cada produto, o sistema deve exibir: quantidade sugerida, lucro estimado total, nível de risco (baixo/médio/alto) e custo total de aquisição.
- **RF-44**: A sugestão de volume deve ser acessível via botão flutuante (FAB) exclusivo para o plano PRO, abrindo um painel em bottom sheet.

### F13 — Perfil Simplificado e LGPD

O perfil do usuário é simplificado para o MVP, coletando apenas dados essenciais. O sistema segue as diretrizes da LGPD.

- **RF-45**: O perfil deve coletar apenas: nome, e-mail, telefone (opcional), estado, cidade (via API IBGE) e canais de alerta (WhatsApp e/ou Telegram).
- **RF-46**: Campos de endereço completo (CEP, rua, bairro, complemento) não fazem parte do MVP — estado e cidade são suficientes para cálculo de frete e filtros regionais.
- **RF-47**: O sistema deve validar inline os canais de alerta: formato numérico com código de país para WhatsApp, formato @username para Telegram.
- **RF-48**: A barra de completude do perfil deve considerar apenas campos essenciais ao MVP: nome, e-mail, estado, cidade e pelo menos 1 canal de alerta válido.
- **RF-49**: O sistema deve exibir indicação de conformidade LGPD no perfil, informando que dados pessoais são usados exclusivamente para personalização de alertas e cálculo de frete/margem, com menção à possibilidade de exclusão dos dados.
- **RF-50**: O sistema deve fornecer feedback visual ("Salvo") ao alterar campos do perfil.
- **RF-51**: O card do plano ativo deve ser visível no perfil, exibindo plano atual, limites e CTA adequada (Upgrade para FREE/STARTER, "Planos" para PRO).

## Critérios de Aceite

- **CA-01**: Dado que um revendedor cadastrou "parafusadeira" como interesse, quando o scanner detectar uma parafusadeira com desconto ≥ 15% na Shopee, então o revendedor deve receber uma notificação no canal configurado em até 10 minutos (plano pago).
- **CA-02**: Dado que uma oportunidade foi identificada, quando o revendedor visualizar o alerta, então deve ver: nome do produto, custo de aquisição (preço + frete), melhor margem líquida com o canal correspondente (ex: "32% via Shopee") e link direto.
- **CA-03**: Dado que um revendedor está no plano gratuito, quando ele atingir 5 alertas no dia, então não deve receber mais alertas até o dia seguinte, e deve ver uma mensagem prominente sugerindo upgrade com destaque visual (gradiente, ícone, CTA de ação).
- **CA-04**: Dado que um revendedor configurou horário de silêncio das 22h às 7h, quando uma oportunidade for detectada às 23h, então a notificação deve ser enfileirada e entregue às 7h.
- **CA-05**: Dado que o revendedor acessa o dashboard, quando filtrar por "margem > 30%", então apenas oportunidades com melhor margem líquida superior a 30% devem ser exibidas.
- **CA-08**: Dado que o revendedor expande o detalhe de uma oportunidade, quando existirem margens calculadas para Mercado Livre e Shopee, então deve ver a margem líquida de cada canal separadamente, com o custo de aquisição e as taxas aplicadas.
- **CA-06**: Dado que um revendedor cadastrou sua região como "Florianópolis/SC" e definiu teto de frete de R$ 30, quando uma oportunidade tiver frete estimado de R$ 45 para a região dele, então essa oportunidade não deve gerar notificação push (mas deve aparecer no dashboard com indicação de frete acima do teto).
- **CA-07**: Dado que um revendedor filtrar por "frete grátis" no dashboard, quando existirem oportunidades com frete grátis para a região dele, então apenas essas devem ser exibidas.
- **CA-09**: Dado que uma parafusadeira está com 40% de desconto (raridade alta — só atingiu esse nível 2x nos últimos 6 meses), com margem líquida de 35% e demanda crescente, quando o score for calculado, então deve ser ≥ 80 com rótulo "Compre agora".
- **CA-10**: Dado que um produto está com desconto de 20% mas a tendência de preço mostra queda contínua nos últimos 7 dias, quando o score for calculado, então deve refletir a recomendação "Espere baixar mais" com justificativa mencionando a tendência de queda.
- **CA-11**: Dado que um revendedor está no plano STARTER, quando visualizar uma oportunidade, então deve ver o score numérico e o rótulo, mas não a justificativa em linguagem natural.
- **CA-12**: Dado que um revendedor está no plano FREE, quando visualizar uma oportunidade, então não deve ver score algum, e deve ver indicação de que o score está disponível nos planos pagos.
- **CA-13**: Dado que existem 10 produtos visíveis no dashboard, quando o sistema calcular os HOT, então apenas os produtos no top 30% de margem efetiva devem receber o badge "Em alta". Se os filtros mudarem, o cálculo deve ser refeito.
- **CA-14**: Dado que um revendedor está no plano FREE, quando acessar o dashboard, então NÃO deve ver: score de oportunidade, tendências de preço, sazonalidade nem sugestão de volume. Apenas o catálogo com margem e desconto básico.
- **CA-15**: Dado que um revendedor está no plano STARTER, quando acessar tendências, então deve ver dados de até 30 dias. NÃO deve ver opções de 3m, 6m ou 1 ano.
- **CA-16**: Dado que um revendedor está no plano PRO, quando acessar tendências, então deve ver dados de até 90 dias com opções de 3m, 6m e 1 ano.
- **CA-17**: Dado que um revendedor está no plano PRO, quando tocar no FAB de sazonalidade, então deve ver a lista de eventos sazonais futuros ordenados por proximidade, com dicas de compra antecipada e categorias de produtos recomendadas.
- **CA-18**: Dado que um revendedor está no plano PRO e já é o plano máximo, quando visualizar a navegação do app, então deve ver "Planos" no lugar de "Upgrade", sem destaque de call-to-action.
- **CA-19**: Dado que um revendedor está no plano PRO, quando tocar no FAB de volume, então deve ver sugestões de compra com quantidade, lucro estimado e nível de risco para os 5 melhores produtos filtrados.
- **CA-20**: Dado que um revendedor edita seu perfil, quando alterar qualquer campo, então deve ver feedback visual "Salvo" temporário. A lista de cidades deve ser carregada dinamicamente via API IBGE ao selecionar um estado.

## Experiência do Usuário

**Persona primária — "Carlos, o Revendedor"**: Pessoa física ou micro-empreendedor que compra produtos com desconto em marketplaces e revende localmente ou em outros canais online. Usa o celular como ferramenta principal de trabalho. Valoriza rapidez e praticidade — não quer dashboards complexos, quer saber "o que comprar agora".

**Fluxo principal**: Cadastro → Definir interesses → Receber primeiro alerta → Clicar no link → Comprar. O tempo entre cadastro e primeiro valor entregue (primeiro alerta útil) deve ser inferior a 24 horas.

**Considerações de UX**:
- Mobile-first: a maioria dos revendedores opera pelo celular.
- Onboarding simplificado: máximo 3 passos até o primeiro interesse cadastrado.
- Alertas acionáveis: cada notificação deve conter informação suficiente para decisão imediata, sem exigir abrir o app. Cada alerta exibe: custo de aquisição, lucro estimado, badge de qualidade (a partir do STARTER), e tempo restante estimado da oferta.
- Linguagem acessível: evitar jargão técnico; usar termos como "margem", "lucro estimado", "desconto".
- Features avançadas (tendências, sazonalidade, volume) são acessadas por FABs flutuantes no canto inferior do dashboard, organizados em pilha vertical e abrindo bottom sheets — mantendo a interface limpa sem menus complexos.
- Interesses mostram preview em tempo real de ofertas disponíveis ao digitar, contagem de ofertas por interesse, e melhor margem encontrada por termo.
- Alertas com limite atingido exibem CTA prominente com gradiente e destaque visual antes da lista.

**Acessibilidade**: Contraste adequado, fontes legíveis em telas pequenas, navegação por teclado no web app.

## Restrições Técnicas de Alto Nível

- O sistema deve respeitar os termos de uso dos marketplaces-alvo ao coletar dados de preços e ofertas.
- Dados pessoais dos usuários (e-mail, telefone, preferências) devem ser tratados conforme LGPD.
- O sistema deve suportar pelo menos 10.000 perfis de interesse monitorados simultaneamente sem degradação perceptível.
- Latência entre detecção de oportunidade e entrega de notificação deve ser inferior a 10 minutos no plano pago.
- Integrações necessárias: APIs ou scraping dos marketplaces, API do Telegram Bot, API do WhatsApp Business (ou provedor como Evolution API).
- O score inteligente (F08) requer acumulação mínima de dados históricos de preço e demanda antes de gerar recomendações confiáveis. A coleta de dados deve iniciar desde o MVP mesmo que o score só seja exposto em entregas posteriores.

## Riscos de Negócio

- **Bloqueio por marketplaces**: Marketplaces podem bloquear ou limitar acesso automatizado. *Mitigação*: usar APIs oficiais e programas de afiliados sempre que disponíveis; diversificar fontes.
- **Imprecisão na margem estimada**: As taxas reais dos marketplaces variam por categoria, tipo de anúncio e tipo de frete; o MVP usa percentuais médios. *Mitigação*: comunicar claramente que é uma estimativa; refinar a tabela de taxas por categoria conforme feedback dos usuários.
- **Baixa retenção no plano gratuito**: Revendedores podem abandonar se os 5 alertas/dia não gerarem valor. *Mitigação*: priorizar qualidade dos alertas sobre quantidade; usar feedback ("comprou?") para refinar relevância.
- **Custo de infraestrutura de scraping**: Monitoramento frequente de múltiplos marketplaces pode gerar custos elevados de compute. *Mitigação*: escalonamento progressivo; iniciar com menor frequência e aumentar conforme receita.
- **Confiança no score de IA**: Se o score recomendar "compre agora" e o revendedor tiver prejuízo, a credibilidade do produto cai rapidamente. *Mitigação*: lançar o score básico (margem + desconto) primeiro, acumular dados por pelo menos 60 dias antes de ativar sinais preditivos (tendência, sazonalidade); comunicar sempre como "estimativa" e nunca como "garantia".

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
- Gestão de planos com 3 camadas: FREE / STARTER / PRO (F06)
- Indicador HOT dinâmico por margem — top 30% (F09)
- Perfil simplificado com estado + cidade via API IBGE e conformidade LGPD (F13)
- Coleta e armazenamento de histórico de preços, demanda e frequência de descontos desde o dia 1 (pré-requisito para F08)

### Should have
- Terceiro marketplace no scanner (F02 completo)
- Notificação via WhatsApp (F04 completo)
- Filtros e ordenação no dashboard (F05 completo)
- Horário de silêncio nas notificações
- Indicador visual de qualidade da oportunidade
- Cadastro de região e filtro básico por localização (F07 parcial)
- Tendências de preço com janela por plano — 30d STARTER, 90d PRO (F10)
- Score básico de oportunidade — margem + desconto (F08 parcial / STARTER) — *pós-MVP, requer ~60 dias de dados*

### Could have
- Ação **"Não tenho interesse"** em uma oportunidade (ou produto sugerido) para deixar de exibi-la no feed e nos alertas, sem remover o termo de interesse global
- Histórico de preços por produto
- Feedback "comprei" para refinamento de relevância
- Onboarding com sugestão de categorias populares
- Ranking de melhores oportunidades do dia
- Frete estimado integrado ao cálculo de margem e teto de frete configurável (F07 completo)
- Sazonalidade detectada com calendário de eventos — PRO (F11)
- Sugestão de volume de compra com risco estimado — PRO (F12)
- Score completo com IA — todos os sinais + justificativa + recomendação de ação (F08 completo / PRO) — *pós-MVP, requer dados acumulados + modelo treinado*

### Won't have (nesta entrega)
- Monitoramento de lives
- App mobile nativo
- Compra integrada
- Gestão de estoque/vendas
- Integrações com lojas do revendedor
