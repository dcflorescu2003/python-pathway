CREATE OR REPLACE FUNCTION public.admin_set_premium(p_user_id uuid, p_premium boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  PERFORM set_config('app.bypass_profile_protection', 'true', true);

  UPDATE public.profiles
  SET is_premium = p_premium
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_premium(uuid, boolean) TO authenticated;