
-- ============ profiles ============
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can read profiles of own students"
ON public.profiles FOR SELECT
TO authenticated
USING (public.can_teacher_view_student(auth.uid(), user_id));

CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public-safe view for leaderboards (no sensitive flags or timing fields).
-- Views run as their owner and bypass RLS — only safe columns are exposed.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  user_id,
  display_name,
  nickname,
  avatar_url,
  xp,
  streak,
  school_id,
  is_teacher
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- ============ teacher_classes ============
DROP POLICY IF EXISTS "Anyone can read classes by join_code" ON public.teacher_classes;

CREATE POLICY "Students can read own classes"
ON public.teacher_classes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_members cm
    WHERE cm.class_id = teacher_classes.id AND cm.student_id = auth.uid()
  )
);

-- Secure RPC: returns minimal class info for a specific join code only.
CREATE OR REPLACE FUNCTION public.find_class_by_join_code(p_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tc.id, tc.name
  FROM public.teacher_classes tc
  WHERE tc.join_code = upper(trim(p_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_class_by_join_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_class_by_join_code(text) TO authenticated;

-- ============ teacher-documents storage: owner DELETE/UPDATE ============
DROP POLICY IF EXISTS "Owners can delete own teacher documents" ON storage.objects;
CREATE POLICY "Owners can delete own teacher documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'teacher-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can update own teacher documents" ON storage.objects;
CREATE POLICY "Owners can update own teacher documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'teacher-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
