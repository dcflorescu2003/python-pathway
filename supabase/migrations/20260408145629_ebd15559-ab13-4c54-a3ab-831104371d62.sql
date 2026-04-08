
-- Fix: Drop the SECURITY DEFINER view and recreate with INVOKER
DROP VIEW IF EXISTS public.problems_public;

CREATE VIEW public.problems_public
WITH (security_invoker = true)
AS SELECT id, title, description, difficulty, xp_reward, test_cases, hint, chapter_id, sort_order, is_premium
FROM public.problems;

GRANT SELECT ON public.problems_public TO authenticated;
GRANT SELECT ON public.problems_public TO anon;

-- Fix: Allow regular users to read problems too (the app already doesn't fetch solution)
DROP POLICY IF EXISTS "Regular users can read problems" ON public.problems;

CREATE POLICY "Authenticated users can read problems"
  ON public.problems
  FOR SELECT
  TO authenticated
  USING (true);
