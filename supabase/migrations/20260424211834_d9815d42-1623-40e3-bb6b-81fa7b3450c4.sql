SELECT set_config('app.bypass_profile_protection', 'true', true);
UPDATE public.profiles 
SET lives = 0, lives_updated_at = now(), ads_watched_today = 0, is_premium = false, is_teacher = false, teacher_status = NULL
WHERE user_id = '0350f48f-d07b-40e0-9741-433c1d6edeb3';