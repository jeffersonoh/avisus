# Diretrizes de Contribuição

Este documento define as convenções mínimas para contribuir com o Avisus. O projeto é mantido em modo solo dev e evoluirá conforme novos colaboradores forem integrados; por isso, as regras aqui são intencionalmente enxutas — foco em consistência de histórico e clareza de intenção.

## Branches

Trabalhe sempre em uma branch derivada de `main`. Use os prefixos abaixo:

| Prefixo | Uso |
|---------|-----|
| `feature/` | Novas funcionalidades (ex: `feature/scanner-mercado-livre`) |
| `fix/` | Correção de bugs (ex: `fix/live-monitor-timeout`) |
| `refactor/` | Refatoração sem mudança de comportamento |
| `docs/` | Mudanças apenas em documentação |
| `chore/` | Tarefas operacionais (deps, scripts, configs) |

Nome da branch em kebab-case, descritivo e curto.

## Mensagens de Commit

Formato obrigatório em **português do Brasil**:

```text
tipo(escopo): descrição curta no imperativo
```

Tipos aceitos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

**Exemplos válidos:**

- `feat(scanner): adicionar scanner Mercado Livre via API de afiliados`
- `fix(live-monitor): tratar timeout da API Shopee sem interromper polling`
- `docs(adr): registrar decisão de usar Supabase como backend`
- `refactor(margin-calculator): extrair cálculo de taxa para função pura`
- `chore(deps): atualizar Vite para 8.0.8`

**Regras:**

- Primeira linha até 72 caracteres, sem ponto final
- Imperativo ("adicionar", não "adicionado")
- Corpo opcional após linha em branco, explicando **por quê** a mudança é necessária
- Sem mensagens genéricas (`wip`, `ajustes`, `fix`)
- Nunca incluir arquivos de IDE pessoal (`.idea/`, `.vscode/`, `.run/`)

## Padrões de Código

Ao tocar código-fonte, siga os padrões descritos em `docs/agents/04-coding-standards.md`. Resumo do que é bloqueante:

- **TypeScript strict** — sem `any`
- **Tailwind only** para estilização (sem CSS inline em componentes)
- **Zod** para validar toda entrada de usuário
- **Supabase client correto** por contexto (server / browser / service role)
- **Limites de plano** sempre verificados no backend
- **Secrets** apenas em variáveis de ambiente; nunca hardcoded

Regras de segurança adicionais (OWASP, LGPD) em `docs/agents/07-security.md`.

## Processo de Contribuição

1. Abra uma branch a partir de `main` com o prefixo adequado
2. Implemente a mudança e atualize a documentação relevante quando aplicável
3. Rode os testes locais (`npm test` quando a stack de testes estiver integrada)
4. Faça commits seguindo o padrão acima
5. Abra um Merge Request descrevendo o **porquê** da mudança e referenciando issue/tarefa (quando existir)

Para mudanças estruturais (stack, arquitetura, integrações), registre uma nova ADR em `docs/adrs/` antes de implementar.

## Code Review

Enquanto o projeto for solo, a revisão é auto-aplicada pelo autor antes do merge. Ao integrar colaboradores, o checklist mínimo é:

- [ ] Código segue `docs/agents/04-coding-standards.md`
- [ ] Checklist de segurança de `docs/agents/07-security.md` aplicável está atendido
- [ ] Mudanças de schema acompanhadas de migração em `supabase/migrations/`
- [ ] Mudanças de integração externa documentadas em `docs/agents/09-integrations.md`

## Licença

Projeto privado. Ao contribuir, o autor concorda com os termos definidos pelo owner do repositório.
