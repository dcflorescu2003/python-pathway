-- 1. Drop the overly-broad SELECT policy that exposed `solution` to all authenticated users
DROP POLICY IF EXISTS "Authenticated can read eval_exercises" ON public.eval_exercises;

-- 2. Allow only verified teachers and admins to read full eval_exercises rows
CREATE POLICY "Teachers and admins can read eval_exercises"
  ON public.eval_exercises
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.is_teacher = true
    )
  );

-- 3. Secure helper for students taking a test: returns the eval exercise WITHOUT `solution`,
--    only if the caller has an active assignment whose test references this eval exercise.
CREATE OR REPLACE FUNCTION public.get_eval_exercise_for_student(p_id text)
RETURNS TABLE (
  id text,
  lesson_id text,
  type text,
  question text,
  options jsonb,
  correct_option_id text,
  blanks jsonb,
  lines jsonb,
  statement text,
  is_true boolean,
  explanation text,
  hint text,
  test_cases jsonb,
  code_template text,
  sort_order integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Caller must have an active (non-expired) assignment whose test_items reference this eval exercise
  IF NOT EXISTS (
    SELECT 1
    FROM public.test_items ti
    JOIN public.test_assignments ta ON ta.test_id = ti.test_id
    JOIN public.class_members cm   ON cm.class_id = ta.class_id
    WHERE ti.source_id = p_id
      AND cm.student_id = auth.uid()
      AND (
        ta.window_minutes IS NULL
        OR ta.assigned_at + (ta.window_minutes || ' minutes')::interval >= now()
      )
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ee.id,
    ee.lesson_id,
    ee.type,
    ee.question,
    ee.options,
    ee.correct_option_id,
    ee.blanks,
    ee.lines,
    ee.statement,
    ee.is_true,
    ee.explanation,
    ee.hint,
    ee.test_cases,
    ee.code_template,
    ee.sort_order
  FROM public.eval_exercises ee
  WHERE ee.id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_eval_exercise_for_student(text) TO authenticated;