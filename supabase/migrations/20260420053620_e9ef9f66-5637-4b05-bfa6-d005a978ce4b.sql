ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles (last_name);