# 14-design-system.md: Sistema de Design

> **Parte de:** [AGENTS.md](AGENTS.md) — Guia de Colaboração com IA
> **Relacionado:** [04-coding-standards.md](04-coding-standards.md) | [03-architecture.md](03-architecture.md)

## Visão Geral

O Avisus usa **inline styles + CSS custom properties** (`var(--*)`) como sistema de design. Tailwind é reservado para responsividade e estrutura de layout. Toda cor, sombra, tipografia e espaçamento decorativo vem das variáveis CSS definidas em `globals.css`.

Não compare com o protótipo para telas novas — este documento é a fonte da verdade de UI.

---

## Variáveis CSS Disponíveis

Definidas em `src/app/globals.css`. Todas funcionam em light e dark mode automaticamente.

### Cores de marca

```css
--brand-navy: #1b2e63       /* accent principal */
--brand-navy-deep: #14254f  /* accent mais escuro */
--brand-teal: #1d8f95       /* accent claro, usado em destaques */
--brand-lime: #b7db47       /* success */
--brand-purple: #7b42c9     /* warning */
```

### Aliases semânticos (use estes, não os brand-*)

```css
--accent          /* cor primária do app (navy) */
--accent-light    /* teal — links ativos, ícones, labels */
--accent-dark     /* navy-deep — texto sobre fundo claro */
--success         /* lime — confirmações, estados ok */
--warning         /* purple — avisos, alertas não-críticos */
--danger: #d94b64 /* vermelho — erros, ações destrutivas */
--info            /* teal — informações neutras */
```

### Background e superfície

```css
--bg              /* fundo da página */
--card            /* superfície de cards/painéis */
--border          /* bordas */
--glass           /* header sticky (blur) */
--nav-active      /* fundo do item de nav ativo */
--margin-block-bg /* fundo de inputs e blocos internos */
--margin-bar-bg   /* fundo de barras e conectores */
--card-shadow     /* box-shadow padrão de cards */
```

### Hierarquia de texto

```css
--text-1   /* texto principal (alto contraste) */
--text-2   /* texto secundário */
--text-3   /* texto terciário, placeholders, labels */
```

### Tipografia

```css
--font-display: "Montserrat"  /* títulos e destaques */
--font-body: "Montserrat"     /* texto geral */
--font-mono                   /* preços, números, badges */
```

---

## Abordagem de Estilização

### Regra geral

- **Inline styles** para tudo que use tokens de design (cor, sombra, tipografia, borda decorativa)
- **Tailwind** apenas para responsividade (`md:`, `lg:`, `hidden`) e estrutura (`flex`, `min-h-screen`, `overflow-hidden`)
- **`color-mix(in srgb, X Y%, var(--Z))`** para tons derivados — nunca valores hex hardcoded

### TypeScript: literais CSS que precisam de `as const`

Algumas propriedades CSS têm tipo `string` no TypeScript mas exigem literais específicos em `CSSProperties`:

```tsx
textTransform: "uppercase" as const
boxSizing: "border-box" as const
whiteSpace: "nowrap" as const
position: "absolute" as const
```

---

## Padrões de Layout

### Página com conteúdo centralizado (onboarding, auth)

```tsx
<div style={{
  minHeight: "100vh",
  background: "var(--bg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
  fontFamily: "var(--font-body)",
}}>
  <div style={{ width: "100%", maxWidth: 480 }}>
    {/* conteúdo */}
  </div>
</div>
```

### Grid de seção (listas, dashboards)

```tsx
<div style={{ display: "grid", gap: 16 }}>
  {/* itens */}
</div>
```

---

## Card

```tsx
<div style={{
  background: "var(--card)",
  borderRadius: 24,
  padding: "28px 24px",
  border: "1px solid var(--border)",
  boxShadow: "var(--card-shadow)",
}}>
```

Com entrada animada (listas com múltiplos cards):

```tsx
style={{
  // ... card base
  animation: "cardIn 0.35s ease both",
  animationDelay: `${idx * 40}ms`,
}}
```

### Card com destaque colorido no topo

Usado em planos e seções com identidade de cor:

```tsx
const color = "#2E8B57"; // cor do plano/seção

<div style={{
  background: "var(--card)",
  borderRadius: 20,
  border: `1px solid color-mix(in srgb, ${color} 20%, var(--border))`,
  boxShadow: "var(--card-shadow)",
  overflow: "hidden",
}}>
  {/* barra colorida no topo */}
  <div style={{ height: 5, background: color }} />

  {/* cabeçalho com tint de cor */}
  <div style={{
    padding: "16px 20px",
    background: `color-mix(in srgb, ${color} 6%, var(--card))`,
    borderBottom: `1px solid color-mix(in srgb, ${color} 15%, var(--border))`,
  }}>
    {/* título, ícone */}
  </div>

  <div style={{ padding: "20px 24px" }}>
    {/* conteúdo */}
  </div>
</div>
```

---

## Tipografia de Seção

Padrão para cabeçalhos de cards e seções:

