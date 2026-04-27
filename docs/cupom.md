# Feature Specification — Cupom de Referência (Avisus)

## Visão Geral

Implementar um sistema de rastreamento de cupons que permite identificar e rastrear novos usuários que se cadastram através de links/códigos de cupom personalizados, associando-os a canais de origem (influenciadores, afiliados, parceiros) para contabilizar conversões e pagar comissões proporcionais às assinaturas geradas.

---

## Problema

**Quem**: Influenciadores, afiliados e parceiros do Avisus que desejam gerar receita contínua através da divulgação da plataforma.

**Como hoje**: Sem estrutura de rastreamento, não é possível creditar novos usuários a um promotor específico nem calcular quantas assinaturas pagas vieram através de seu cupom.

**Por que é difícil**: 
- Sem cupons, perdem receita potencial de comissão
- Sem dados, não conseguem otimizar estratégias de divulgação
- Sem transparência, reduz confiança com parceiros

---

## Solução

### O que estamos construindo

Um sistema de cupons que:

1. **Geração de Cupom**: Influenciadores/parceiros recebem um código único (ex: `ALFRED_AVISUS_2025`) que pode ser compartilhado via link ou código
2. **Rastreamento na Inscrição**: Quando um novo usuário entra no formulário de cadastro, ele:
   - Insere o código do cupom (ou entra via link com parâmetro `?ref=ALFRED_AVISUS_2025`)
   - O sistema valida o cupom antes do pagamento/assinatura
   - O novo usuário fica vinculado ao cupom no banco de dados
3. **Rastreamento de Conversão**: O sistema registra:
   - Se o usuário completou assinatura (e qual plano: FREE, STARTER, PRO)
   - Data da assinatura
   - Data da conversão para plano pago (se aplicável)
4. **Cálculo de Comissão**: A plataforma pode calcular automaticamente:
   - Total de códigos de cadastro via cupom
   - Total de assinaturas pagas (STARTER + PRO)
   - Valor total a comissionar (% configurable por cupom ou influenciador)

### O que NÃO estamos construindo

- Auto-pagamento de comissões (será manual ou integração futura com stripe/wise)
- Dashboard público para o influenciador (dados ficarão no painel admin do Avisus por enquanto)
- Sistema de afiliados multi-nível (apenas rastreamento direto)
- Análise de performance detalhada (cliques, impressões, tempo no site) — apenas rastreamento de cadastro/conversão
- Integração com redes de afiliados (Impact, Awin, etc) — apenas cupom simples
- Validação de limite de uso por cupom (cupom pode ser usado ilimitadamente até ser desativado)

---

## User Flows

### Flow 1: Influenciador recebe cupom
1. Admin do Avisus cria um cupom associado ao influenciador no painel
2. Sistema gera código único e link de referência
3. Admin compartilha código/link com o influenciador via email/dashboard

### Flow 2: Novo usuário se cadastra via cupom
1. Usuário clica em link com `?ref=CUPOM_CODE` ou insere manualmente o código no cadastro
2. Sistema valida se o cupom existe e está ativo
3. Usuário preenche formulário de perfil (estado, cidade, interesses, email)
4. Usuário escolhe plano (FREE, STARTER, PRO)
5. Se plano pago, usuário paga via Stripe
6. Após confirmação:
   - Novo usuário é criado com `referral_code = CUPOM_CODE`
   - Novo registro em tabela `referral_conversions` com:
     - cupom_id
     - user_id
     - plan_selected (FREE / STARTER / PRO)
     - date_signup
     - date_paid (null se FREE)
7. Usuário recebe email de boas-vindas

### Flow 3: Admin visualiza performance do cupom
(Descrito na especificação de tela separada)

---

## Estrutura de Dados

### Tabela: `referral_coupons`
```
id                    UUID (PK)
code                  STRING (unique, ex: "ALFRED_AVISUS_2025")
influencer_name       STRING (ex: "Alfred")
influencer_email      STRING
created_at            TIMESTAMP
expires_at            TIMESTAMP (null = sem expiração)
is_active             BOOLEAN (default: true)
commission_rate       DECIMAL (0.01 = 1%, ex: 0.10 para 10%)
notes                 TEXT (motivo, contexto)
```

