-- 1. Add separated columns
ALTER TABLE public.student_competency_scores
  ADD COLUMN IF NOT EXISTS test_score_sum NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS test_max_sum   NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS self_score_sum NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS self_max_sum   NUMERIC NOT NULL DEFAULT 0;

-- 2. Backfill: existing rows came from self-learning
UPDATE public.student_competency_scores
SET self_score_sum = score_sum,
    self_max_sum   = max_sum
WHERE self_max_sum = 0 AND max_sum > 0;

-- 3. Updated recalculation RPC
CREATE OR REPLACE FUNCTION public.recalculate_competency_scores(p_user_id uuid, p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item record;
  v_mapping record;
  v_total_weight numeric;
  v_is_test boolean;
  v_multiplier numeric;
  v_share numeric;
  v_score_share numeric;
  v_max_share numeric;
  v_self_score numeric;
  v_self_max numeric;
  v_test_score numeric;
  v_test_max numeric;
  v_blended_score numeric;
  v_blended_max numeric;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to update scores for another user';
  END IF;

  FOR v_item IN
    SELECT (elem->>'item_type')::text AS item_type,
           (elem->>'item_id')::text AS item_id,
           COALESCE((elem->>'score')::numeric, 0) AS score,
           COALESCE((elem->>'max_score')::numeric, 0) AS max_score
    FROM jsonb_array_elements(p_items) AS elem
  LOOP
    SELECT COALESCE(SUM(weight), 0) INTO v_total_weight
    FROM public.item_competencies
    WHERE item_type = v_item.item_type AND item_id = v_item.item_id;

    IF v_total_weight = 0 THEN CONTINUE; END IF;

    v_is_test := v_item.item_type IN ('test_item', 'predefined_test_item');
    v_multiplier := CASE WHEN v_is_test THEN 1.5 ELSE 1.0 END;

    FOR v_mapping IN
      SELECT microcompetency_id, weight FROM public.item_competencies
      WHERE item_type = v_item.item_type AND item_id = v_item.item_id
    LOOP
      v_share := v_mapping.weight / v_total_weight;
      v_score_share := v_item.score * v_share;
      v_max_share   := v_item.max_score * v_share;

      IF v_is_test THEN
        v_self_score := 0; v_self_max := 0;
        v_test_score := v_score_share; v_test_max := v_max_share;
      ELSE
        v_self_score := v_score_share; v_self_max := v_max_share;
        v_test_score := 0; v_test_max := 0;
      END IF;

      v_blended_score := v_score_share * v_multiplier;
      v_blended_max   := v_max_share   * v_multiplier;

      INSERT INTO public.student_competency_scores (
        user_id, microcompetency_id, attempts, correct,
        score_sum, max_sum,
        self_score_sum, self_max_sum,
        test_score_sum, test_max_sum,
        last_updated
      ) VALUES (
        p_user_id, v_mapping.microcompetency_id, 1,
        CASE WHEN v_item.max_score > 0 AND v_item.score >= v_item.max_score THEN 1 ELSE 0 END,
        v_blended_score, v_blended_max,
        v_self_score, v_self_max,
        v_test_score, v_test_max,
        now()
      )
      ON CONFLICT (user_id, microcompetency_id) DO UPDATE SET
        attempts = student_competency_scores.attempts + 1,
        correct = student_competency_scores.correct +
          CASE WHEN v_item.max_score > 0 AND v_item.score >= v_item.max_score THEN 1 ELSE 0 END,
        score_sum      = student_competency_scores.score_sum      + v_blended_score,
        max_sum        = student_competency_scores.max_sum        + v_blended_max,
        self_score_sum = student_competency_scores.self_score_sum + v_self_score,
        self_max_sum   = student_competency_scores.self_max_sum   + v_self_max,
        test_score_sum = student_competency_scores.test_score_sum + v_test_score,
        test_max_sum   = student_competency_scores.test_max_sum   + v_test_max,
        last_updated = now();
    END LOOP;
  END LOOP;
END;
$function$;

-- 4. Profile RPC with mode parameter
CREATE OR REPLACE FUNCTION public.get_student_competency_profile(p_user_id uuid, p_mode text DEFAULT 'blended')
RETURNS TABLE(
  general_id uuid, general_code text, general_title text,
  specific_id uuid, specific_code text, specific_title text,
  attempts bigint, score_sum numeric, max_sum numeric, mastery numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF auth.uid() <> p_user_id
     AND NOT can_teacher_view_student(auth.uid(), p_user_id)
     AND NOT has_role(auth.uid(), 'admin'::app_role)
  THEN RAISE EXCEPTION 'Not authorized to view this profile'; END IF;

  IF p_mode NOT IN ('blended', 'tests_only', 'self_only') THEN
    p_mode := 'blended';
  END IF;

  RETURN QUERY
  SELECT g.id, g.code, g.title, s.id, s.code, s.title,
    COALESCE(SUM(sc.attempts), 0)::bigint,
    COALESCE(SUM(
      CASE p_mode
        WHEN 'tests_only' THEN sc.test_score_sum
        WHEN 'self_only'  THEN sc.self_score_sum
        ELSE sc.score_sum
      END
    ), 0)::numeric,
    COALESCE(SUM(
      CASE p_mode
        WHEN 'tests_only' THEN sc.test_max_sum
        WHEN 'self_only'  THEN sc.self_max_sum
        ELSE sc.max_sum
      END
    ), 0)::numeric,
    CASE WHEN COALESCE(SUM(
            CASE p_mode
              WHEN 'tests_only' THEN sc.test_max_sum
              WHEN 'self_only'  THEN sc.self_max_sum
              ELSE sc.max_sum
            END), 0) > 0
         THEN (SUM(
            CASE p_mode
              WHEN 'tests_only' THEN sc.test_score_sum
              WHEN 'self_only'  THEN sc.self_score_sum
              ELSE sc.score_sum
            END) /
           SUM(
            CASE p_mode
              WHEN 'tests_only' THEN sc.test_max_sum
              WHEN 'self_only'  THEN sc.self_max_sum
              ELSE sc.max_sum
            END))::numeric
         ELSE NULL END
  FROM public.competencies_general g
  JOIN public.competencies_specific s ON s.general_id = g.id
  LEFT JOIN public.microcompetencies m ON m.specific_id = s.id
  LEFT JOIN public.student_competency_scores sc
    ON sc.microcompetency_id = m.id AND sc.user_id = p_user_id
  GROUP BY g.id, g.code, g.title, g.sort_order, s.id, s.code, s.title, s.sort_order
  ORDER BY g.sort_order, s.sort_order;
END;
$function$;