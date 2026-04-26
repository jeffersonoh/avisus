-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_opportunity_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_margins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuario le/edita apenas o proprio
CREATE POLICY profiles_own ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Interests: CRUD restrito ao proprietario
CREATE POLICY interests_own ON public.interests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Opportunities + Channel Margins: leitura publica
CREATE POLICY opps_read ON public.opportunities FOR SELECT USING (TRUE);
CREATE POLICY cm_read ON public.channel_margins FOR SELECT USING (TRUE);

-- Products + Price History + Marketplace Fees: leitura publica
CREATE POLICY products_read ON public.products FOR SELECT USING (TRUE);
CREATE POLICY ph_read ON public.price_history FOR SELECT USING (TRUE);
CREATE POLICY mf_read ON public.marketplace_fees FOR SELECT USING (TRUE);

-- Alerts: leitura e atualizacao restritas ao proprietario
CREATE POLICY alerts_select ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY alerts_update ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Subscriptions: leitura restrita ao proprietario (least privilege)
CREATE POLICY subs_own ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- User opportunity status: proprio
CREATE POLICY uos_own ON public.user_opportunity_status
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Favorite sellers: CRUD restrito ao proprietario
CREATE POLICY fav_sellers_own ON public.favorite_sellers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Live alerts: leitura e atualizacao restritas ao proprietario
CREATE POLICY live_alerts_select ON public.live_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY live_alerts_update ON public.live_alerts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
