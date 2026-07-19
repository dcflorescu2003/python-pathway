
CREATE OR REPLACE FUNCTION public.get_test_items_for_student(p_assignment_id uuid, p_variant text)
 RETURNS TABLE(id uuid, test_id uuid, sort_order integer, source_type text, source_id text, points integer, question text, item_type text, options jsonb, blanks jsonb, lines jsonb, pairs jsonb, statement text, code_template text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_test_id uuid;
  v_assignment record;
  v_has_open_submission boolean;
BEGIN
  SELECT ta.test_id, ta.assigned_at, ta.window_minutes
  INTO v_assignment
  FROM public.test_assignments ta
  JOIN public.class_members cm ON cm.class_id = ta.class_id
  WHERE ta.id = p_assignment_id AND cm.student_id = auth.uid();

  IF v_assignment IS NULL THEN
    RETURN;
  END IF;

  -- If the student already has an unsubmitted attempt, allow reading items
  -- even after the start window expired. Their own test timer still limits them.
  SELECT EXISTS (
    SELECT 1 FROM public.test_submissions ts
    WHERE ts.assignment_id = p_assignment_id
      AND ts.student_id = auth.uid()
      AND ts.submitted_at IS NULL
  ) INTO v_has_open_submission;

  IF NOT v_has_open_submission
     AND v_assignment.window_minutes IS NOT NULL
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
    CASE WHEN ti.source_type = 'custom' AND jsonb_typeof(ti.custom_data->'blanks') = 'array' THEN (
      SELECT jsonb_agg(b - 'answer') FROM jsonb_array_elements(ti.custom_data->'blanks') AS b
    ) ELSE NULL END,
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

CREATE OR REPLACE FUNCTION public.get_eval_exercise_for_student(p_id text)
 RETURNS TABLE(id text, lesson_id text, type text, question text, options jsonb, correct_option_id text, blanks jsonb, lines jsonb, statement text, is_true boolean, explanation text, hint text, test_cases jsonb, code_template text, sort_order integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

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
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ee.id, ee.lesson_id, ee.type, ee.question, ee.options, ee.correct_option_id,
    ee.blanks, ee.lines, ee.statement, ee.is_true, ee.explanation, ee.hint,
    ee.test_cases, ee.code_template, ee.sort_order
  FROM public.eval_exercises ee
  WHERE ee.id = p_id;
END;
$function$;
