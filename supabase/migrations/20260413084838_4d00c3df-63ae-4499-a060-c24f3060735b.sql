
CREATE OR REPLACE FUNCTION public.deactivate_teacher_mode()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow if user actually is a teacher
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_teacher = true
  ) THEN
    RAISE EXCEPTION 'Not a teacher';
  END IF;

  UPDATE public.profiles
  SET teacher_status = NULL, is_teacher = false, verification_method = NULL
  WHERE user_id = auth.uid();
END;
$$;
