
CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes
    WHERE id = _class_id AND teacher_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = _class_id AND student_id = _user_id
  )
$$;

DROP POLICY IF EXISTS "Teachers can remove class members" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can see class members" ON public.class_members;
DROP POLICY IF EXISTS "Students can read own classes" ON public.teacher_classes;

CREATE POLICY "Teachers can remove class members"
ON public.class_members FOR DELETE
USING (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Teachers can see class members"
ON public.class_members FOR SELECT
USING (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Students can read own classes"
ON public.teacher_classes FOR SELECT
USING (public.is_class_member(id, auth.uid()));
