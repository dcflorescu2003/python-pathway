ALTER TABLE public.device_tokens
ADD COLUMN IF NOT EXISTS apns_environment text;

ALTER TABLE public.device_tokens
DROP CONSTRAINT IF EXISTS device_tokens_apns_environment_check;

ALTER TABLE public.device_tokens
ADD CONSTRAINT device_tokens_apns_environment_check
CHECK (apns_environment IS NULL OR apns_environment IN ('sandbox', 'production'));

CREATE INDEX IF NOT EXISTS idx_device_tokens_platform_env
ON public.device_tokens(platform, apns_environment);