```tsx
{/* Label de seção */}
<div style={{
  fontSize: 11,
  fontWeight: 700,
  color: "var(--accent-light)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: 6,
}}>
  Passo 1 de 3
</div>

{/* Título principal */}
<div style={{
  fontSize: 22,
  fontWeight: 800,
  color: "var(--text-1)",
  marginBottom: 6,
  fontFamily: "var(--font-display)",
}}>
  Seus interesses
</div>

{/* Subtítulo */}
<div style={{ fontSize: 13, color: "var(--text-3)" }}>
  Escolha o que você quer monitorar
</div>
```

---

## Formulários

### Input padrão

```tsx
const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--margin-block-bg)",
  color: "var(--text-1)",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  boxSizing: "border-box" as const,
  outline: "none",
};
```

### Label de campo

```tsx
<label style={{
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-3)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  display: "block",
  marginBottom: 6,
}}>
  Telegram (opcional)
</label>
```

### Input com ícone à esquerda

```tsx
<div style={{ position: "relative" }}>
  <span style={{
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-3)",
    pointerEvents: "none",
  }}>
    <AppIcon name="send" size={16} />
  </span>
  <input style={{ ...inputStyle, paddingLeft: 42 }} />
</div>
```

---

## Botões

### Primário

```tsx
<button style={{
  padding: "12px 20px",
  borderRadius: 12,
  border: "none",
  background: "var(--accent)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  display: "flex",
  alignItems: "center",
  gap: 6,
}}>
  Salvar <AppIcon name="arrowUpRight" size={14} stroke="#fff" />
</button>
```

### Secundário

```tsx
<button style={{
  padding: "12px 20px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-2)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
}}>
  Voltar
</button>
```

### Destrutivo (ícone)

```tsx
<button style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid color-mix(in srgb, var(--danger) 30%, var(--border))",
  background: "color-mix(in srgb, var(--danger) 8%, transparent)",
  cursor: "pointer",
}}>
  <AppIcon name="x" size={13} stroke="var(--danger)" />
</button>
```

### Estado desabilitado (qualquer botão)

```tsx
style={{
  opacity: disabled ? 0.6 : 1,
  cursor: disabled ? "not-allowed" : "pointer",
  // Para botão primário desabilitado, trocar background:
  background: disabled ? "var(--margin-block-bg)" : "var(--accent)",
}}
```

---

## Badges e Pills

### Badge de plano

```tsx
const color = PLAN_COLOR[plan]; // "#7B42C9" | "#D4A017" | "#2E8B57"

<div style={{
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 12px",
  borderRadius: 8,
  background: `color-mix(in srgb, ${color} 12%, var(--card))`,
  border: `1px solid color-mix(in srgb, ${color} 30%, var(--border))`,
  fontSize: 11,
  fontWeight: 800,
  color: color,
  letterSpacing: "0.06em",
}}>
  PRO <AppIcon name="arrowUpRight" size={10} stroke={color} />
</div>
```

### Cores dos planos

```ts
const PLAN_COLOR: Record<Plan, string> = {
  free:    "#7B42C9",  // roxo
  starter: "#D4A017",  // dourado
  pro:     "#2E8B57",  // verde
};
```

---

## Caixas de Status / Hint

Padrão para avisos, erros e confirmações inline:

```tsx
// Warning
<div style={{
  padding: "12px 14px",
  borderRadius: 12,
  background: "color-mix(in srgb, var(--warning) 6%, var(--card))",
  border: "1px solid color-mix(in srgb, var(--warning) 18%, var(--border))",
  fontSize: 12,
  color: "var(--text-2)",
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
}}>
  <AppIcon name="bell" size={14} stroke="var(--warning)" />
  Mensagem de aviso.
</div>

// Success
background: "color-mix(in srgb, var(--success) 8%, var(--card))",
border: "1px solid color-mix(in srgb, var(--success) 22%, var(--border))",
color: "var(--success)",

// Danger / erro
background: "color-mix(in srgb, var(--danger) 8%, var(--card))",
border: "1px solid color-mix(in srgb, var(--danger) 30%, var(--border))",
color: "var(--danger)",

// Info
background: "color-mix(in srgb, var(--info) 8%, var(--card))",
border: "1px solid color-mix(in srgb, var(--info) 20%, var(--border))",
color: "var(--accent-light)",
```

---

## Toggle Row (configurações / canais)

Linha clicável com ícone + label + Toggle. O card muda de visual quando ativo:

```tsx
const active = alertChannels.includes("web");

<div style={{
  padding: "14px 16px",
  borderRadius: 14,
  border: active
    ? "1px solid color-mix(in srgb, var(--accent-light) 40%, var(--border))"
    : "1px solid var(--border)",
  background: active
    ? "color-mix(in srgb, var(--accent-light) 6%, var(--card))"
    : "var(--margin-block-bg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}}>
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      background: "color-mix(in srgb, var(--accent-light) 14%, transparent)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <AppIcon name="monitor" size={18} stroke="var(--accent-light)" />
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Web App</div>
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>Notificações no navegador</div>
    </div>
  </div>
  <Toggle checked={active} onChange={(next) => toggleChannel("web", next)} />
</div>
```

