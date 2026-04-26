import type React from "react";

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export const inputStyle = {
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
} satisfies React.CSSProperties;

export const inputWithIconStyle = {
  ...inputStyle,
  paddingLeft: 38,
} satisfies React.CSSProperties;

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

export const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-3)",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
} satisfies React.CSSProperties;

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export const cardStyle = {
  background: "var(--card)",
  borderRadius: 20,
  border: "1px solid var(--border)",
  boxShadow: "var(--card-shadow)",
} satisfies React.CSSProperties;

export const cardOverflowStyle = {
  ...cardStyle,
  overflow: "hidden",
} satisfies React.CSSProperties;

// ---------------------------------------------------------------------------
// Hint / status boxes
// ---------------------------------------------------------------------------

type HintVariant = "success" | "warning" | "danger" | "info";

const HINT_CSS_VAR: Record<HintVariant, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
};

export function hintBoxStyle(variant: HintVariant): React.CSSProperties {
  const v = HINT_CSS_VAR[variant];
  const textColor = variant === "warning" || variant === "info" ? "var(--text-2)" : v;
  return {
    padding: "10px 14px",
    borderRadius: 12,
    background: `color-mix(in srgb, ${v} 8%, var(--card))`,
    border: `1px solid color-mix(in srgb, ${v} 22%, var(--border))`,
    fontSize: 12,
    color: textColor,
  };
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export const btnPrimary = {
  padding: "13px 20px",
  borderRadius: 14,
  border: "none",
  background: "var(--accent)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
} satisfies React.CSSProperties;

export const btnSecondary = {
  padding: "13px 20px",
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-2)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
} satisfies React.CSSProperties;
