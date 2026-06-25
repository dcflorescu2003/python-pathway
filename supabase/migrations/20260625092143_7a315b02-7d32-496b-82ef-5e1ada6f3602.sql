
-- 1) Restrict direct SELECT on eval_exercises to admins only
DROP POLICY IF EXISTS "Verified teachers and admins can read eval_exercises" ON public.eval_exercises;

CREATE POLICY "Admins can read eval_exercises directly"
  ON public.eval_exercises FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) SECURITY DEFINER RPC for verified teachers (and admins) to read eval_exercises
CREATE OR REPLACE FUNCTION public.get_eval_exercises_for_teacher(
  p_lesson_id text DEFAULT NULL,
  p_ids text[] DEFAULT NULL
)
RETURNS SETOF public.eval_exercises
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role)
    OR public.is_verified_teacher(auth.uid())
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.eval_exercises ee
  WHERE (p_lesson_id IS NULL OR ee.lesson_id = p_lesson_id)
    AND (p_ids IS NULL OR ee.id = ANY(p_ids))
  ORDER BY ee.sort_order, ee.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_eval_exercises_for_teacher(text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_eval_exercises_for_teacher(text, text[]) TO authenticated;

-- 3) Strip answer-bearing fields from custom test items returned to students
CREATE OR REPLACE FUNCTION public.get_test_items_for_student(p_assignment_id uuid, p_variant text)
 RETURNS TABLE(id uuid, test_id uuid, sort_order integer, source_type text, source_id text, points integer, question text, item_type text, options jsonb, blanks jsonb, lines jsonb, pairs jsonb, statement text, code_template text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_test_id uuid;
  v_assignment record;
BEGIN
  SELECT ta.test_id, ta.assigned_at, ta.window_minutes
  INTO v_assignment
  FROM public.test_assignments ta
  JOIN public.class_members cm ON cm.class_id = ta.class_id
  WHERE ta.id = p_assignment_id AND cm.student_id = auth.uid();

  IF v_assignment IS NULL THEN
    RETURN;
  END IF;

  IF v_assignment.window_minutes IS NOT NULL
     AND v_assignment.assigned_at + (v_assignment.window_minutes || ' minutes')::interval < now()
  THEN
    RETURN;
  END IF;

  v_test_id := v_assignment.test_id;

  RETURN QUERY
  SELECT
    ti.id,
    ti.test_id,
    ti.sort_order,
    ti.source_type,
    ti.source_id,
    ti.points,
    CASE WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'question')::text ELSE NULL END,
    CASE WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'type')::text ELSE NULL END,
    CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->'options' ELSE NULL END,
    -- Strip "answer" from each blank so students don't see fill-in solutions
    CASE WHEN ti.source_type = 'custom' AND jsonb_typeof(ti.custom_data->'blanks') = 'array' THEN (
      SELECT jsonb_agg(b - 'answer') FROM jsonb_array_elements(ti.custom_data->'blanks') AS b
    ) ELSE NULL END,
    -- Strip "order" from each line so students don't see the correct order
    CASE WHEN ti.source_type = 'custom' AND jsonb_typeof(ti.custom_data->'lines') = 'array' THEN (
      SELECT jsonb_agg(l - 'order') FROM jsonb_array_elements(ti.custom_data->'lines') AS l
    ) ELSE NULL END,
    CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->'pairs' ELSE NULL END,
    CASE WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'statement')::text ELSE NULL END,
    CASE WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'code_template')::text ELSE NULL END
  FROM public.test_items ti
  WHERE ti.test_id = v_test_id
    AND (ti.variant = p_variant OR ti.variant = 'both')
  ORDER BY ti.sort_order;
END;
$function$;
