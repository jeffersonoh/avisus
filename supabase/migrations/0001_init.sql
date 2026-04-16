-- ========================================
-- Extensoes
-- ========================================
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- ========================================
-- PROFILES
-- ========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  uf VARCHAR(2),
  city TEXT,
  telegram_username TEXT,
  alert_channels TEXT[] NOT NULL DEFAULT ARRAY['web']::TEXT[],
  silence_start TIME,
  silence_end TIME,
  max_freight NUMERIC(10,2),
  resale_channels JSONB NOT NULL DEFAULT '{"Mercado Livre": true, "Magazine Luiza": true}',
  min_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  resale_margin_mode VARCHAR(10) NOT NULL DEFAULT 'average'
    CHECK (resale_margin_mode IN ('average', 'custom')),
  resale_fee_pct JSONB NOT NULL DEFAULT '{"Mercado Livre": 15, "Magazine Luiza": 16}',
  onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  plan VARCHAR(10) NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_plan ON public.profiles(plan);

-- ========================================
-- INTERESTS
-- ========================================
CREATE TABLE public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_interest_user_term ON public.interests(user_id, LOWER(term));
CREATE INDEX idx_interests_user_active ON public.interests(user_id, active)
  WHERE active = TRUE;
CREATE INDEX idx_interests_scan ON public.interests(last_scanned_at)
  WHERE active = TRUE;

-- ========================================
-- PRODUCTS
-- ========================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  marketplace VARCHAR(20) NOT NULL
    CHECK (marketplace IN ('Mercado Livre', 'Magazine Luiza')),
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  last_price NUMERIC(12,2),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_external UNIQUE (marketplace, external_id)
);

CREATE INDEX idx_products_name_trgm ON public.products
  USING GIN (name gin_trgm_ops);

-- ========================================
-- PRICE_HISTORY
-- ========================================
CREATE TABLE public.price_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL,
  original_price NUMERIC(12,2),
  discount_pct NUMERIC(5,2),
  units_sold INTEGER,
  marketplace VARCHAR(20) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ph_product_time ON public.price_history(product_id, recorded_at DESC);

-- ========================================
-- MARKETPLACE_FEES
-- ========================================
CREATE TABLE public.marketplace_fees (
  marketplace TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'default',
  fee_pct NUMERIC(5,2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (marketplace, category)
);

INSERT INTO public.marketplace_fees (marketplace, category, fee_pct) VALUES
  ('Mercado Livre', 'default', 15.00),
  ('Magazine Luiza', 'default', 16.00);

-- ========================================
-- OPPORTUNITIES
-- ========================================
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  external_id TEXT,
  name TEXT NOT NULL,
  marketplace VARCHAR(20) NOT NULL
    CHECK (marketplace IN ('Mercado Livre', 'Magazine Luiza')),
  price NUMERIC(12,2) NOT NULL,
  original_price NUMERIC(12,2) NOT NULL,
  discount_pct NUMERIC(5,2) NOT NULL,
  freight NUMERIC(10,2) NOT NULL DEFAULT 0,
  freight_free BOOLEAN NOT NULL DEFAULT FALSE,
  margin_best NUMERIC(5,2),
  margin_best_channel TEXT,
  quality VARCHAR(15)
    CHECK (quality IN ('exceptional', 'great', 'good')),
  category TEXT,
  region_uf VARCHAR(2),
  region_city TEXT,
  expires_at TIMESTAMPTZ,
  buy_url TEXT NOT NULL,
  image_url TEXT,
  hot BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(10) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_data JSONB,
  CONSTRAINT uq_opp_external UNIQUE (marketplace, external_id)
);

CREATE INDEX idx_opp_active ON public.opportunities(status)
  WHERE status = 'active';
CREATE INDEX idx_opp_margin ON public.opportunities(margin_best DESC)
  WHERE status = 'active';
CREATE INDEX idx_opp_detected ON public.opportunities(detected_at DESC);
CREATE INDEX idx_opp_name_trgm ON public.opportunities
  USING GIN (name gin_trgm_ops);

-- ========================================
-- CHANNEL_MARGINS
-- ========================================
CREATE TABLE public.channel_margins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,
  market_price NUMERIC(12,2) NOT NULL,
  fee_pct NUMERIC(5,2) NOT NULL,
  net_margin NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ch_margin UNIQUE (opportunity_id, channel)
);

-- ========================================
-- ALERTS
-- ========================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  channel VARCHAR(10) NOT NULL DEFAULT 'web'
    CHECK (channel IN ('telegram', 'web')),
  status VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'read', 'silenced', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  attempts SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_alert_user_opp ON public.alerts(user_id, opportunity_id);
CREATE INDEX idx_alerts_user ON public.alerts(user_id, created_at DESC);
CREATE INDEX idx_alerts_pending ON public.alerts(status)
  WHERE status IN ('pending', 'silenced');

-- ========================================
-- USER_OPPORTUNITY_STATUS
-- ========================================
CREATE TABLE public.user_opportunity_status (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  status VARCHAR(15) NOT NULL CHECK (status IN ('bought', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, opportunity_id)
);

-- ========================================
-- SUBSCRIPTIONS
-- ========================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  plan VARCHAR(10) NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro')),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subs_user ON public.subscriptions(user_id);

-- ========================================
-- FAVORITE_SELLERS
-- ========================================
CREATE TABLE public.favorite_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform VARCHAR(10) NOT NULL
    CHECK (platform IN ('shopee', 'tiktok')),
  seller_username TEXT NOT NULL,
  seller_name TEXT,
  seller_url TEXT NOT NULL,
  is_live BOOLEAN NOT NULL DEFAULT FALSE,
  last_live_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fav_seller UNIQUE (user_id, platform, seller_username)
);

CREATE INDEX idx_fav_sellers_user ON public.favorite_sellers(user_id);
CREATE INDEX idx_fav_sellers_live_check ON public.favorite_sellers(last_checked_at)
  WHERE is_live = FALSE;

-- ========================================
-- LIVE_ALERTS
-- ========================================
CREATE TABLE public.live_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.favorite_sellers(id) ON DELETE CASCADE,
  platform VARCHAR(10) NOT NULL
    CHECK (platform IN ('shopee', 'tiktok')),
  live_title TEXT,
  live_url TEXT NOT NULL,
  channel VARCHAR(10) NOT NULL DEFAULT 'telegram'
    CHECK (channel IN ('telegram', 'web')),
  status VARCHAR(10) NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'skipped_limit', 'skipped_silence', 'failed')),
  clicked_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_live_alerts_user ON public.live_alerts(user_id, created_at DESC);
CREATE INDEX idx_live_alerts_seller ON public.live_alerts(seller_id, created_at DESC);

-- ========================================
-- FUNCTIONS E TRIGGERS
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tr_subs_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tr_mf_updated BEFORE UPDATE ON public.marketplace_fees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tr_cm_updated BEFORE UPDATE ON public.channel_margins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sync_profile_plan()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET plan = NEW.plan
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_sync_plan
  AFTER INSERT OR UPDATE OF plan ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_plan();
