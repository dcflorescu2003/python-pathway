
-- 1) Restrict eval_exercises SELECT to verified teachers + admins (was: any is_teacher=true)
DROP POLICY IF EXISTS "Teachers and admins can read eval_exercises" ON public.eval_exercises;
CREATE POLICY "Verified teachers and admins can read eval_exercises"
ON public.eval_exercises
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.is_teacher = true
      AND p.teacher_status = 'verified'
  )
);

-- 2) Hide join_code from students: drop broad student SELECT policy, replace with RPC for class basics
DROP POLICY IF EXISTS "Students can read own classes" ON public.teacher_classes;

CREATE OR REPLACE FUNCTION public.get_class_basic_info(p_class_id uuid)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tc.id, tc.name
  FROM public.teacher_classes tc
  WHERE tc.id = p_class_id
    AND (
      tc.teacher_id = auth.uid()
      OR public.is_class_member(tc.id, auth.uid())
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_class_basic_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_basic_info(uuid) TO authenticated;
