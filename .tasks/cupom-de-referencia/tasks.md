# Cupom de Referência — Lista de Tarefas

## Tarefas

| # | Título | Status | Complexidade | Dependências |
|---|--------|--------|-------------|--------------|
| 01 | Criar modelo Supabase de referrals e admin | done | high | — |
| 02 | Implementar regras server-side de referral | done | high | task_01 |
| 03 | Capturar referência no middleware e proteger `/admin` | done | medium | task_01, task_02 |
| 04 | Integrar cupom ao cadastro por e-mail e OAuth | done | high | task_02, task_03 |
| 05 | Criar campo de cupom no cadastro | done | medium | task_02, task_04 |
| 06 | Criar base administrativa e autenticação admin | done | medium | task_01, task_03 |
| 07 | Implementar CRUD admin de cupons | done | high | task_02, task_06 |
| 08 | Criar UI admin de cupons e métricas | done | high | task_06, task_07 |
| 09 | Registrar primeira conversão paga via Stripe | pending | high | task_02 |
| 10 | Implementar exportação simples e mensagens could-have | pending | medium | task_07, task_08, task_09 |
