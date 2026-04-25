CREATE OR REPLACE FUNCTION public.backfill_competency_scores(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_items jsonb := '[]'::jsonb;
  v_count int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF auth.uid() <> p_user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to backfill another user';
  END IF;

  -- Wipe previous aggregated scores so we can recompute deterministically
  DELETE FROM public.student_competency_scores WHERE user_id = p_user_id;

  -- 1) Completed lessons → exercise items (one row per exercise that has competency mappings)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'item_type', 'exercise',
    'item_id', e.id,
    'score', LEAST(1.0, GREATEST(0.0, COALESCE(cl.score,0) / 100.0)),
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
    SELECT ta.test_item_id::text AS item_id,
           COALESCE(ta.max_points, ti.points, 0) AS max_pts,
           COALESCE(ta.score, 0) AS pts,
           CASE WHEN ti.source_type = 'predefined' THEN 'predefined_test_item' ELSE 'test_item' END AS item_type
    FROM public.test_answers ta
    JOIN public.test_items ti ON ti.id = ta.test_item_id
    JOIN public.test_submissions ts ON ts.id = ta.submission_id
    WHERE ts.student_id = p_user_id
      AND ts.submitted_at IS NOT NULL
  )
  SELECT v_items || COALESCE(jsonb_agg(jsonb_build_object(
    'item_type', a.item_type,
    'item_id',   a.item_id,
    'score',     a.pts,
    'max_score', a.max_pts
  )), '[]'::jsonb)
  INTO v_items
  FROM ans a
  WHERE a.max_pts > 0;

  IF jsonb_array_length(v_items) > 0 THEN
    PERFORM public.recalculate_competency_scores(p_user_id, v_items);
  END IF;

  v_count := jsonb_array_length(v_items);
  RETURN jsonb_build_object('items_processed', v_count);
END;
$function$;