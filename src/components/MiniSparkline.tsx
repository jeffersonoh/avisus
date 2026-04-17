"use client";

import { useId, useMemo } from "react";

import { cn } from "@/lib/cn";

export interface MiniSparklineProps {
  values: number[];
  /** Largura do SVG em px. Default: `80`. */
  width?: number;
  /** Altura do SVG em px. Default: `32`. */
  height?: number;
  /** Classes Tailwind no SVG (ex.: `text-accent-light` para cor da linha via `currentColor`). */
  className?: string;
  /** Espessura visual da linha em px. Default: `2`. */
  strokeWidth?: number;
}

/**
 * `width` default `80`; `height` default `32`; `strokeWidth` default `2`.
 * Requer pelo menos dois valores em `values`; caso contrário retorna `null`.
 */
export function MiniSparkline({
  values,
  width = 80,
  height = 32,
  className,
  strokeWidth = 2,
}: MiniSparklineProps) {
  const rawId = useId().replace(/:/g, "");
  const gradId = `spark-fill-${rawId}`;

  const { lineD, areaD, last } = useMemo(() => {
    if (!values || values.length < 2) {
      return { lineD: "", areaD: "", last: { x: 0, y: 0 } };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const pad = range * 0.15;
    const pts = values.map((v, i) => ({
      x: (i / (values.length - 1)) * width,
      y: height - ((v - min + pad) / (range + pad * 2)) * height,
    }));
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const area = `${line} L${width},${height} L0,${height} Z`;
    return { lineD: line, areaD: area, last: pts[pts.length - 1] ?? { x: 0, y: 0 } };
  }, [values, width, height]);

  if (!values || values.length < 2) {
    return null;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block text-accent-light", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.03} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={lineD}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={3} className="fill-card" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
