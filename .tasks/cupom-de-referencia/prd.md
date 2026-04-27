# Documento de Requisitos de Produto (PRD): Cupom de Referência

## Visão Geral

O Cupom de Referência permite que o Avisus atribua novos cadastros e conversões pagas a parceiros, influenciadores e afiliados por meio de códigos ou links personalizados. A funcionalidade resolve a ausência de rastreabilidade comercial entre divulgação externa e assinatura gerada, criando uma base confiável para relacionamento com parceiros e cálculo de comissão.

No MVP, o cupom é apenas um mecanismo de atribuição: ele não aplica desconto ao usuário final nem altera o preço dos planos. O escopo inclui gestão administrativa dos cupons, captura da referência no cadastro, vínculo do novo usuário ao cupom válido e contabilização da primeira conversão paga para comissão.

## Objetivos

- Permitir que o Avisus identifique qual parceiro originou um novo cadastro.
- Registrar conversões FREE, STARTER e PRO associadas a cupons válidos.
- Calcular comissão sobre o primeiro pagamento confirmado de usuários indicados.
- Reduzir reconciliação manual entre campanhas de parceiros e assinaturas geradas.
- Acompanhar taxa mensal de conversão de cupom para assinatura paga com meta inicial de pelo menos 3%.
- Manter taxa de erro de validação de cupom abaixo de 1% semanal.

## Premissas

- O Avisus já possui fluxo de cadastro, autenticação e seleção de planos FREE, STARTER e PRO.
- Pagamentos de STARTER e PRO são confirmados por uma integração de assinatura existente.
- Parceiros terão um acordo comercial prévio com taxa de comissão definida antes da criação do cupom.
- A referência capturada por link deve permanecer disponível até o cadastro na mesma jornada do usuário.
- O cupom não concede benefício financeiro ao usuário final nesta entrega.
- A comissão do MVP considera apenas o primeiro pagamento confirmado, não recorrências.
- Não há funcionalidade de cupom ou referral ativa no codebase atual.

## Histórias de Usuário

- Como admin do Avisus, eu quero criar cupons únicos para parceiros para rastrear cadastros originados por campanhas externas.
- Como admin do Avisus, eu quero desativar ou expirar um cupom sem perder histórico para controlar campanhas encerradas.
- Como novo usuário, eu quero acessar o Avisus por um link de referência ou informar um código no cadastro para que minha origem seja atribuída corretamente.
- Como novo usuário, eu quero entender quando um cupom é inválido sem ser impedido de continuar o cadastro sem cupom.
- Como responsável comercial do Avisus, eu quero saber quais usuários indicados geraram primeiro pagamento para calcular comissão de forma transparente.

## Funcionalidades Principais

RF-01: Gestão administrativa de cupons

Admins devem poder criar, consultar, editar e desativar cupons de referência com código único, identificação do parceiro, e-mail do parceiro, taxa de comissão, status, data opcional de expiração e observações comerciais.

RF-02: Integridade comercial do cupom

O sistema deve impedir códigos duplicados, aceitar apenas códigos em formato válido e preservar histórico de cadastros/conversões mesmo quando um cupom for desativado ou expirar.

RF-03: Captura de referência por link

Links com parâmetro de referência devem preencher ou disponibilizar o cupom para o usuário durante o fluxo de cadastro, mantendo a atribuição até a conclusão do cadastro na mesma jornada.

RF-04: Entrada manual de código

O usuário deve poder informar um código de cupom opcional durante o cadastro, com validação clara antes da conclusão do cadastro ou escolha de plano.

RF-05: Validação de cupom

O sistema deve aceitar apenas cupons existentes, ativos e não expirados. Quando o cupom for inválido, o usuário deve receber mensagem amigável e poder continuar o cadastro sem atribuição.

RF-06: Registro de cadastro indicado

Quando um usuário conclui cadastro com cupom válido, o sistema deve registrar a associação entre usuário, cupom, plano escolhido e data do cadastro.

RF-07: Registro de primeira conversão paga

Quando um usuário indicado confirma o primeiro pagamento de STARTER ou PRO, o sistema deve registrar plano pago, data do primeiro pagamento e valor usado como base de comissão. Usuários FREE ou pagamentos não concluídos não devem gerar comissão.

RF-08: Cálculo de comissão do MVP

O Avisus deve conseguir calcular o valor comissionável de cada cupom aplicando a taxa definida ao primeiro pagamento confirmado de usuários indicados.

RF-09: Comunicação ao usuário

Quando relevante, mensagens de confirmação podem indicar que o link/código foi reconhecido, sem expor dados pessoais ou comerciais do parceiro.

## Critérios de Aceite