### Tabela: `referral_conversions`
```
id                    UUID (PK)
coupon_id             UUID (FK → referral_coupons)
user_id               UUID (FK → users)
plan_selected         ENUM (FREE, STARTER, PRO)
signup_date           TIMESTAMP
first_paid_date       TIMESTAMP (null se ainda em FREE)
is_active             BOOLEAN (para rastrear se assinatura foi cancelada)
paid_amount           DECIMAL (valor da primeira assinatura, ex: 49.00 ou 99.00)
notes                 TEXT
```

### Modificação em `users`
```
referral_coupon_id    UUID (FK → referral_coupons, nullable)
referral_source       ENUM (direct, coupon, email, facebook, etc) 
```

---

## Requisitos Técnicos

### RF-01: Criação de Cupom
- Admin pode criar cupom com código, nome do influenciador, taxa de comissão, data de expiração
- Código deve ser único e validável (alfanumérico, 5-30 caracteres)
- Cupom pode ser desativado sem deletar histórico

### RF-02: Validação de Cupom no Cadastro
- Ao submeter o formulário de inscrição com cupom, validar:
  - Cupom existe
  - Cupom está ativo
  - Cupom não expirou (se tiver data de expiração)
  - Retornar erro amigável se inválido
- Se válido, pré-preencher referral_coupon_id no usuario antes do pagamento

### RF-03: Rastreamento de Conversão
- Quando usuário com cupom completa cadastro (FREE) → registrar em referral_conversions com plan_selected=FREE, signup_date=now
- Quando usuário com cupom completa pagamento (STARTER/PRO) → atualizar referral_conversions com plan_selected=STARTER/PRO, first_paid_date=now, paid_amount=valor_pago
- Se usuário não completa pagamento, deixar signup_date mas não preencher first_paid_date

### RF-04: URL de Referência
- Links como `https://avisus.app/?ref=ALFRED_AVISUS_2025` devem pre-preencher o campo de cupom no formulário
- URL parameter `ref` deve ser sanitizado e validado antes de usar

### RF-05: Email de Confirmação
- Após conversão para plano pago, email deve mencionar:
  - Boas-vindas ao plano
  - Se capturou cupom, um "Obrigado por usar nosso link!" (sem expor o influenciador)

---

## Fluxo de Dados

```
Influenciador
    ↓
Admin cria cupom (referral_coupons)
    ↓
Link/código compartilhado
    ↓
Novo usuário entra em avisus.app/?ref=CUPOM_CODE
    ↓
Valida cupom (RF-02)
    ↓
Usuário preenche cadastro → escolhe plano
    ↓
Se FREE: Cria users + referral_conversions (plan=FREE)
Se STARTER/PRO: Stripe pagamento → Cria users + referral_conversions (plan=STARTER/PRO, first_paid_date=agora)
    ↓
Admin visualiza dashboard de cupons (próxima spec)
    ↓
Admin calcula: Total Inscritos, Total Assinantes Pagos, Comissão Total
```

---

## Métricas de Sucesso

| Métrica | Target | Frequência |
|---------|--------|-----------|
| Taxa de conversão cupom → assinatura paga | ≥ 3% | Mensal |
| Número de cupons ativos | ≥ 10 | Contínuo |
| Receita de comissões pagas | >R$ 1.000/mês | Mensal |
| Taxa de erro na validação de cupom | < 1% | Semanal |

---

## Riscos & Dependências

### Riscos
- **Fraude de cupom**: Usuário poderia criar múltiplas contas via mesmo cupom. *Mitigação*: Limitar a 1 assinatura paga por email/telefone
- **Influenciador divulga cupom de outro**: Sem enforcement. *Mitigação*: Termos de uso claramente definem propriedade do cupom
- **Cupom expirado não é removido do banco**: Usuários tentam usar. *Mitigação*: Validar `expires_at IS NULL OR expires_at > NOW()` sempre

### Dependências
- Sistema de pagamento Stripe já em produção (RF-03 precisa de confirmação de pagamento)
- Emails transacionais funcionando (RF-05)
- Admin painel existente para criar cupons

---

## Roadmap Pós-MVP

- **V2**: Dashboard público para influenciador (view-only de suas conversões)
- **V2**: Auto-cálculo e relatório de comissão mensal (CSV export)
- **V3**: Webhook para integrar com Stripe → detectar cancelamentos e rebaixamentos de plano
- **V3**: Bonus/penalty por performance (ex: + comissão se 10+ conversões pagas no mês)
- **V3**: Cupom com limite máximo de uso (ex: "máximo 100 inscrições")

