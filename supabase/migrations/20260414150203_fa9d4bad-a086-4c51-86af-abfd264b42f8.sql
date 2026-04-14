
UPDATE public.profiles
SET is_teacher = true,
    teacher_status = 'verified',
    is_premium = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'dcflorescu2003@gmail.com'
);
