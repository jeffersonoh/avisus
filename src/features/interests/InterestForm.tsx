"use client";

import { useEffect, useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { cn } from "@/lib/cn";

import {
  InterestSchema,
  normalizeInterestTerm,
  type InterestActionResult,
} from "./hooks";

type InterestFormMode = "create" | "edit";

export type InterestFormProps = {
  mode?: InterestFormMode;
  defaultValue?: string;
  disabled?: boolean;
  pending?: boolean;
  submitLabel?: string;
  placeholder?: string;
  className?: string;
  onSubmit: (term: string) => Promise<InterestActionResult> | InterestActionResult;
  onCancel?: () => void;
  onLimitReached?: () => void;
  onSuccess?: () => void;
};

export function InterestForm({
  mode = "create",
  defaultValue = "",
  disabled = false,
  pending = false,
  submitLabel,
  placeholder = "Ex.: parafusadeira, iphone, tênis nike",
  className,
  onSubmit,
  onCancel,
  onLimitReached,
  onSuccess,
}: InterestFormProps) {
  const [term, setTerm] = useState(defaultValue);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTerm(defaultValue);
    setErrorMessage(null);
  }, [defaultValue]);

  const isBusy = disabled || pending || isSubmitting;
  const buttonLabel =
    submitLabel ?? (mode === "edit" ? "Salvar alteração" : "Adicionar interesse");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    const parsed = InterestSchema.safeParse({ term });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Informe um termo válido.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await onSubmit(normalizeInterestTerm(parsed.data.term));
      if (!result.ok) {
        setErrorMessage(result.message);
        if (result.reason === "limit") {
          onLimitReached?.();
        }
        return;
      }

      if (mode === "create") {
        setTerm("");
      }

      onSuccess?.();
    } catch {
      setErrorMessage("Não foi possível salvar agora. Tente novamente em instantes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={cn("space-y-2", className)} onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor={`interest-input-${mode}`} className="sr-only">
            Termo de interesse
          </label>
          <input
            id={`interest-input-${mode}`}
            name="term"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
            placeholder={placeholder}
            maxLength={60}
            disabled={isBusy}
            aria-invalid={Boolean(errorMessage)}
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            <AppIcon name={mode === "edit" ? "check" : "plus"} size={15} className="text-white" />
            {isSubmitting ? "Salvando..." : buttonLabel}
          </button>
          {mode === "edit" && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isBusy}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-text-2 transition hover:border-accent-light hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <p className="text-sm text-danger" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
