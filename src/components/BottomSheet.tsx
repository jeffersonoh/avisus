"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const ANIM_MS = 280;

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Painel inferior controlado por `isOpen` com animação de entrada/saída.
 * Fecha ao clicar no backdrop ou pressionar Escape.
 */
export function BottomSheet({ isOpen, onClose, title, description, children, className }: BottomSheetProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), ANIM_MS);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!mounted) return undefined;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mounted, onKeyDown]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9998] flex flex-col justify-end bg-text-1/40 backdrop-blur-sm transition-opacity duration-200 dark:bg-black/50",
        visible ? "opacity-100" : "opacity-0",
      )}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={cn(
          "max-h-[85vh] overflow-y-auto rounded-t-3xl border border-b-0 border-border bg-card shadow-[0_-8px_40px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out dark:shadow-[0_-8px_40px_rgba(0,0,0,0.45)]",
          visible ? "translate-y-0" : "translate-y-full",
          className,
        )}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pb-1 pt-2.5">
          <div className="h-1 w-9 rounded-sm bg-border" />
        </div>
        {(title ?? description) ? (
          <div className="border-b border-border px-4 pb-3 pt-1">
            {title ? <div className="text-base font-bold text-text-1">{title}</div> : null}
            {description ? <div className="mt-1 text-xs text-text-3">{description}</div> : null}
          </div>
        ) : null}
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
