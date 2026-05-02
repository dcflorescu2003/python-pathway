-- Step 1: Delete duplicate tokens (same token value), keep the most recent
DELETE FROM public.device_tokens a
USING public.device_tokens b
WHERE a.token = b.token
  AND a.created_at < b.created_at;

-- Step 2: Handle ties (same token, exact same created_at) — keep only one row
DELETE FROM public.device_tokens a
USING public.device_tokens b
WHERE a.token = b.token
  AND a.created_at = b.created_at
  AND a.id < b.id;

-- Step 3: Add UNIQUE constraint on token
ALTER TABLE public.device_tokens
  ADD CONSTRAINT device_tokens_token_unique UNIQUE (token);