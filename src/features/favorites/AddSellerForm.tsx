"use client";

import { useState } from "react";

import { AppIcon } from "@/components/AppIcon";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBusy = disabled || isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    const parsed = SellerUrlSchema.safeParse(url);
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
        if (result.reason === "limit") {
          onLimitReached?.();
        }
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
    <form className="space-y-2" onSubmit={handleSubmit} noValidate>
      <label htmlFor="favorite-seller-url" className="sr-only">
        URL do vendedor
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          id="favorite-seller-url"
          name="seller_url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          placeholder="Cole o link da Shopee ou TikTok"
          disabled={isBusy}
          aria-invalid={Boolean(errorMessage)}
          className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
        />

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          <AppIcon name="plus" size={15} className="text-white" />
          {isSubmitting ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      <p className="text-xs text-text-3">
        Exemplos válidos: `https://shopee.com.br/usuario` ou `https://www.tiktok.com/@usuario`.
      </p>

      {errorMessage ? (
        <p className="text-sm text-danger" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
