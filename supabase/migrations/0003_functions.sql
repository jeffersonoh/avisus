-- ========================================
-- FUNCTIONS
-- ========================================

-- Alertas enviados hoje (ofertas + lives)
-- Regra de negocio: limite FREE considera ambos no dia atual do fuso America/Sao_Paulo.
CREATE OR REPLACE FUNCTION public.alerts_sent_today(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT (
    (SELECT COUNT(*) FROM public.alerts
     WHERE user_id = p_user_id
       AND status IN ('sent', 'read')
       AND (created_at AT TIME ZONE 'America/Sao_Paulo')::DATE =
           (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE)
    +
    (SELECT COUNT(*) FROM public.live_alerts
     WHERE user_id = p_user_id
       AND status = 'sent'
       AND (created_at AT TIME ZONE 'America/Sao_Paulo')::DATE =
           (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE)
  )::INTEGER;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Refresh HOT flags (D1): HOT global (nao por filtro de dashboard)
-- Seleciona percentil 70 das margens ativas e marca como hot as >= threshold (top ~30%).
CREATE OR REPLACE FUNCTION public.refresh_hot_flags()
RETURNS VOID AS $$
DECLARE
  threshold NUMERIC;
BEGIN
  SELECT PERCENTILE_CONT(0.70) WITHIN GROUP (ORDER BY margin_best)
  INTO threshold
  FROM public.opportunities
  WHERE status = 'active' AND margin_best IS NOT NULL;

  UPDATE public.opportunities
  SET hot = (margin_best >= COALESCE(threshold, 999))
  WHERE status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
