-- ========================================
-- PROFILES - admin + referral attribution
-- ========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ========================================
-- REFERRAL_COUPONS
-- ========================================
CREATE TABLE public.referral_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  partner_email TEXT,
  commission_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (commission_rate_pct >= 0 AND commission_rate_pct <= 100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_coupons_code_format CHECK (code ~ '^[A-Z0-9_]{5,30}$')
);

CREATE UNIQUE INDEX uq_referral_coupons_code ON public.referral_coupons (code);
CREATE INDEX idx_referral_coupons_active ON public.referral_coupons(is_active, expires_at);

CREATE TRIGGER tr_referral_coupons_updated BEFORE UPDATE ON public.referral_coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- PROFILES - FK depois de referral_coupons
-- ========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_coupon_id UUID,
  ADD COLUMN IF NOT EXISTS referral_source TEXT NOT NULL DEFAULT 'direct';

DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_referral_coupon_id_fkey
    FOREIGN KEY (referral_coupon_id) REFERENCES public.referral_coupons(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_referral_source_check
    CHECK (referral_source IN ('direct', 'coupon'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_coupon ON public.profiles(referral_coupon_id);

-- ========================================
-- REFERRAL_CONVERSIONS
-- ========================================
CREATE TABLE public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.referral_coupons(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_selected VARCHAR(10) NOT NULL DEFAULT 'free'
    CHECK (plan_selected IN ('free', 'starter', 'pro')),
  signup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_paid_date TIMESTAMPTZ,
  paid_amount NUMERIC(12,2),
  paid_currency CHAR(3) NOT NULL DEFAULT 'BRL',
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_conversions_one_per_user UNIQUE (user_id),
  CONSTRAINT referral_paid_fields_consistent CHECK (
    (first_paid_date IS NULL AND paid_amount IS NULL)
    OR (first_paid_date IS NOT NULL AND paid_amount IS NOT NULL AND paid_amount >= 0)
  )
);

CREATE INDEX idx_referral_conversions_coupon_signup
  ON public.referral_conversions(coupon_id, signup_date DESC);

CREATE INDEX idx_referral_conversions_coupon_paid
  ON public.referral_conversions(coupon_id, first_paid_date DESC)
  WHERE first_paid_date IS NOT NULL;

CREATE UNIQUE INDEX uq_referral_conversions_invoice
  ON public.referral_conversions(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

CREATE TRIGGER tr_referral_conversions_updated BEFORE UPDATE ON public.referral_conversions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================
-- RLS helpers
-- ========================================
CREATE OR REPLACE FUNCTION public.profile_is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = p_user_id), FALSE);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.profile_self_update_allowed(
  p_user_id UUID,
  p_is_admin BOOLEAN,
  p_referral_coupon_id UUID,
  p_referral_source TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles current_profile
    WHERE current_profile.id = p_user_id
      AND current_profile.is_admin IS NOT DISTINCT FROM p_is_admin
      AND current_profile.referral_coupon_id IS NOT DISTINCT FROM p_referral_coupon_id
      AND current_profile.referral_source IS NOT DISTINCT FROM p_referral_source
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Recria policy ampla atual para bloquear autoelevacao e alteracao manual de referral.
DROP POLICY IF EXISTS profiles_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND public.profile_self_update_allowed(
      (SELECT auth.uid()), is_admin, referral_coupon_id, referral_source
    )
  );

ALTER TABLE public.referral_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_coupons_admin_all ON public.referral_coupons
  FOR ALL TO authenticated
  USING (public.profile_is_admin((SELECT auth.uid())))
  WITH CHECK (public.profile_is_admin((SELECT auth.uid())));

CREATE POLICY referral_conversions_admin_all ON public.referral_conversions
  FOR ALL TO authenticated
  USING (public.profile_is_admin((SELECT auth.uid())))
  WITH CHECK (public.profile_is_admin((SELECT auth.uid())));
