UPDATE public.profiles
SET is_premium = false,
    is_teacher = false,
    teacher_status = NULL,
    verification_method = NULL
WHERE user_id = '0350f48f-d07b-40e0-9741-433c1d6edeb3';

DELETE FROM public.play_billing_subscriptions WHERE user_id = '0350f48f-d07b-40e0-9741-433c1d6edeb3';
DELETE FROM public.coupon_redemptions WHERE user_id = '0350f48f-d07b-40e0-9741-433c1d6edeb3';
DELETE FROM public.user_roles WHERE user_id = '0350f48f-d07b-40e0-9741-433c1d6edeb3' AND role <> 'admin';