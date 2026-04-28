# PRD — Site de Vendas Avisus

## Visão Geral

O site de vendas do Avisus será a principal experiência pública para apresentar, explicar e vender a plataforma de inteligência de preços para revendedores brasileiros. A página deve substituir a home técnica atual por uma narrativa comercial clara: o revendedor perde oportunidades porque promoções, cupons e lives aparecem rápido demais em múltiplos marketplaces; o Avisus monitora essas fontes, calcula margem estimada e envia alertas acionáveis para que o usuário compre antes da concorrência.

A entrega deve educar visitantes, validar demanda, converter cadastros e impulsionar assinaturas pagas, com CTA principal para **Assinar PRO**. O site deve respeitar o design system já aplicado na plataforma e apresentar todas as funcionalidades relevantes do produto sem alterar a área logada.

## Objetivos

- Aumentar a clareza da proposta de valor do Avisus para revendedores em até 10 segundos de leitura inicial.
- Converter visitantes em intenção comercial por meio de CTA principal para **Assinar PRO** e CTA secundário para cadastro gratuito.
- Explicar todas as funcionalidades da plataforma em linguagem orientada a benefício, reduzindo dúvidas antes do cadastro.
- Destacar diferenças entre FREE, STARTER e PRO, favorecendo a percepção de valor do PRO.
- Medir sucesso por: cliques em CTAs, início de cadastro, cliques em planos pagos, scroll até planos, interação com FAQ e taxa de conversão visitante → cadastro/checkout.

## Premissas

- Os preços e claims existentes na tela interna de planos podem ser usados como referência: STARTER por R$49/mês e PRO por R$99/mês.
- O CTA principal da página será **Assinar PRO**.
- O site deve conviver com login, registro, onboarding e páginas internas existentes, sem mudar regras da área autenticada.
- O site deve oferecer uma entrada clara de login para usuários existentes, direcionando para `/login` da plataforma.
- O público principal é o revendedor brasileiro que compra em marketplaces para revender com margem.
- Claims de economia, ROI, depoimentos e número de usuários devem ser verificáveis ou apresentados como exemplos/cases, evitando promessa de ganho garantido.
- A oferta deve ser clara sobre preço, renovação, garantia de 7 dias, cancelamento e limitações por plano.

## Histórias de Usuário

- Como revendedor visitante, eu quero entender rapidamente como o Avisus encontra oportunidades para que eu avalie se vale assinar.
- Como revendedor com pouco tempo, eu quero ver benefícios e CTAs claros para decidir sem ler textos longos.
- Como visitante cético, eu quero comparar funcionalidades e planos para entender por que o PRO vale mais que o FREE.
- Como revendedor iniciante, eu quero ver exemplos de funcionalidades para entender como alertas, margem e lives me ajudam na prática.
- Como visitante preocupado com assinatura, eu quero ver preço, garantia e cancelamento com transparência antes de contratar.

## Funcionalidades Principais

### F01 — Hero Comercial e Proposta de Valor

- **RF-01**: O site deve apresentar uma headline orientada à dor do revendedor: perder ofertas lucrativas por monitorar marketplaces manualmente.
- **RF-02**: O site deve comunicar o benefício central: receber oportunidades com desconto, margem estimada e link de ação.
- **RF-03**: O hero deve conter CTA principal **Assinar PRO** e CTA secundário para começar grátis ou conhecer planos.
- **RF-04**: O hero deve reforçar urgência comercial sem prometer lucro garantido.

### F02 — Descrição Completa das Funcionalidades

- **RF-05**: O site deve explicar o scanner de marketplaces e a diferença de frequência por plano: FREE 2h, STARTER 30min, PRO 5min.
- **RF-06**: O site deve explicar cadastro de interesses e limites por plano: FREE 5 termos, STARTER até 20 termos, PRO ilimitado.
- **RF-07**: O site deve explicar cálculo de margem estimada, custo de aquisição, melhor margem por canal e quality badge.
- **RF-08**: O site deve explicar dashboard de oportunidades, filtros, ordenação, ações de compra e descarte.
- **RF-09**: O site deve explicar alertas via Web, Telegram e WhatsApp conforme disponibilidade por plano.
- **RF-10**: O site deve explicar monitoramento de lives de vendedores favoritos em Shopee/TikTok e limites por plano.
- **RF-11**: O site deve explicar histórico e tendências de preço, destacando janelas de 7, 30 e 90 dias conforme plano.
- **RF-12**: O site deve explicar score de oportunidade, sazonalidade e sugestão de volume como diferenciais pagos/PRO quando aplicável.

### F03 — Planos, Preços e Conversão

- **RF-13**: O site deve apresentar comparação entre FREE, STARTER e PRO com benefícios, limites e preço mensal.
- **RF-14**: O plano PRO deve receber maior destaque visual e comercial como opção principal.
- **RF-15**: Cada plano deve ter CTA compatível com sua intenção: começar grátis, assinar STARTER ou assinar PRO.
- **RF-16**: A seção de planos deve informar garantia de 7 dias, pagamento seguro e cancelamento quando quiser.

### F04 — Prova Social, Confiança e Objeções

- **RF-17**: O site deve conter prova social com depoimentos, números ou exemplos de uso alinhados aos claims atuais.
- **RF-18**: O site deve incluir seção de FAQ cobrindo: como os alertas funcionam, marketplaces monitorados, diferença entre planos, garantia, cancelamento, segurança de dados e se lucro é garantido.
- **RF-19**: O site deve deixar claro que o Avisus apoia decisão de compra, mas não garante revenda, lucro ou disponibilidade contínua das ofertas.

