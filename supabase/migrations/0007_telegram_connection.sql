-- Conexão Telegram via deep link do bot.
-- Bot API não entrega mensagem privada apenas por @username; o usuário precisa iniciar o bot.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_link_code TEXT,
  ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_telegram_chat_id
  ON public.profiles(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_telegram_link_code
  ON public.profiles(telegram_link_code)
  WHERE telegram_link_code IS NOT NULL;
