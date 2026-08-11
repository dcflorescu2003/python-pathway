-- Helper: premium-equivalent access (premium user, verified teacher, or admin)
CREATE OR REPLACE FUNCTION public.has_premium_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = _user_id AND (p.is_premium OR p.teacher_status = 'verified'))
    OR public.has_role(_user_id, 'admin'::app_role)
  );
$$;

-- Helper: item (exercise/problem) is part of a test assigned to the current student,
-- or part of a test owned by the requesting teacher
CREATE OR REPLACE FUNCTION public.source_in_accessible_test(_source_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM public.test_items ti
      JOIN public.tests t ON t.id = ti.test_id
      WHERE ti.source_id = _source_id
        AND (
          t.teacher_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.test_assignments ta
            JOIN public.class_members cm ON cm.class_id = ta.class_id
            WHERE ta.test_id = t.id AND cm.student_id = auth.uid()
          )
        )
    )
  );
$$;

-- ============ exercises ============
DROP POLICY IF EXISTS "Authenticated users can read exercises" ON public.exercises;
CREATE POLICY "Read non-premium or entitled exercises"
ON public.exercises FOR SELECT TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = exercises.lesson_id AND l.is_premium
  )
  OR public.has_premium_access(auth.uid())
  OR public.source_in_accessible_test(exercises.id)
);

-- ============ problems ============
DROP POLICY IF EXISTS "Authenticated users can read problems" ON public.problems;
CREATE POLICY "Read non-premium or entitled problems"
ON public.problems FOR SELECT TO authenticated
USING (
  is_premium = false
  OR public.has_premium_access(auth.uid())
  OR public.source_in_accessible_test(problems.id)
);

-- Catalog listing for all authenticated users: premium rows are returned as
-- locked metadata only (no test cases, no hint, never the solution).
CREATE OR REPLACE FUNCTION public.get_problems_catalog()
RETURNS TABLE(
  id text, title text, description text, difficulty text,
  xp_reward integer, test_cases jsonb, hint text,
  chapter_id text, sort_order integer, is_premium boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.title, p.description, p.difficulty, p.xp_reward,
         CASE WHEN p.is_premium AND NOT public.has_premium_access(auth.uid())
              THEN NULL ELSE p.test_cases END,
         CASE WHEN p.is_premium AND NOT public.has_premium_access(auth.uid())
              THEN NULL ELSE p.hint END,
         p.chapter_id, p.sort_order, p.is_premium
  FROM public.problems p
  WHERE auth.uid() IS NOT NULL
  ORDER BY p.sort_order, p.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_problems_catalog() TO authenticated;

-- ============ predefined_test_items (answer keys) ============
DROP POLICY IF EXISTS "Authenticated can read predefined_test_items" ON public.predefined_test_items;
CREATE POLICY "Teachers and admins can read predefined_test_items"
ON public.predefined_test_items FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_verified_teacher(auth.uid())
);

-- ============ manual content: hide solutions from anonymous visitors ============
REVOKE SELECT ON public.manual_exercises FROM anon;
GRANT SELECT (
  id, lesson_id, type, question, options, correct_option_id, code_template,
  blanks, lines, statement, is_true, explanation, pairs, xp, sort_order,
  test_cases, hint
) ON public.manual_exercises TO anon;