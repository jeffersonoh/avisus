import { QUALITY_THRESHOLDS, type OpportunityQuality } from "@/lib/scanner/constants";

type CalculateNetMarginPercentInput = {
  cost: number;
  marketPrice: number;
  userFeePct: number;
};

export type CalculateMarginChannelInput = {
  channel: string;
  market_price: number;
  fee_pct: number;
};

export type CalculateMarginInput = {
  price: number;
  freight: number;
  freight_free?: boolean;
  channels: CalculateMarginChannelInput[];
};

export type CalculateMarginChannelOutput = CalculateMarginChannelInput & {
  net_margin: number;
};

export type CalculateMarginOutput = {
  margin_best: number | null;
  margin_best_channel: string | null;
  channels: CalculateMarginChannelOutput[];
  quality: OpportunityQuality | null;
};

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizePositive(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return roundToTwo(value);
}

function normalizeFeePct(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return roundToTwo(value);
}

export function calculateAcquisitionCost(input: {
  price: number;
  freight: number;
  freight_free?: boolean;
}): number {
  const price = normalizePositive(input.price);
  const freight = input.freight_free ? 0 : normalizePositive(input.freight);
  return roundToTwo(price + freight);
}

export function calculateNetMarginPercent(input: CalculateNetMarginPercentInput): number {
  const safeCost = normalizePositive(input.cost);
  if (safeCost <= 0) {
    return 0;
  }

  const marketPrice = normalizePositive(input.marketPrice);
  const userFeePct = normalizeFeePct(input.userFeePct);
  const netRevenue = marketPrice * (1 - userFeePct / 100);
  const margin = ((netRevenue - safeCost) / safeCost) * 100;

  if (!Number.isFinite(margin)) {
    return 0;
  }

  return roundToTwo(margin);
}

export function resolveOpportunityQuality(marginBest: number | null): OpportunityQuality | null {
  if (marginBest === null || !Number.isFinite(marginBest)) {
    return null;
  }

  if (marginBest >= QUALITY_THRESHOLDS.exceptional) {
    return "exceptional";
  }

  if (marginBest >= QUALITY_THRESHOLDS.great) {
    return "great";
  }

  if (marginBest >= QUALITY_THRESHOLDS.good) {
    return "good";
  }

  return null;
}

export function calculateMargin(input: CalculateMarginInput): CalculateMarginOutput {
  const acquisitionCost = calculateAcquisitionCost({
    price: input.price,
    freight: input.freight,
    freight_free: input.freight_free,
  });

  const channels = input.channels.map((channel) => {
    const marketPrice = normalizePositive(channel.market_price);
    const feePct = normalizeFeePct(channel.fee_pct);

    return {
      channel: channel.channel,
      market_price: marketPrice,
      fee_pct: feePct,
      net_margin: calculateNetMarginPercent({
        cost: acquisitionCost,
        marketPrice,
        userFeePct: feePct,
      }),
    };
  });

  if (channels.length === 0) {
    return {
      margin_best: null,
      margin_best_channel: null,
      channels,
      quality: null,
    };
  }

  const bestChannel = channels.reduce((currentBest, current) => {
    if (current.net_margin > currentBest.net_margin) {
      return current;
    }
    return currentBest;
  });

  return {
    margin_best: bestChannel.net_margin,
    margin_best_channel: bestChannel.channel,
    channels,
    quality: resolveOpportunityQuality(bestChannel.net_margin),
  };
}
