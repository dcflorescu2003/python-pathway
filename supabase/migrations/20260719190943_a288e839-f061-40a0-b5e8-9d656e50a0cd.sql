
CREATE OR REPLACE FUNCTION public.get_eval_exercise_for_student(p_id text)
 RETURNS TABLE(id text, lesson_id text, type text, question text, options jsonb, correct_option_id text, blanks jsonb, lines jsonb, statement text, is_true boolean, explanation text, hint text, test_cases jsonb, code_template text, sort_order integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    ee.id, ee.lesson_id, ee.type, ee.question, ee.options, ee.correct_option_id,
    ee.blanks, ee.lines, ee.statement, ee.is_true, ee.explanation, NULL::text AS hint,
    ee.test_cases, ee.code_template, ee.sort_order
  FROM public.eval_exercises ee
  WHERE ee.id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_assigned_slot_for_student(p_assignment_id uuid)
 RETURNS TABLE(variant text, roster_number integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_class_id uuid;
  v_index int;
BEGIN
  IF v_uid IS NULL THEN
    variant := 'A'; roster_number := NULL; RETURN NEXT; RETURN;
  END IF;

  SELECT ta.class_id INTO v_class_id
  FROM public.test_assignments ta
  WHERE ta.id = p_assignment_id;

  IF v_class_id IS NULL THEN
    variant := 'A'; roster_number := NULL; RETURN NEXT; RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = v_class_id AND student_id = v_uid
  ) THEN
    variant := 'A'; roster_number := NULL; RETURN NEXT; RETURN;
  END IF;

  WITH roster AS (
    SELECT
      cm.student_id,
      row_number() OVER (
        ORDER BY
          lower(coalesce(nullif(btrim(p.last_name), ''), btrim(coalesce(p.display_name, 'Elev')))) ASC,
          cm.student_id ASC
      ) AS idx
    FROM public.class_members cm
    LEFT JOIN public.profiles p ON p.user_id = cm.student_id
    WHERE cm.class_id = v_class_id
  )
  SELECT idx INTO v_index FROM roster WHERE student_id = v_uid;

  IF v_index IS NULL THEN
    variant := 'A'; roster_number := NULL; RETURN NEXT; RETURN;
  END IF;

  variant := CASE WHEN ((v_index - 1) % 2) = 0 THEN 'A' ELSE 'B' END;
  roster_number := v_index;
  RETURN NEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_assigned_variant_for_student(p_assignment_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_class_id uuid;
  v_index int;
BEGIN
  IF v_uid IS NULL THEN RETURN 'A'; END IF;

  SELECT ta.class_id INTO v_class_id
  FROM public.test_assignments ta WHERE ta.id = p_assignment_id;
  IF v_class_id IS NULL THEN RETURN 'A'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = v_class_id AND student_id = v_uid
  ) THEN RETURN 'A'; END IF;

  WITH roster AS (
    SELECT cm.student_id,
      row_number() OVER (
        ORDER BY lower(coalesce(nullif(btrim(p.last_name), ''), btrim(coalesce(p.display_name, 'Elev')))) ASC,
          cm.student_id ASC
      ) - 1 AS idx
    FROM public.class_members cm
    LEFT JOIN public.profiles p ON p.user_id = cm.student_id
    WHERE cm.class_id = v_class_id
  )
  SELECT idx INTO v_index FROM roster WHERE student_id = v_uid;

  IF v_index IS NULL THEN RETURN 'A'; END IF;
  RETURN CASE WHEN (v_index % 2) = 0 THEN 'A' ELSE 'B' END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_test_roster_allocations(p_assignment_id uuid)
 RETURNS TABLE(student_id uuid, display_name text, first_name text, last_name text, roster_number integer, variant text, status text, submitted_at timestamp with time zone, submission_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_class_id uuid;
  v_teacher_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT ta.class_id, t.teacher_id
    INTO v_class_id, v_teacher_id
  FROM public.test_assignments ta
  JOIN public.tests t ON t.id = ta.test_id
  WHERE ta.id = p_assignment_id;

  IF v_class_id IS NULL THEN RAISE EXCEPTION 'Assignment not found'; END IF;

  IF v_teacher_id <> v_uid AND NOT has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH roster AS (
    SELECT
      cm.student_id,
      p.display_name,
      p.first_name,
      p.last_name,
      row_number() OVER (
        ORDER BY
          lower(coalesce(nullif(btrim(p.last_name), ''), btrim(coalesce(p.display_name, 'Elev')))) ASC,
          cm.student_id ASC
      )::integer AS idx
    FROM public.class_members cm
    LEFT JOIN public.profiles p ON p.user_id = cm.student_id
    WHERE cm.class_id = v_class_id
  )
  SELECT
    r.student_id, r.display_name, r.first_name, r.last_name,
    COALESCE(ts.roster_number, r.idx) AS roster_number,
    COALESCE(ts.variant, CASE WHEN ((r.idx - 1) % 2) = 0 THEN 'A' ELSE 'B' END) AS variant,
    COALESCE(
      CASE WHEN ts.submitted_at IS NOT NULL THEN 'submitted' ELSE ts.status END,
      'not_started'
    ) AS status,
    ts.submitted_at,
    ts.id AS submission_id
  FROM roster r
  LEFT JOIN public.test_submissions ts
    ON ts.assignment_id = p_assignment_id AND ts.student_id = r.student_id
  ORDER BY r.idx;
END;
$function$;

NOTIFY pgrst, 'reload schema';
