-- Add columns needed for iOS / RevenueCat flow
ALTER TABLE public.play_billing_subscriptions
  ADD COLUMN IF NOT EXISTS original_transaction_id text,
  ADD COLUMN IF NOT EXISTS revenuecat_user_id text;

-- Constrain platform values
ALTER TABLE public.play_billing_subscriptions
  DROP CONSTRAINT IF EXISTS play_billing_subscriptions_platform_check;
ALTER TABLE public.play_billing_subscriptions
  ADD CONSTRAINT play_billing_subscriptions_platform_check
  CHECK (platform IN ('android', 'ios'));

-- Index for fast lookup by original transaction (used in restore flow)
CREATE INDEX IF NOT EXISTS idx_play_billing_original_tx
  ON public.play_billing_subscriptions(original_transaction_id)
  WHERE original_transaction_id IS NOT NULL;

-- Allow purchase_token to be the RevenueCat transaction id (still unique)
-- The existing UNIQUE constraint on purchase_token stays — for iOS we use the
-- App Store transaction id as the purchase_token value.