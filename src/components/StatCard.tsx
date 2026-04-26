import type { ReactNode } from "react";

import { AppIcon, type AppIconName } from "@/components/AppIcon";
import { cn } from "@/lib/cn";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  iconName?: AppIconName;
  /** Classes para cor do traço do ícone (quando `iconName` é usado). Default: `text-accent`. */
  iconStrokeClassName?: string;
  trend?: ReactNode;
  /** Classes Tailwind extras para o selo de tendência. */
  trendClassName?: string;
  /** 0–100. Default: `60`. */
  progress?: number;
  /** Classes da barra de progresso preenchida. Default: `bg-accent`. */
  progressClassName?: string;
  className?: string;
}

/**
 * `progress` default `60`; `iconStrokeClassName` default `text-accent`;
 * `progressClassName` default `bg-accent`.
 */
export function StatCard({
  label,
  value,
  sub,
  icon,
  iconName,
  iconStrokeClassName = "text-accent",
  trend,
  trendClassName,
  progress = 60,
  progressClassName = "bg-accent",
  className,
}: StatCardProps) {
  const clamped = Math.min(100, Math.max(8, progress));
  const rightIcon = icon ?? (iconName ? <AppIcon name={iconName} size={18} stroke="currentColor" /> : null);

  return (
    <div
      className={cn(
        "relative min-w-[180px] overflow-hidden rounded-[18px] border border-border bg-card p-4 shadow-sm dark:shadow-none",
        className,
      )}
    >
      <div className="absolute left-0 right-0 top-0 h-px bg-accent-light/40" />

      <div className="mb-3.5 flex items-center justify-between gap-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-3">{label}</span>
        {trend ? (
          <span
            className={cn(
              "rounded-full border border-accent/30 bg-accent/15 px-2 py-1 text-[11px] font-bold text-accent dark:border-accent/35 dark:bg-accent/20 dark:text-accent-light",
              trendClassName,
            )}
          >
            {trend}
          </span>
        ) : null}
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[34px] font-extrabold leading-none tracking-tight text-text-1">{value}</div>
          {sub ? <div className="mt-1.5 text-xs text-text-2">{sub}</div> : null}
        </div>
        {rightIcon ? (
          <div
            className={cn(
              "flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/15 dark:border-accent/35 dark:bg-accent/20",
              iconName ? iconStrokeClassName : "text-accent",
            )}
          >
            {rightIcon}
          </div>
        ) : null}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-text-3/15 dark:bg-text-3/20">
        <div className={cn("h-full rounded-full transition-all", progressClassName)} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
