export type MarketplaceName = "Mercado Livre" | "Shopee" | "Magazine Luiza";

export type OpportunityQuality = "exceptional" | "great" | "good";

export type ChannelMargin = {
  channel: MarketplaceName | string;
  marketPrice: number;
  fee: number;
  netMargin: number;
};

export type Opportunity = {
  id: string;
  name: string;
  marketplace: MarketplaceName;
  imageUrl: string;
  price: number;
  originalPrice: number;
  freight: number;
  freightFree: boolean;
  margin: number;
  quality: OpportunityQuality;
  category: string;
  region: string;
  city: string;
  expiresLabel: string;
  hot: boolean;
  buyUrl: string;
  channelMargins: ChannelMargin[];
  /** ISO 8601 — usado na ordenação por data */
  updatedAt: string;
};
