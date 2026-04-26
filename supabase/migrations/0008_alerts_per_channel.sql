-- Permite entregar a mesma oportunidade em canais distintos sem colisao.
DROP INDEX IF EXISTS public.uq_alert_user_opp;

CREATE UNIQUE INDEX IF NOT EXISTS uq_alert_user_opp_channel
  ON public.alerts(user_id, opportunity_id, channel);
