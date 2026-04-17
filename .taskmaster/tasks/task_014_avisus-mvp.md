# Task ID: 14

**Title:** Feature interests — CRUD de termos com limites de plano

**Status:** done

**Dependencies:** 12

**Priority:** high

**Description:** UI de interesses com CRUD e mensagens de limite por plano (FREE 5, STARTER 20, PRO ilimitado), validação inline e empty states.

**Details:**

Contexto:
- Equivalente a T-032 (tasks.md). F01 do PRD (RF-01/02/03 e CA-26).

Escopo:
- `src/features/interests/`: `InterestList.tsx`, `InterestForm.tsx`, `hooks.ts`.
- Empty state com CTA e sugestões populares (onboarding — RF-02).
- Mensagem de limite com CTA upgrade (CA-26).

Fora de escopo:
- Enforcement backend (T-040).
- Preview em tempo real de ofertas (desvio D2 — fora do MVP).

Implementação:
- Arquivos/módulos: `src/features/interests/*.tsx`, `src/app/(app)/interesses/page.tsx`.
- Regras e validações: Zod `InterestSchema` (term min 2 chars, max 60); normalização `toLowerCase`; deduplicação client-side por `LOWER(term)`.

Critérios de pronto:
- Adicionar, editar e remover termos funciona.
- Tentativa de ultrapassar limite exibe modal de upgrade.
- Estado vazio mostra sugestões.

**Test Strategy:**

Cenários de teste:
- [ ] FREE: cadastrar 5 termos, sexto bloqueia.
- [ ] Termo duplicado (case-insensitive) bloqueia.
- [ ] Editar persiste e some da UI após remover.

Validações técnicas:
- [ ] Validação Zod client e server consistente.
- [ ] Mensagens em PT-BR, CTA visível.

## Subtasks

### 14.1. Criar formulário de interesse (InterestForm) com validação Zod

**Status:** done  
**Dependencies:** None  

Desenvolver o componente React `InterestForm.tsx` para adicionar e editar termos de interesse, implementando a validação dos dados de entrada com a biblioteca Zod.

**Details:**

Criar um esquema Zod (`InterestSchema`) que valide o termo: mínimo de 2 caracteres, máximo de 60. O formulário deve normalizar o input para `toLowerCase` e ser usado tanto para criação quanto para edição.

### 14.2. Desenvolver a lista de interesses (InterestList) para exibir e remover termos

**Status:** done  
**Dependencies:** 14.1  

Criar o componente `InterestList.tsx` que renderiza a lista de termos de interesse cadastrados pelo usuário. Cada item da lista deve incluir uma funcionalidade para remoção.

**Details:**

O componente deve listar os interesses existentes do usuário. Implementar a ação de exclusão para cada termo, garantindo que a UI seja atualizada dinamicamente após a remoção de um item.

### 14.3. Implementar lógica de UI para limites de plano e estado vazio (empty state)

**Status:** done  
**Dependencies:** 14.1, 14.2  

Integrar a lógica que gerencia a experiência do usuário com base no seu plano e na quantidade de interesses, incluindo o estado vazio com sugestões e o bloqueio com CTA de upgrade ao atingir o limite.

**Details:**

Quando a lista estiver vazia, exibir um componente com sugestões de termos populares (RF-02). Se o limite do plano for atingido (5 para FREE, 20 para STARTER), desabilitar o formulário e exibir um CTA de upgrade (CA-26).
