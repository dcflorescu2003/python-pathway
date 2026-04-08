
-- 1. Remove direct INSERT on coupon_redemptions (edge function uses service_role)
DROP POLICY IF EXISTS "Users can insert their own redemptions" ON public.coupon_redemptions;

-- 2. Protect privileged columns on profiles from self-update
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent non-admin users from changing privileged columns
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_premium := OLD.is_premium;
    NEW.is_teacher := OLD.is_teacher;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 3. Restrict problems SELECT: create a view without solution for non-admins
-- Instead of a view, use a trigger to blank solution for non-admin reads
-- Actually, best approach: split into two policies
DROP POLICY IF EXISTS "Authenticated users can read problems" ON public.problems;

-- Admins can read everything
CREATE POLICY "Admins can read all problems"
  ON public.problems
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Non-admin users can read problems (solution stripped via view or function)
-- Since we can't strip columns in RLS, we keep access but rely on the app not fetching solution
-- Better: create a restricted view
CREATE OR REPLACE VIEW public.problems_public AS
  SELECT id, title, description, difficulty, xp_reward, test_cases, hint, chapter_id, sort_order, is_premium
  FROM public.problems;

-- Grant access to the view
GRANT SELECT ON public.problems_public TO authenticated;

-- Regular users read via the view, admins via the table directly
CREATE POLICY "Regular users can read problems"
  ON public.problems
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
