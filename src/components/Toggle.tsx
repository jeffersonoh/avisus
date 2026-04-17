"use client";

import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/cn";

export interface ToggleProps {
  /** Modo controlado: estado externo. Omitir para modo não controlado. */
  checked?: boolean;
  /** Modo não controlado: valor inicial quando `checked` é omitido. Default: `false`. */
  defaultChecked?: boolean;
  onChange?: (next: boolean) => void;
  /** Identificador para associar label acessível. */
  id?: string;
  /** Default: `false`. */
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/**
 * `defaultChecked` default `false`. `disabled` default `false`.
 * Em modo controlado, `checked` deve refletir o estado mantido pelo componente pai.
 */
export function Toggle({
  checked,
  defaultChecked = false,
  onChange,
  id,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: ToggleProps) {
  const controlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const onRef = useRef(onChange);
  onRef.current = onChange;

  const isOn = controlled ? Boolean(checked) : internal;

  const toggle = useCallback(() => {
    if (disabled) return;
    const next = !isOn;
    if (!controlled) {
      setInternal(next);
    }
    onRef.current?.(next);
  }, [controlled, disabled, isOn]);

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-disabled={disabled}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      onClick={toggle}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        isOn ? "bg-accent" : "bg-text-3/40 dark:bg-text-3/30",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 size-5 rounded-full bg-white shadow transition-[transform]",
          isOn ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
