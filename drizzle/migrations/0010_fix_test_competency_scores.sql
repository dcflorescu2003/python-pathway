CREATE OR REPLACE FUNCTION public.recalculate_competency_scores(p_user_id uuid, p_items jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_item record; v_mapping record; v_total_weight numeric; v_is_test boolean; v_multiplier numeric;
  v_share numeric; v_score_share numeric; v_max_share numeric;
  v_self_score numeric; v_self_max numeric; v_test_score numeric; v_test_max numeric;
  v_blended_score numeric; v_blended_max numeric;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id
     AND NOT has_role(auth.uid(), 'admin'::app_role)
     AND NOT public.can_teacher_view_student(auth.uid(), p_user_id) THEN
    RAISE EXCEPTION 'Not authorized to update scores for another user';
  END IF;

  FOR v_item IN
    SELECT (elem->>'item_type')::text AS item_type, (elem->>'item_id')::text AS item_id,
           COALESCE((elem->>'score')::numeric, 0) AS score,
           COALESCE((elem->>'max_score')::numeric, 0) AS max_score,
           COALESCE((elem->>'is_test')::boolean, false) AS is_test
    FROM jsonb_array_elements(p_items) AS elem
  LOOP
    SELECT COALESCE(SUM(weight), 0) INTO v_total_weight FROM public.item_competencies
    WHERE item_type = v_item.item_type AND item_id = v_item.item_id;
    IF v_total_weight = 0 THEN CONTINUE; END IF;

    v_is_test := v_item.is_test OR v_item.item_type IN ('test_item', 'predefined_test_item');
    v_multiplier := CASE WHEN v_is_test THEN 1.5 ELSE 1.0 END;

    FOR v_mapping IN SELECT microcompetency_id, weight FROM public.item_competencies
      WHERE item_type = v_item.item_type AND item_id = v_item.item_id
    LOOP
      v_share := v_mapping.weight / v_total_weight;
      v_score_share := v_item.score * v_share;
      v_max_share := v_item.max_score * v_share;
      IF v_is_test THEN
        v_self_score := 0; v_self_max := 0; v_test_score := v_score_share; v_test_max := v_max_share;
      ELSE
        v_self_score := v_score_share; v_self_max := v_max_share; v_test_score := 0; v_test_max := 0;
      END IF;
      v_blended_score := v_score_share * v_multiplier;
      v_blended_max := v_max_share * v_multiplier;

      INSERT INTO public.student_competency_scores (user_id, microcompetency_id, attempts, correct,
        score_sum, max_sum, self_score_sum, self_max_sum, test_score_sum, test_max_sum, last_updated)
      VALUES (p_user_id, v_mapping.microcompetency_id, 1,
        CASE WHEN v_item.max_score > 0 AND v_item.score >= v_item.max_score THEN 1 ELSE 0 END,
        v_blended_score, v_blended_max, v_self_score, v_self_max, v_test_score, v_test_max, now())
      ON CONFLICT (user_id, microcompetency_id) DO UPDATE SET
        attempts = student_competency_scores.attempts + 1,
        correct = student_competency_scores.correct + CASE WHEN v_item.max_score > 0 AND v_item.score >= v_item.max_score THEN 1 ELSE 0 END,
        score_sum = student_competency_scores.score_sum + v_blended_score,
        max_sum = student_competency_scores.max_sum + v_blended_max,
        self_score_sum = student_competency_scores.self_score_sum + v_self_score,
        self_max_sum = student_competency_scores.self_max_sum + v_self_max,
        test_score_sum = student_competency_scores.test_score_sum + v_test_score,
        test_max_sum = student_competency_scores.test_max_sum + v_test_max,
        last_updated = now();
    END LOOP;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.backfill_competency_scores(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_items jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id
     AND NOT has_role(auth.uid(), 'admin'::app_role)
     AND NOT public.can_teacher_view_student(auth.uid(), p_user_id) THEN
    RAISE EXCEPTION 'Not authorized to backfill another user';
  END IF;

  DELETE FROM public.student_competency_scores WHERE user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('item_type','exercise','item_id',e.id,
    'score', LEAST(1.0, GREATEST(0.0, COALESCE(cl.score,0)/100.0)),'max_score',1)), '[]'::jsonb)
  INTO v_items
  FROM public.completed_lessons cl
  JOIN public.exercises e ON e.lesson_id = regexp_replace(cl.lesson_id, 'f$', '')
  WHERE cl.user_id = p_user_id
    AND EXISTS (SELECT 1 FROM public.item_competencies ic WHERE ic.item_type='exercise' AND ic.item_id=e.id);

  WITH ans AS (
    SELECT CASE WHEN ti.source_type='custom' THEN 'test_item'
                WHEN ti.source_type='predefined' THEN 'predefined_test_item'
                ELSE ti.source_type END AS item_type,
           CASE WHEN ti.source_type='custom' THEN ti.id::text ELSE ti.source_id END AS item_id,
           COALESCE(ta.max_points, ti.points, 0) AS max_pts,
           COALESCE(ta.score, 0) AS pts
    FROM public.test_answers ta
    JOIN public.test_items ti ON ti.id = ta.test_item_id
    JOIN public.test_submissions ts ON ts.id = ta.submission_id
    WHERE ts.student_id = p_user_id AND ts.submitted_at IS NOT NULL
  )
  SELECT v_items || COALESCE(jsonb_agg(jsonb_build_object('item_type',a.item_type,'item_id',a.item_id,
    'score',a.pts,'max_score',a.max_pts,'is_test',true)), '[]'::jsonb)
  INTO v_items FROM ans a WHERE a.max_pts > 0 AND a.item_id IS NOT NULL;

  IF jsonb_array_length(v_items) > 0 THEN
    PERFORM public.recalculate_competency_scores(p_user_id, v_items);
  END IF;
  RETURN jsonb_build_object('items_processed', jsonb_array_length(v_items));
END;
$function$;