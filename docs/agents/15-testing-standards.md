# 15-testing-standards.md: Padrões de Testes de Interface

> **Parte de:** [AGENTS.md](AGENTS.md)
> **Relacionado:** [04-coding-standards.md](04-coding-standards.md) | [11-ai-collaboration.md](11-ai-collaboration.md)

## Regra Fundamental

> **Toda tela ou componente de feature entregue DEVE vir acompanhado de testes de interface.**
>
> Nenhum PR que adicione ou altere uma tela será considerado completo sem os testes correspondentes.

## Stack de Testes

| Camada | Ferramenta | Finalidade |
|--------|-----------|-----------|
| Testes de componente | `vitest` + `@testing-library/react` | Comportamento de UI sem browser real |
| Interação do usuário | `@testing-library/user-event` | Simular cliques, digitação, seleções |
| Asserções DOM | `@testing-library/jest-dom` | Matchers como `toBeInTheDocument`, `toBeDisabled` |
| Ambiente | `jsdom` | DOM sintético para testes rápidos |
| E2E de login | `puppeteer-core` | Fluxo de autenticação (existente) |

**Requisito de runtime:** Node.js >= 18 (Vitest não suporta versões anteriores).

## Estrutura de Arquivos

```
src/
  __tests__/
    features/
      favorites/        → AddSellerForm.test.tsx
      notifications/    → ChannelConfig.test.tsx
      profile/          → ProfileForm.test.tsx
      onboarding/       → OnboardingWizard.test.tsx
  test/
    setup.ts            → Importa @testing-library/jest-dom
vitest.config.ts        → Configuração global
```

### Regra de localização

- Testes ficam em `src/__tests__/features/<módulo>/` espelhando `src/features/<módulo>/`
- O arquivo de teste tem o mesmo nome do componente com sufixo `.test.tsx`

## Comandos

```bash
npm test          # roda todos os testes uma vez (CI)
npm run test:watch  # modo watch para desenvolvimento
```

## O Que Testar

Foque em **comportamento observável pelo usuário**, não em detalhes de implementação.

### Checklist mínimo por tela

- [ ] Renderiza sem erro com props padrão
- [ ] Campos de formulário recebem entrada do usuário
- [ ] Validação exibe mensagem de erro para entrada inválida
- [ ] Submissão chama a callback/action correta com os dados corretos
- [ ] Estados de carregamento/desabilitado são aplicados ao botão de submit
- [ ] Mensagens de erro do servidor são exibidas ao usuário
- [ ] Callbacks de sucesso são chamadas quando a operação conclui

### O Que NÃO Testar

- Estilos inline ou valores CSS — use testes visuais separados se necessário
- Detalhes internos de hooks — teste o efeito no DOM
- Lógica pura de negócio já coberta por testes unitários separados

## Padrão de Mocks

### Regra geral

Mocke apenas o que tem dependências externas (I/O, browser APIs, servidor). Deixe lógica pura React rodar normalmente.

### O que sempre mockar

| Módulo | Motivo |
|--------|--------|
| `@/features/*/actions` | Server Actions importam Supabase (não disponível em jsdom) |
| `next/navigation` (`useRouter`) | Navegação Next.js não funciona em jsdom |
| `next/link` | Usa cliente Next.js |
| `@/components/AppIcon` | Ícones SVG não são relevantes para comportamento |
| Hooks com `useMutation` / react-query | Precisam de `QueryClientProvider` — mocke o hook inteiro |

### O que NÃO precisar mockar

- Componentes React puros (`Toggle`, `Badge`, `Chip`) — têm comportamento testável
- Utilitários JS puros (`@/lib/styles`, `@/lib/plan-limits`, `@/lib/scanner/live/url-parser`)
- Schemas Zod — testam a validação real do formulário

### Templates de mock comuns

```typescript
// Server actions
vi.mock("@/features/profile/actions", () => ({
  updateAlertChannels: vi.fn(),
  updateSilenceWindow: vi.fn(),
}));

// next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// AppIcon (visual — sem comportamento)
vi.mock("@/components/AppIcon", () => ({
  AppIcon: () => null,
}));

// Hook com react-query interno
vi.mock("@/features/profile/hooks", () => ({
  useProfile: vi.fn(),
}));
// No teste: vi.mocked(useProfile).mockReturnValue({ profile: {...}, ... });
```

## Padrão de Consulta ao DOM

Prefira consultas semânticas nesta ordem:

1. `getByRole` — usa ARIA roles (melhor para acessibilidade)
2. `getByLabelText` — associa ao label do formulário
3. `getByPlaceholderText` — para inputs sem label visível
4. `getByText` — para texto visível
5. `getByTestId` — último recurso (adicione `data-testid` só se necessário)

```typescript
// Preferir
screen.getByRole("button", { name: /Adicionar/ })
screen.getByRole("switch", { name: /Canal web/i })

// Para encontrar o container de um texto clicável
screen.getByText("Telegram").closest("button")

// Último recurso
screen.getByTestId("region-selector")
```

## Interações Assíncronas

Use `userEvent.setup()` para simular interações reais do usuário. Use `waitFor` para aguardar efeitos assíncronos.

```typescript
const user = userEvent.setup();

// Digitação
await user.type(input, "texto");

// Clique
await user.click(button);

// Seleção em <select>
await user.selectOptions(combobox, "opcao");

// Asserção assíncrona
await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Erro"));

// Ou usar findBy (combina waitFor + getBy)
expect(await screen.findByRole("alert")).toBeInTheDocument();
```

## Exemplo Completo

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MinhaTelaForm } from "@/features/minha-feature/MinhaTelaForm";

vi.mock("@/features/minha-feature/actions", () => ({
  salvarDados: vi.fn(),
}));

vi.mock("@/components/AppIcon", () => ({ AppIcon: () => null }));

import { salvarDados } from "@/features/minha-feature/actions";

describe("MinhaTelaForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("desabilita o botão de submit quando o input está vazio", () => {
    render(<MinhaTelaForm />);
    expect(screen.getByRole("button", { name: /Salvar/ })).toBeDisabled();
  });

  it("chama salvarDados com os dados corretos ao submeter", async () => {
    vi.mocked(salvarDados).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<MinhaTelaForm />);
    await user.type(screen.getByLabelText("Nome"), "Produto Teste");
    await user.click(screen.getByRole("button", { name: /Salvar/ }));
    await waitFor(() =>
      expect(salvarDados).toHaveBeenCalledWith({ nome: "Produto Teste" }),
    );
  });

  it("exibe mensagem de erro quando salvarDados falha", async () => {
    vi.mocked(salvarDados).mockResolvedValue({ ok: false, message: "Erro de rede." });
    const user = userEvent.setup();
    render(<MinhaTelaForm />);
    await user.type(screen.getByLabelText("Nome"), "Produto Teste");
    await user.click(screen.getByRole("button", { name: /Salvar/ }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Erro de rede."),
    );
  });
});
```

---

*Retornar ao [Índice Principal](AGENTS.md) | Anterior: [14-design-system.md](14-design-system.md)*
