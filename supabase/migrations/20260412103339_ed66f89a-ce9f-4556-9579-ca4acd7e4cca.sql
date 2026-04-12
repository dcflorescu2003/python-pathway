CREATE OR REPLACE FUNCTION public.revoke_teacher_status(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE profiles
  SET teacher_status = NULL, is_teacher = false, verification_method = NULL
  WHERE user_id = p_user_id;
END;
$$;