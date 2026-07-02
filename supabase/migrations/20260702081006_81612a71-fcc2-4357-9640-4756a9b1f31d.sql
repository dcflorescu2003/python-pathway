
-- 1. Safe RPC that returns only non-sensitive student profile fields for the calling teacher
CREATE OR REPLACE FUNCTION public.get_students_for_teacher(p_student_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, first_name text, last_name text, xp integer, streak integer, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.first_name, p.last_name, p.xp, p.streak, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(p_student_ids)
    AND public.can_teacher_view_student(auth.uid(), p.user_id);
$$;

REVOKE ALL ON FUNCTION public.get_students_for_teacher(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_students_for_teacher(uuid[]) TO authenticated;

-- 2. Remove the broad SELECT policy that exposed the entire profile row to teachers
DROP POLICY IF EXISTS "Teachers can read profiles of own students" ON public.profiles;

-- 3. Harden test_items: explicitly revoke SELECT from authenticated so future ALL/SELECT
--    grants don't accidentally expose answer-bearing custom_data. Teachers still access
--    their own items through the existing FOR ALL policy (which requires the write path
--    via service_role for RPCs). Grant only INSERT/UPDATE/DELETE for teacher-owned rows.
REVOKE SELECT ON public.test_items FROM authenticated;
