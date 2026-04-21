-- Permite marcar live_alerts como 'read' quando o usuário visita a tela de alertas,
-- alinhando o comportamento ao já suportado por public.alerts. Também publica
-- live_alerts no canal supabase_realtime para que o badge de não-lidos reaja ao
-- insert/update em tempo real.
ALTER TABLE public.live_alerts DROP CONSTRAINT IF EXISTS live_alerts_status_check;
ALTER TABLE public.live_alerts ADD CONSTRAINT live_alerts_status_check
  CHECK (status::text = ANY (ARRAY[
    'sent'::character varying,
    'read'::character varying,
    'skipped_limit'::character varying,
    'skipped_silence'::character varying,
    'failed'::character varying
  ]::text[]));

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_alerts;
