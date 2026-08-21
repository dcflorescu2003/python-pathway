-- 1) Restrict direct exercise reads for students: only the owning teacher keeps access
CREATE OR REPLACE FUNCTION public.source_in_accessible_test(_source_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.test_items ti
    JOIN public.tests t ON t.id = ti.test_id
    WHERE ti.source_id = _source_id
      AND t.teacher_id = auth.uid()
  );
$$;

-- 2) Batch RPC for students taking a test: strips all answer fields
CREATE OR REPLACE FUNCTION public.get_exercises_for_student(p_ids text[])
RETURNS TABLE(
  id text,
  lesson_id text,
  type text,
  question text,
  options jsonb,
  blanks jsonb,
  lines jsonb,
  pairs jsonb,
  statement text,
  code_template text,
  sort_order integer,
  xp integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_ids IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.lesson_id,
    e.type,
    e.question,
    e.options,
    CASE WHEN jsonb_typeof(e.blanks) = 'array' THEN (
      SELECT jsonb_agg(b - 'answer') FROM jsonb_array_elements(e.blanks) AS b
    ) ELSE NULL END,
    CASE WHEN jsonb_typeof(e.lines) = 'array' THEN (
      SELECT jsonb_agg(l - 'order') FROM jsonb_array_elements(e.lines) AS l
    ) ELSE NULL END,
    e.pairs,
    e.statement,
    e.code_template,
    e.sort_order,
    e.xp
  FROM public.exercises e
  WHERE e.id = ANY(p_ids)
    AND EXISTS (
      SELECT 1
      FROM public.test_items ti
      JOIN public.test_assignments ta ON ta.test_id = ti.test_id
      JOIN public.class_members cm ON cm.class_id = ta.class_id
      WHERE ti.source_id = e.id
        AND cm.student_id = auth.uid()
        AND (
          ta.window_minutes IS NULL
          OR ta.assigned_at + (ta.window_minutes || ' minutes')::interval >= now()
          OR EXISTS (
            SELECT 1 FROM public.test_submissions ts
            WHERE ts.assignment_id = ta.id
              AND ts.student_id = auth.uid()
              AND ts.submitted_at IS NULL
          )
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exercises_for_student(text[]) TO authenticated;

-- 3) Strip answers from the eval-bank student RPC as well
CREATE OR REPLACE FUNCTION public.get_eval_exercise_for_student(p_id text)
RETURNS TABLE(id text, lesson_id text, type text, question text, options jsonb, correct_option_id text, blanks jsonb, lines jsonb, statement text, is_true boolean, explanation text, hint text, test_cases jsonb, code_template text, sort_order integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

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
        OR EXISTS (
          SELECT 1 FROM public.test_submissions ts
          WHERE ts.assignment_id = ta.id
            AND ts.student_id = auth.uid()
            AND ts.submitted_at IS NULL
        )
      )
  ) THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    ee.id, ee.lesson_id, ee.type, ee.question, ee.options,
    NULL::text AS correct_option_id,
    CASE WHEN jsonb_typeof(ee.blanks) = 'array' THEN (
      SELECT jsonb_agg(b - 'answer') FROM jsonb_array_elements(ee.blanks) AS b
    ) ELSE NULL END AS blanks,
    CASE WHEN jsonb_typeof(ee.lines) = 'array' THEN (
      SELECT jsonb_agg(l - 'order') FROM jsonb_array_elements(ee.lines) AS l
    ) ELSE NULL END AS lines,
    ee.statement,
    NULL::boolean AS is_true,
    NULL::text AS explanation,
    NULL::text AS hint,
    ee.test_cases, ee.code_template, ee.sort_order
  FROM public.eval_exercises ee
  WHERE ee.id = p_id;
END;
$$;

NOTIFY pgrst, 'reload schema';