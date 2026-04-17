import { type VariantProps, cva } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { AppIcon, type AppIconName } from "@/components/AppIcon";
import { cn } from "@/lib/cn";

const chipVariants = cva(
  "inline-flex max-w-full items-center gap-1.5 rounded-[10px] border text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      selected: {
        false:
          "border-border bg-card text-text-3 hover:bg-text-3/5 dark:border-border dark:bg-card dark:text-text-3",
        true: "border-accent/25 bg-accent/10 text-accent-dark dark:border-accent/30 dark:bg-accent/12 dark:text-text-1",
      },
      size: {
        sm: "px-2.5 py-1 text-[11px]",
        md: "px-3.5 py-1.5 text-xs",
      },
    },
    defaultVariants: {
      selected: false,
      size: "md",
    },
  },
);

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  Omit<VariantProps<typeof chipVariants>, "selected"> & {
    label: ReactNode;
    /** Nome de ícone do `AppIcon` ou nó React. */
    icon?: AppIconName | ReactNode;
    /** Destaque visual de seleção. Default: `false`. */
    active?: boolean;
    /** Botão auxiliar de remoção (ex.: chip de filtro aplicado). */
    onRemove?: () => void;
  };

/**
 * `active` default `false`; `size` default `md`; `type` default `button`; `disabled` default `false`.
 */
export function Chip({
  label,
  icon,
  active = false,
  onRemove,
  className,
  size,
  type = "button",
  disabled = false,
  ...props
}: ChipProps) {
  const selected = Boolean(active);
  const iconNode =
    icon === undefined ? null : typeof icon === "string" ? (
      <AppIcon name={icon as AppIconName} size={14} className="shrink-0" />
    ) : (
      icon
    );

  return (
    <span className="inline-flex max-w-full items-center rounded-[10px] shadow-sm">
      <button
        type={type}
        disabled={disabled}
        className={cn(
          chipVariants({ selected, size }),
          onRemove ? "rounded-r-none border-r-0 pr-2" : "",
          className,
        )}
        {...props}
      >
        {iconNode}
        <span className="min-w-0 truncate">{label}</span>
      </button>
      {onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            chipVariants({ selected, size }),
            "rounded-l-none border-l-0 px-2 hover:text-danger dark:hover:text-danger",
            size === "sm" ? "py-1" : "py-1.5",
          )}
          aria-label="Remover"
        >
          <AppIcon name="x" size={14} className="shrink-0" />
        </button>
      ) : null}
    </span>
  );
}

export { chipVariants };
