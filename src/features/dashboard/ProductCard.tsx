"use client";

import Image from "next/image";

import { AppIcon } from "@/components/AppIcon";
import { Badge } from "@/components/Badge";
import { cn } from "@/lib/cn";

import { discountPercent, formatBrl } from "./format";
import type { Opportunity, OpportunityQuality } from "./types";

const MARKETPLACE_LOGO: Record<string, string> = {
  "Mercado Livre": "/assets/marketplaces/mercado-livre.svg",
  Shopee: "/assets/marketplaces/shopee.svg",
  "Magazine Luiza": "/assets/marketplaces/magalu.svg",
};

const QUALITY_BADGE: Record<
  OpportunityQuality,
  { label: string; variant: "success" | "accent" | "default"; icon: "sparkles" | "star" | "target" }
> = {
  exceptional: { label: "Excepcional", variant: "success", icon: "sparkles" },
  great: { label: "Ótima", variant: "accent", icon: "star" },
  good: { label: "Boa", variant: "default", icon: "target" },
};

function bestChannel(opp: Opportunity): { channel: string; netMargin: number } {
  let best: { channel: string; netMargin: number } = {
    channel: opp.marketplace,
    netMargin: opp.margin,
  };
  for (const row of opp.channelMargins) {
    if (row.netMargin > best.netMargin) {
      best = { channel: row.channel, netMargin: row.netMargin };
    }
  }
  return best;
}

export type ProductCardProps = {
  opportunity: Opportunity;
  index: number;
  onOpenDetail: () => void;
};

export function ProductCard({ opportunity: opp, index, onOpenDetail }: ProductCardProps) {
  const q = QUALITY_BADGE[opp.quality];
  const discount = discountPercent(opp.price, opp.originalPrice);
  const profit = opp.originalPrice - opp.price - (opp.freightFree ? 0 : opp.freight);
  const urgent = opp.expiresLabel.includes("min") && !opp.expiresLabel.includes("h");
  const best = bestChannel(opp);
  const logoSrc = MARKETPLACE_LOGO[opp.marketplace];

  return (
    <article
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-sm transition-all duration-300",
        "hover:-translate-y-1.5 hover:shadow-lg dark:shadow-none",
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 70}ms` }}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalhes de ${opp.name}`}
    >
      <div className="relative h-[170px] overflow-hidden bg-text-3/10">
        <Image
          src={opp.imageUrl}
          alt={opp.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          sizes="(max-width: 768px) 100vw, 360px"
          unoptimized
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-text-1/35 to-transparent" />

        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white backdrop-blur-md">
              <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded bg-white">
                {logoSrc ? (
                  <Image src={logoSrc} alt="" width={16} height={16} className="object-cover" />
                ) : null}
              </span>
              {opp.marketplace}
            </span>
            {opp.hot ? (
              <Badge variant="danger" size="sm" className="border-danger/30 bg-danger/20 text-danger">
                <AppIcon name="flame" size={12} className="shrink-0 text-danger" />
                HOT
              </Badge>
            ) : null}
          </div>
          <span className="rounded-[10px] bg-accent px-3 py-1.5 font-mono text-sm font-extrabold text-white shadow-md">
            -{discount}%
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
              urgent
                ? "border-danger/30 bg-danger/20 text-danger"
                : "border-white/10 bg-black/50 text-white/85",
            )}
          >
            <AppIcon name="clock" size={12} className={urgent ? "text-danger" : "text-white/85"} />
            {opp.expiresLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md">
            <AppIcon name="pin" size={12} className="text-white/75" />
            {opp.region}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 pb-[18px] pt-4">
        <div className="mb-3.5 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-[15px] font-bold leading-snug text-text-1">{opp.name}</h3>
          <Badge variant={q.variant} size="sm" className="shrink-0 gap-1">
            <AppIcon name={q.icon} size={12} className="shrink-0" />
            {q.label}
          </Badge>
        </div>

        <div className="mb-3.5 flex flex-wrap items-baseline gap-2.5">
          <span className="font-mono text-[26px] font-extrabold tracking-tight text-text-1">
            {formatBrl(opp.price)}
          </span>
          <span className="font-mono text-sm text-text-3 line-through">{formatBrl(opp.originalPrice)}</span>
        </div>

        <div className="mb-3.5 rounded-xl border border-border bg-text-3/5 p-3 dark:bg-text-3/10">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-text-3">
              <span className="font-medium">Melhor revenda via</span>
              <span className="truncate font-bold text-text-1">{best.channel}</span>
            </div>
            <span className="font-mono text-base font-extrabold text-success">{best.netMargin}%</span>
          </div>
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-border">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                best.netMargin >= 40 ? "bg-success" : best.netMargin >= 25 ? "bg-accent-light" : "bg-warning",
              )}
              style={{ width: `${Math.min(best.netMargin * 2, 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-3">
            <span>
              Lucro est.{" "}
              <strong className="text-success">{formatBrl(Math.max(0, profit))}</strong>
            </span>
            {opp.freightFree ? (
              <span className="inline-flex items-center gap-1 font-bold text-success">
                <AppIcon name="check" size={11} className="text-success" />
                Frete grátis
              </span>
            ) : (
              <span className="text-text-2">Frete {formatBrl(opp.freight)}</span>
            )}
          </div>
        </div>

        <a
          href={opp.buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={(e) => e.stopPropagation()}
        >
          Ver oferta
          <AppIcon name="arrowUpRight" size={16} className="text-white" />
        </a>
      </div>
    </article>
  );
}
