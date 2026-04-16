# ADR 007: Modelo freemium com enforcement exclusivamente no backend

## Status

Aceita

## Data

2026-04-16

## Contexto

O Avisus opera em modelo freemium em três camadas (FREE, STARTER, PRO), com limites diferenciados por recurso:

| Recurso | FREE | STARTER | PRO |
|---------|------|---------|-----|
| Termos de interesse | 5 | ∞ | ∞ |
| Alertas/dia (ofertas + lives) | 5 | ∞ | ∞ |
| Frequência de scan | 2 h | 30 min | 5 min |
| Histórico de preços | 7 dias | 30 dias | 90 dias |
| Vendedores favoritos | 3 | 15 | ∞ |

Os limites definem a monetização do produto. Se um usuário FREE conseguisse burlá-los via devtools, manipulação de requests ou chamadas diretas à API, o modelo freemium colapsa. O protótipo atual faz toda a lógica no cliente, o que é aceitável para validação visual, mas não para produção.

## Decisão

**Todos** os limites de plano são verificados no **backend**. O frontend pode ler os limites para exibir CTAs de upgrade, mas a verificação autoritativa ocorre exclusivamente em Server Actions, Route Handlers e Scanner Functions.

- **Fonte única de verdade:** `src/lib/plan-limits.ts` exporta `PLAN_LIMITS: Record<Plan, PlanLimits>`
- **Interesses:** Server Action `addInterest` consulta `SELECT count(*)` antes de inserir; rejeita com `LIMIT_REACHED` se `count >= PLAN_LIMITS[plan].maxInterests`
- **Alertas:** função SQL `alerts_sent_today(user_id)` soma ofertas (`alerts`) + lives (`live_alerts`) no dia em `America/Sao_Paulo`; Scanner/Live Monitor pulam envio se excedido
- **Frequência de scan:** Scanner filtra `interests` por `last_scanned_at` + `scanIntervalMin` do plano
- **Vendedores favoritos:** Server Action valida `count` antes de inserir em `favorite_sellers`
- **Histórico de preços:** consultas de UI filtram por `detected_at > NOW() - historyDays`
- **Plano autoritativo:** `profiles.plan` é atualizado pelo trigger `sync_profile_plan()` a partir de `subscriptions` (Stripe webhook)
- **RLS como barreira complementar:** cada tabela restringe leitura/escrita a `auth.uid() = user_id`

## Alternativas Consideradas

- **Enforcement apenas no frontend** → descartada — qualquer dev consegue remover validações pelo devtools
- **Enforcement parcial (frontend + dupla checagem opcional no backend)** → descartada pela inconsistência e risco de esquecer pontos críticos
- **Limites no próprio Postgres (CHECK constraints + triggers)** → descartada por acoplar regras de negócio ao schema e dificultar mudanças futuras (migrar limite de 5 → 7 exigiria migration)

## Consequências

**Positivas:**

- Impossível burlar limites sem comprometer a sessão autenticada
- Scanner respeita intervalo por plano, evitando custo de ScrapingBee desnecessário para usuários FREE
- Mudanças de limite acontecem em código (`PLAN_LIMITS`), versionadas e testáveis com Vitest
- Frontend e backend leem a mesma constante — sem divergência

**Negativas:**

- Toda Server Action envolvendo contagem precisa de query adicional antes de inserir (latência marginal)
- Testes de integração precisam cobrir cada limite em cada plano (FREE × STARTER × PRO)
- Mensagens de erro devem ser convertidas em CTAs de upgrade no frontend (UX de fricção)

**Neutras:**

- Limites `Infinity` no TypeScript mapeiam para "sem verificação" (condicional `isFinite(limit)`)

## Referências

- Modelo de planos completo: `docs/agents/06-domain-model.md` (seção Planos e Limites)
- Enforcement e exemplos: `docs/agents/07-security.md` (seção Limites de Plano)
- Padrões de código: `docs/agents/04-coding-standards.md` (seção Limites de Plano)
- Tech Spec: `.tasks/avisus-mvp/tech-spec.md`

> Todo ADR deve ter no máximo uma página.
