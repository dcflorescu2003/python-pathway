
CREATE OR REPLACE FUNCTION public.backfill_competency_scores(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items jsonb := '[]'::jsonb;
  v_lesson record;
  v_total int;
  v_score numeric;
  v_problem record;
  v_test_answer record;
  v_count int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF auth.uid() <> p_user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to backfill another user';
  END IF;

  -- Wipe previous aggregated scores so we can recompute deterministically
  DELETE FROM public.student_competency_scores WHERE user_id = p_user_id;

  -- 1) Completed lessons → exercise items
  --    For each completed lesson, for each exercise of that lesson that has
  --    competency mappings, count it as score = (lesson.score/100), max=1.
  --    Strip trailing 'f' from lesson_id (Fixare lessons map back to base).
  FOR v_lesson IN
    SELECT lesson_id, score
    FROM public.completed_lessons
    WHERE user_id = p_user_id
  LOOP
    v_score := LEAST(1.0, GREATEST(0.0, COALESCE(v_lesson.score, 0) / 100.0));

    FOR v_total IN
      SELECT 1 FROM public.exercises e
      WHERE e.lesson_id = regexp_replace(v_lesson.lesson_id, 'f$', '')
        AND EXISTS (
          SELECT 1 FROM public.item_competencies ic
          WHERE ic.item_type = 'exercise' AND ic.item_id = e.id
        )
    LOOP
      v_items := v_items || jsonb_build_array(jsonb_build_object(
        'item_type', 'exercise',
        'item_id', (
          SELECT e.id FROM public.exercises e
          WHERE e.lesson_id = regexp_replace(v_lesson.lesson_id, 'f$', '')
          LIMIT 1
        ),
        'score', v_score,
        'max_score', 1
      ));
    END LOOP;
  END LOOP;

  -- Better: build per-exercise items in one pass (rewrite cleanly)
  v_items := '[]'::jsonb;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'item_type', 'exercise',
    'item_id', e.id,
    'score', LEAST(1.0, GREATEST(0.0, cl.score / 100.0)),
    'max_score', 1
  )), '[]'::jsonb)
  INTO v_items
  FROM public.completed_lessons cl
  JOIN public.exercises e
    ON e.lesson_id = regexp_replace(cl.lesson_id, 'f$', '')
  WHERE cl.user_id = p_user_id
    AND EXISTS (
      SELECT 1 FROM public.item_competencies ic
      WHERE ic.item_type = 'exercise' AND ic.item_id = e.id
    );

  -- 2) Test submissions → test_item / predefined_test_item
  WITH ans AS (
    SELECT ta.test_item_id::text AS item_id, ti.points,
           COALESCE(ta.points_awarded, 0) AS pts,
           CASE WHEN ti.source_type = 'predefined' THEN 'predefined_test_item' ELSE 'test_item' END AS item_type
    FROM public.test_answers ta
    JOIN public.test_items ti ON ti.id = ta.test_item_id
    JOIN public.test_submissions ts ON ts.id = ta.submission_id
    WHERE ts.user_id = p_user_id
      AND ts.status IN ('submitted','graded')
  )
  SELECT v_items || COALESCE(jsonb_agg(jsonb_build_object(
    'item_type', a.item_type,
    'item_id',   a.item_id,
    'score',     a.pts,
    'max_score', a.points
  )), '[]'::jsonb)
  INTO v_items
  FROM ans a;

  IF jsonb_array_length(v_items) > 0 THEN
    PERFORM public.recalculate_competency_scores(p_user_id, v_items);
  END IF;

  v_count := jsonb_array_length(v_items);
  RETURN jsonb_build_object('items_processed', v_count);
END;
$$;
