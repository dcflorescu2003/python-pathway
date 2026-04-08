
-- 1. Restrict coupons SELECT to admins only (redemption uses service_role in edge function)
DROP POLICY IF EXISTS "Anyone can read active coupons by code" ON public.coupons;

CREATE POLICY "Admins can read coupons"
  ON public.coupons
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Create a function to fetch problem solution on-demand (no bulk exposure)
CREATE OR REPLACE FUNCTION public.get_problem_solution(p_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT solution FROM public.problems WHERE id = p_id LIMIT 1;
$$;
