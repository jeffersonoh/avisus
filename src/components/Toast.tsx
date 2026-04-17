"use client";

import { type VariantProps, cva } from "class-variance-authority";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

const toastVariants = cva(
  "pointer-events-auto flex max-w-[min(420px,calc(100vw-32px))] items-center gap-2 rounded-2xl border px-4 py-3 text-center text-sm font-semibold shadow-lg transition-all duration-200 dark:shadow-xl",
  {
    variants: {
      variant: {
        success: "border-success/35 bg-card text-text-1 dark:border-success/40 dark:bg-card",
        error: "border-danger/40 bg-card text-text-1 dark:border-danger/45 dark:bg-card",
        warning: "border-warning/40 bg-card text-text-1 dark:border-warning/45 dark:bg-card",
        info: "border-border bg-card text-text-1 dark:border-border dark:bg-card",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>;

type ToastRecord = {
  id: string;
  message: ReactNode;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: ReactNode, options?: { variant?: ToastVariant; durationMs?: number }) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Provedor de fila de toasts. Envolver segmentos da app que usem `useToast`.
 * `durationMs` default em `showToast`: `4200`.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<ToastRecord[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback(
    (message: ReactNode, options?: { variant?: ToastVariant; durationMs?: number }) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const variant = options?.variant ?? "info";
      const durationMs = options?.durationMs ?? 4200;
      setItems((prev) => [...prev, { id, message, variant }]);
      const handle = window.setTimeout(() => dismissToast(id), durationMs);
      timers.current.set(id, handle);
    },
    [dismissToast],
  );

  useEffect(() => {
    const timerMap = timers.current;
    return () => {
      timerMap.forEach((t) => clearTimeout(t));
      timerMap.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return ctx;
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastRecord[];
  onDismiss: (id: string) => void;
}) {
  const labelId = useId();
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-[5.5rem] left-1/2 z-[10001] flex w-full max-w-lg -translate-x-1/2 flex-col items-center gap-2 px-4 md:bottom-8"
      aria-live="polite"
      aria-relevant="additions text"
      aria-labelledby={labelId}
    >
      <span id={labelId} className="sr-only">
        Notificações
      </span>
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            toastVariants({ variant: item.variant }),
            "translate-y-0 opacity-100 transition-[opacity,transform] duration-200 ease-out",
          )}
        >
          <span className="flex-1">{item.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-text-3 hover:bg-text-3/10 hover:text-text-1"
          >
            Fechar
          </button>
        </div>
      ))}
    </div>
  );
}

export { toastVariants };