---

## Indicador de Etapas (Wizard)

```tsx
<div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
  {([1, 2, 3] as Step[]).map((n) => {
    const done = n < step;
    const active = n === step;
    return (
      <div key={n} style={{ display: "flex", alignItems: "center", flex: n < 3 ? 1 : "none" }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          flexShrink: 0,
          background: done ? "var(--success)" : active ? "var(--accent)" : "var(--margin-block-bg)",
          border: done || active ? "none" : "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color: done || active ? "#fff" : "var(--text-3)",
          transition: "all 0.3s",
        }}>
          {done ? <AppIcon name="check" size={14} stroke="#fff" /> : n}
        </div>
        {n < 3 && (
          <div style={{
            flex: 1,
            height: 2,
            background: done ? "var(--success)" : "var(--margin-block-bg)",
            margin: "0 4px",
            borderRadius: 1,
            transition: "background 0.3s",
          }} />
        )}
      </div>
    );
  })}
</div>
```

---

## Animações

Todas definidas em `globals.css`. Use via `animation` no inline style.

| Keyframe | Uso | Exemplo |
|----------|-----|---------|
| `cardIn` | Entrada de cards em lista | `animation: "cardIn 0.35s ease both"` |
| `subtlePulse` | Badges vivos, indicador de live | `animation: "subtlePulse 2s ease-in-out infinite"` |
| `floatOrb` | Orbs decorativos de fundo | `animation: "floatOrb 12s ease-in-out infinite"` |
| `authFadeIn` | Painéis de login/registro | `animation: "authFadeIn 0.4s ease"` |

### Stagger em listas

```tsx
{items.map((item, idx) => (
  <div key={item.id} style={{
    animation: "cardIn 0.35s ease both",
    animationDelay: `${idx * 40}ms`,
  }}>
```

---

## AppIcon

Componente `src/components/AppIcon.tsx`. Sempre use `stroke` para a cor do ícone (não `color` ou `fill`).

```tsx
<AppIcon name="bell" size={16} stroke="var(--accent-light)" />
<AppIcon name="check" size={14} stroke="#fff" />
<AppIcon name="x" size={12} stroke="var(--danger)" />
```

Ícones disponíveis: `bell`, `star`, `heart`, `grid`, `user`, `log-out`, `check`, `x`, `plus`, `arrowUpRight`, `arrow-left`, `chevron-right`, `chevronDown`, `chevronUp`, `trending-up`, `eye`, `zap`, `crown`, `sparkles`, `send`, `monitor`, `globe`, `info`, `lock`, `message-circle`, `alert-triangle`, `layers`, `play`, `bag`, `link`, `search`, `trash`, `video`.

---

## Logo Avisus

### Em Client Components (com ThemeProvider)

```tsx
import { useTheme } from "@/components/theme/ThemeProvider";

const { theme } = useTheme();

// eslint-disable-next-line @next/next/no-img-element
<img
  src={theme === "dark" ? "/assets/logo-dark-new.png" : "/assets/logo-light-new.png"}
  alt="Avisus"
  style={{ height: 90, objectFit: "contain" }}
/>
```

### Em Server Components (sem ThemeProvider)

```tsx
<picture>
  <source srcSet="/assets/logo-dark-new.png" media="(prefers-color-scheme: dark)" />
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src="/assets/logo-light-new.png"
    alt="Avisus"
    style={{ height: 90, objectFit: "contain" }}
  />
</picture>
```

> **Nota:** Sempre suprima `@next/next/no-img-element` quando `<img>` for necessário (logo com `clamp()`, Gravatar, imagens externas).

---

## Gravatar

Hook em `src/lib/gravatar.ts`. Padrão de uso com image probe (detecta se o usuário tem avatar antes de exibir):

```tsx
import { useGravatar } from "@/lib/gravatar";

const gravatarUrl = useGravatar(email, 64); // size em px
const [gravatarOk, setGravatarOk] = useState(false);

useEffect(() => {
  if (!gravatarUrl) { setGravatarOk(false); return; }
  setGravatarOk(false);
  const img = new Image();
  img.onload = () => setGravatarOk(true);
  img.onerror = () => setGravatarOk(false);
  img.src = gravatarUrl;
}, [gravatarUrl]);

// Renderização:
{gravatarOk ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={gravatarUrl!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
) : (
  initials
)}
```

---

## Dev Plan Switcher

Em desenvolvimento, um painel flutuante no canto inferior direito permite trocar o plano do usuário sem integração com Stripe. Renderizado automaticamente pelo `(app)/layout.tsx` quando `NODE_ENV === "development"`. Nenhuma configuração adicional necessária.

Para testar a tela de onboarding com usuário já onboardado: acesse `/onboarding?preview=1` (só funciona em dev).

---

*Retornar ao [Índice Principal](AGENTS.md) | Relacionado: [04-coding-standards.md](04-coding-standards.md)*
