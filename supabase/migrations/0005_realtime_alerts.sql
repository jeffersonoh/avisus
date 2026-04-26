-- Publica a tabela public.alerts no canal supabase_realtime para que o cliente
-- web receba eventos INSERT em tempo real (filtrados por user_id via RLS).
-- Sem isso, postgres_changes não emite nada.
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
