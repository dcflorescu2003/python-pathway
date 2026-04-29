ALTER TABLE public.play_billing_subscriptions
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'android';

CREATE INDEX IF NOT EXISTS idx_play_billing_subscriptions_user_platform
  ON public.play_billing_subscriptions (user_id, platform);