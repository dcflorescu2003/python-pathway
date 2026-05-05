SELECT set_config('app.bypass_profile_protection', 'true', true);
UPDATE public.profiles SET is_premium = false WHERE user_id = 'e66e2524-f661-44fa-9d73-fa22ea9d04a1';