### F05 — Consistência Visual e CTAs

- **RF-20**: O site deve respeitar o design system existente do Avisus: tokens de cor, tipografia Montserrat, cards, botões, badges, estados e responsividade já definidos.
- **RF-21**: CTAs devem ser recorrentes em pontos estratégicos da jornada: hero, após funcionalidades, planos, prova social e fechamento.
- **RF-22**: O site deve funcionar bem em desktop e mobile, com leitura escaneável e áreas de toque adequadas.
- **RF-23**: O site deve conter uma área ou entrada de login visível para usuários já cadastrados, direcionando para `/login`.

## Critérios de Aceite

- **CA-01**: Dado que um visitante acessa a home pública, quando visualizar o primeiro bloco, então deve entender que o Avisus monitora ofertas e ajuda revendedores a agir rápido com margem estimada.
- **CA-02**: Dado que o visitante está no hero, quando procurar uma ação principal, então deve encontrar o CTA **Assinar PRO** com destaque superior aos demais CTAs.
- **CA-03**: Dado que o visitante percorre o site, quando chegar à seção de funcionalidades, então deve encontrar descrições de scanner, interesses, margem, dashboard, alertas, lives, histórico, tendências, score, sazonalidade e volume.
- **CA-04**: Dado que o visitante compara planos, quando visualizar FREE, STARTER e PRO, então deve ver limites, preços e diferenciais sem ambiguidade.
- **CA-05**: Dado que o visitante avalia contratação, quando visualizar informações de confiança, então deve encontrar garantia de 7 dias, pagamento seguro e cancelamento quando quiser.
- **CA-06**: Dado que o site exibe claims comerciais, quando houver referência a economia, ROI, número de usuários ou depoimentos, então a mensagem deve ser verificável ou claramente apresentada como exemplo.
- **CA-07**: Dado que o visitante usa mobile, quando navegar pela página, então deve conseguir ler seções, comparar planos e acionar CTAs sem perda de conteúdo essencial.
- **CA-08**: Dado que o visitante acessa o FAQ, quando tiver objeções comuns, então deve encontrar respostas sobre funcionamento dos alertas, planos, segurança, garantia, cancelamento e ausência de lucro garantido.
- **CA-09**: Dado que um usuário já cadastrado acessa o site público, quando procurar acesso à conta, então deve encontrar uma entrada de login que o leve para `/login`.

## Experiência do Usuário

A jornada deve conduzir o visitante em sequência: dor clara, promessa de valor, prova de como funciona, funcionalidades, comparação de planos, confiança, FAQ e CTA final. A leitura deve ser escaneável, com títulos curtos, cards de benefício, destaques numéricos e CTAs visíveis.

O tom deve ser direto, comercial e específico para revendedores: rapidez, margem, oportunidade, menos monitoramento manual e vantagem sobre concorrentes. O design deve preservar a identidade do Avisus com cards, badges, cores dos planos, ícones e hierarquia visual do design system existente.

Requisitos de acessibilidade: CTAs com texto claro, contraste adequado, navegação compreensível por teclado, hierarquia semântica de títulos, textos alternativos quando houver imagens/logos e linguagem sem depender apenas de cor para comunicar estado ou plano.

## Restrições Técnicas de Alto Nível

- A entrega não deve modificar funcionalidades da área logada: dashboard, onboarding, alertas, perfil, favoritos ou planos internos.
- O site deve manter consistência com o produto Next.js existente e design system atual, sem introduzir uma identidade visual paralela.
- A página deve ser adequada para indexação pública e compartilhamento comercial.
- Informações de preço, garantia, cancelamento e limites de plano devem ser claras e em português do Brasil.
- Dados pessoais eventualmente coletados em fluxos conectados ao site devem respeitar LGPD e políticas já existentes do Avisus.

## Riscos de Negócio

- Claims agressivos podem gerar expectativa irreal de lucro. Mitigação: usar linguagem de apoio à decisão e exemplos verificáveis.
- Destacar PRO demais pode reduzir cadastros gratuitos. Mitigação: manter CTA secundário de entrada gratuita.
- Excesso de funcionalidades pode tornar a página longa e confusa. Mitigação: agrupar funcionalidades por benefício e usar FAQ para detalhes.
- Preços ou benefícios podem divergir da tela interna de planos. Mitigação: manter consistência textual entre site público e experiência autenticada.
- Prova social não comprovada pode comprometer confiança. Mitigação: usar apenas números e depoimentos validados.

## Fora de Escopo

- Blog, páginas editoriais, estratégia de SEO por conteúdo e landing pages por palavra-chave.
- Chat comercial, bot de vendas, atendimento em tempo real ou integração com WhatsApp comercial.
- A/B testing, variantes de copy, experimentos automatizados ou ferramenta externa de otimização.
- Mudanças na área logada, onboarding, checkout interno, dashboard, alertas ou regras de planos.
- Criação de novas funcionalidades do produto Avisus além da apresentação comercial no site.

## Priorização

- **Must have**: hero comercial, CTA principal **Assinar PRO**, CTA secundário de cadastro, entrada de login para `/login`, descrição completa das funcionalidades, comparação de planos e preços, prova social, FAQ, design system respeitado, responsividade mobile.
- **Should have**: blocos de confiança, exemplos de oportunidades, reforços de urgência, seção final de CTA, copy específica por perfil de revendedor.
- **Could have**: métricas visuais adicionais, mini demonstrações conceituais, comparativo “manual vs Avisus”, depoimentos segmentados por perfil.
- **Won't have**: blog/SEO editorial, chat comercial, A/B testing, alterações em área logada e novas funcionalidades do produto.