- CA-01: Dado que um admin informa dados válidos de parceiro e um código ainda não usado, quando salva o cupom, então o cupom fica disponível para atribuição.
- CA-02: Dado que um admin tenta criar ou editar um cupom com código duplicado ou inválido, quando salva, então recebe erro claro e o cupom não é salvo nessa condição.
- CA-03: Dado que um cupom está desativado ou expirado, quando um usuário tenta usá-lo, então o sistema não atribui o cadastro a esse cupom.
- CA-04: Dado que um usuário acessa um link com referência válida, quando conclui o cadastro na mesma jornada, então seu cadastro fica associado ao cupom.
- CA-05: Dado que um usuário informa manualmente um cupom válido, quando conclui o cadastro, então seu cadastro fica associado ao cupom informado.
- CA-06: Dado que um usuário informa cupom inválido, quando tenta prosseguir, então recebe feedback amigável e pode continuar sem cupom.
- CA-07: Dado que um usuário indicado escolhe FREE, quando conclui o cadastro, então há registro de cadastro indicado sem valor comissionável.
- CA-08: Dado que um usuário indicado confirma o primeiro pagamento STARTER ou PRO, quando a confirmação é recebida, então há registro de primeira conversão paga com plano, data e valor base.
- CA-09: Dado que um usuário indicado realiza pagamentos recorrentes posteriores, quando a comissão do MVP é calculada, então apenas o primeiro pagamento confirmado é considerado.
- CA-10: Dado que um cupom é usado, quando o usuário visualiza preços ou checkout, então o preço do plano permanece igual ao preço padrão.
- CA-11: Dado que um admin desativa um cupom, quando consulta dados históricos, então cadastros e conversões anteriores continuam disponíveis.

## Experiência do Usuário

No cadastro, o campo de cupom deve ser opcional, ter rótulo claro em português do Brasil e explicar que o código identifica uma parceria, sem prometer desconto. Quando o usuário chega por link de referência, o código deve aparecer de forma reconhecível para reduzir dúvida e permitir correção caso necessário.

Mensagens de erro devem evitar termos técnicos, indicar que o cupom não foi encontrado, está inativo ou expirou, e orientar que o cadastro pode continuar sem cupom. A experiência deve funcionar bem em desktop e mobile, com feedback acessível por leitores de tela.

Para admins, a gestão de cupons deve priorizar clareza operacional: status do cupom, dados do parceiro, taxa de comissão, validade e histórico preservado devem ser compreensíveis sem depender de análise técnica.

## Restrições Técnicas de Alto Nível

- A funcionalidade deve respeitar o fluxo existente de cadastro, autenticação e planos do Avisus.
- A confirmação de pagamento usada para comissão deve depender somente de pagamento confirmado, não de intenção de compra.
- Dados pessoais de usuários e parceiros devem seguir princípios de minimização, finalidade e acesso restrito.
- Informações administrativas de cupons e comissões devem ser acessíveis apenas a perfis autorizados do Avisus.
- Parceiros devem ser orientados a identificar divulgações comissionadas de forma transparente em seus canais, conforme boas práticas brasileiras de publicidade e consumo.
- O MVP deve limitar analytics a cadastro indicado e primeira conversão paga, sem rastrear cliques, impressões ou navegação detalhada.

## Riscos de Negócio

- Parceiros podem esperar desconto para seus seguidores. Mitigação: comunicar que o cupom é de atribuição, não promocional.
- Pode haver disputa de atribuição quando usuários recebem múltiplos códigos. Mitigação: tornar a regra de atribuição clara no cadastro e nos acordos comerciais.
- Cadastros falsos podem inflar métricas de parceiros. Mitigação: considerar comissão apenas sobre primeiro pagamento confirmado.
- Falta de transparência em divulgações de influenciadores pode gerar risco reputacional. Mitigação: incluir obrigação de identificação de parceria nos termos comerciais.
- Atraso na confirmação de pagamento pode atrasar a contabilização de comissão. Mitigação: reportar comissão somente após confirmação efetiva.

## Fora de Escopo

- Pagamento automático de comissões.
- Dashboard público para influenciadores ou parceiros.
- Dashboard avançado de performance, cliques, impressões, origem por canal ou funil detalhado.
- Sistema de afiliados multinível.
- Integração com redes externas de afiliados.
- Limite máximo de uso por cupom.
- Desconto no preço dos planos para usuário final.
- Comissão recorrente mensal ou por pagamentos posteriores ao primeiro pagamento confirmado.
- Regras de bônus, penalidade ou tiers de comissão por performance.

## Priorização

- **Must have**: criação, consulta, edição e desativação de cupons por admin; validação de cupom ativo e não expirado; captura por link de referência; entrada manual opcional; associação do cadastro ao cupom; registro de primeira conversão paga; cálculo de comissão sobre primeiro pagamento; ausência de desconto ao usuário final.
- **Should have**: data de expiração opcional; observações administrativas; mensagens de confirmação de cupom reconhecido; filtros simples para admins encontrarem cupons ativos/inativos.
- **Could have**: exportação simples de dados de comissão para conciliação manual; mensagem de boas-vindas mencionando uso de link/código sem identificar o parceiro.
- **Won't have**: pagamento automático, dashboard público, analytics de cliques/impressões, afiliados multinível, limite de uso por cupom, desconto promocional e comissão recorrente.
