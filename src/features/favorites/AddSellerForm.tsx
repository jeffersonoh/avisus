"use client";

import { useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { inputStyle } from "@/lib/styles";

import { SellerUrlSchema, type FavoriteSellerActionResult } from "./hooks";

export type AddSellerFormProps = {
  disabled?: boolean;
  onSubmit: (url: string) => Promise<FavoriteSellerActionResult> | FavoriteSellerActionResult;
  onLimitReached?: () => void;
  onSuccess?: () => void;
};

export function AddSellerForm({
  disabled = false,
  onSubmit,
  onLimitReached,
  onSuccess,
}: AddSellerFormProps) {
  const [url, setUrl] = useState("");
  const [inputMode, setInputMode] = useState<"link" | "nome">("link");
  const [selectedPlatform, setSelectedPlatform] = useState<"shopee" | "tiktok">("shopee");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBusy = disabled || isSubmitting;

  function buildUrl(): string {
    if (inputMode === "link") return url.trim();
    const username = url.trim().replace(/^@/, "");
    if (!username) return "";
    return selectedPlatform === "shopee"
      ? `https://shopee.com.br/${username}`
      : `https://www.tiktok.com/@${username}`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || !url.trim()) return;

    const finalUrl = buildUrl();
    const parsed = SellerUrlSchema.safeParse(finalUrl);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Informe uma URL válida.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await onSubmit(parsed.data);
      if (!result.ok) {
        setErrorMessage(result.message);
        if (result.reason === "limit") onLimitReached?.();
        return;
      }
      setUrl("");
      onSuccess?.();
    } catch {
      setErrorMessage("Não foi possível salvar agora. Tente novamente em instantes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {(["link", "nome"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => { setInputMode(mode); setUrl(""); setErrorMessage(null); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-body)",
              border: inputMode === mode
                ? "1px solid color-mix(in srgb, var(--accent) 40%, transparent)"
                : "1px solid var(--border)",
              background: inputMode === mode
                ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                : "var(--margin-block-bg)",
              color: inputMode === mode ? "var(--accent)" : "var(--text-3)",
            }}
          >
            <AppIcon
              name={mode === "link" ? "link" : "search"}
              size={10}
              stroke={inputMode === mode ? "var(--accent)" : "var(--text-3)"}
            />
            {mode === "link" ? "Por link" : "Por nome"}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {inputMode === "nome" && (
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as "shopee" | "tiktok")}
            disabled={isBusy}
            style={{
              padding: "10px 8px", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--text-1)", fontSize: 12, fontWeight: 600,
              fontFamily: "var(--font-body)", cursor: "pointer", outline: "none", minWidth: 90,
            }}
          >
            <option value="shopee">Shopee</option>
            <option value="tiktok">TikTok</option>
          </select>
        )}
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            display: "inline-flex", pointerEvents: "none",
          }}>
            <AppIcon name={inputMode === "link" ? "link" : "search"} size={14} stroke="var(--text-3)" />
          </span>
          <input
            id="favorite-seller-url"
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (errorMessage) setErrorMessage(null); }}
            placeholder={
              inputMode === "link"
                ? "Cole o link do perfil (Shopee ou TikTok)"
                : "Nome ou @username do vendedor"
            }
            disabled={isBusy}
            aria-invalid={Boolean(errorMessage)}
            style={{ ...inputStyle, fontSize: 13, padding: "10px 14px", paddingLeft: 36, borderRadius: 10 }}
          />
        </div>
        <button
          type="submit"
          disabled={isBusy || !url.trim()}
          style={{
            padding: "10px 16px", borderRadius: 10, border: "none", flexShrink: 0,
            cursor: isBusy || !url.trim() ? "not-allowed" : "pointer",
            background: isBusy || !url.trim() ? "var(--margin-block-bg)" : "var(--accent)",
            color: isBusy || !url.trim() ? "var(--text-3)" : "#fff",
            fontSize: 12, fontWeight: 700, fontFamily: "var(--font-body)",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}
        >
          <AppIcon name="plus" size={14} stroke={isBusy || !url.trim() ? "var(--text-3)" : "#fff"} />
          {isSubmitting ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      {errorMessage && (
        <p style={{ marginTop: 6, fontSize: 12, color: "var(--danger)", margin: "6px 0 0" }} role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
