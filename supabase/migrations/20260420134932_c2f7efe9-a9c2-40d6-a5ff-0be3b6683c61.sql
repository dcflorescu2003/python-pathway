
CREATE TABLE public.play_billing_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  plan_id text,
  purchase_token text NOT NULL UNIQUE,
  order_id text,
  expiry_time timestamp with time zone NOT NULL,
  auto_renewing boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_play_billing_user ON public.play_billing_subscriptions(user_id);
CREATE INDEX idx_play_billing_active ON public.play_billing_subscriptions(user_id, is_active, expiry_time);

ALTER TABLE public.play_billing_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own play billing subscriptions"
  ON public.play_billing_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all play billing subscriptions"
  ON public.play_billing_subscriptions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_play_billing_subscriptions_updated_at
  BEFORE UPDATE ON public.play_billing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
