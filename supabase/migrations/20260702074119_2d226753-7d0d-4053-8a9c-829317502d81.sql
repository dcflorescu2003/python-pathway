DROP FUNCTION IF EXISTS public.get_student_competency_profile(uuid, text);

CREATE OR REPLACE FUNCTION public.get_student_competency_profile(p_user_id uuid, p_mode text DEFAULT 'blended'::text)
 RETURNS TABLE(general_id uuid, general_code text, general_title text, specific_id uuid, specific_code text, specific_title text, attempts bigint, score_sum numeric, max_sum numeric, mastery numeric, has_micro boolean)
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
         ELSE NULL END,
    BOOL_OR(m.id IS NOT NULL) AS has_micro
  FROM public.competencies_general g
  JOIN public.competencies_specific s ON s.general_id = g.id
  LEFT JOIN public.microcompetencies m ON m.specific_id = s.id
  LEFT JOIN public.student_competency_scores sc
    ON sc.microcompetency_id = m.id AND sc.user_id = p_user_id
  GROUP BY g.id, g.code, g.title, g.sort_order, s.id, s.code, s.title, s.sort_order
  ORDER BY g.sort_order, s.sort_order;
END;
$function$;