import { type VariantProps, cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-semibold tracking-wide backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-border bg-text-3/10 text-text-2 dark:bg-text-3/15 dark:text-text-2",
        accent:
          "border-accent/25 bg-accent/12 text-accent dark:border-accent/30 dark:bg-accent/15 dark:text-accent-light",
        success:
          "border-success/30 bg-success/15 text-success dark:border-success/35 dark:bg-success/20",
        danger:
          "border-danger/35 bg-danger/10 text-danger dark:border-danger/40 dark:bg-danger/15",
        pro: "border-accent/25 bg-accent/12 text-accent-dark dark:border-accent/30 dark:bg-accent/15 dark:text-text-1",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

/**
 * `variant` default `default`; `size` default `md`.
 */
export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
