CREATE OR REPLACE FUNCTION public.admin_get_anomalies(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_days integer := greatest(1, least(coalesce(p_days, 30), 365));
  v_from timestamptz := (current_date - (v_days - 1))::timestamptz;
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  WITH ev AS (
    SELECT cl.user_id, cl.completed_at, cl.score,
           extract(epoch FROM cl.completed_at - lag(cl.completed_at)
             OVER (PARTITION BY cl.user_id ORDER BY cl.completed_at)) AS gap,
           count(*) OVER (PARTITION BY cl.user_id, date_trunc('hour', cl.completed_at)) AS per_hour
    FROM public.completed_lessons cl
    WHERE cl.completed_at >= v_from
  ),
  agg AS (
    SELECT user_id,
           count(*) AS items,
           count(*) FILTER (WHERE gap IS NOT NULL AND gap < 10) AS bursts,
           coalesce(max(per_hour), 0) AS max_per_hour,
           count(*) FILTER (WHERE score >= 100 AND gap IS NOT NULL AND gap < 15) AS fast_perfect,
           count(DISTINCT completed_at::date) AS active_days
    FROM ev
    GROUP BY user_id
  ),
  expected AS (
    SELECT c.user_id,
           coalesce(sum(CASE WHEN c.lesson_id LIKE 'problem-%' THEN coalesce(pb.xp_reward, 0)
                             ELSE coalesce(l.xp_reward, 0) END), 0)::integer AS xp_expected
    FROM public.completed_lessons c
    LEFT JOIN public.lessons l ON l.id = c.lesson_id
    LEFT JOIN public.problems pb ON 'problem-' || pb.id = c.lesson_id
    GROUP BY c.user_id
  ),
  scored AS (
    SELECT coalesce(a.user_id, pr.user_id) AS user_id,
           coalesce(a.items, 0) AS items,
           coalesce(a.bursts, 0) AS bursts,
           coalesce(a.max_per_hour, 0) AS max_per_hour,
           coalesce(a.fast_perfect, 0) AS fast_perfect,
           coalesce(a.active_days, 0) AS active_days,
           pr.xp, pr.nickname,
           coalesce(e.xp_expected, 0) AS xp_expected,
           coalesce(nullif(trim(coalesce(pr.last_name,'') || ' ' || coalesce(pr.first_name,'')), ''),
                    pr.display_name, pr.nickname, '—') AS name,
           round(coalesce(a.items, 0)::numeric / greatest(coalesce(a.active_days, 0), 1), 1) AS items_per_day,
           (CASE WHEN coalesce(a.bursts, 0) >= 5 THEN 1 ELSE 0 END)
         + (CASE WHEN coalesce(a.max_per_hour, 0) >= 40 THEN 1 ELSE 0 END)
         + (CASE WHEN coalesce(a.fast_perfect, 0) >= 5 THEN 1 ELSE 0 END)
         + (CASE WHEN coalesce(a.items, 0)::numeric / greatest(coalesce(a.active_days, 0), 1) >= 80 THEN 1 ELSE 0 END)
         + (CASE WHEN abs(pr.xp - coalesce(e.xp_expected, 0)) > greatest(100, coalesce(e.xp_expected, 0) * 0.1) THEN 2 ELSE 0 END) AS signals
    FROM public.profiles pr
    LEFT JOIN agg a ON a.user_id = pr.user_id
    LEFT JOIN expected e ON e.user_id = pr.user_id
    WHERE NOT public.has_role(pr.user_id, 'admin')
      AND coalesce(pr.teacher_status, '') <> 'verified'
      AND coalesce(pr.is_teacher, false) = false
  )
  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'signals')::int DESC, (x->>'bursts')::int DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'user_id', s.user_id,
      'name', s.name,
      'nickname', s.nickname,
      'xp', s.xp,
      'xp_expected', s.xp_expected,
      'xp_gap', s.xp - s.xp_expected,
      'items', s.items,
      'active_days', s.active_days,
      'items_per_day', s.items_per_day,
      'bursts', s.bursts,
      'max_per_hour', s.max_per_hour,
      'fast_perfect', s.fast_perfect,
      'signals', s.signals,
      'risk', CASE WHEN s.signals >= 4 THEN 'ridicat'
                   WHEN s.signals = 3 THEN 'mediu'
                   ELSE 'scazut' END
    ) AS x
    FROM scored s
    WHERE s.signals >= 2
    ORDER BY s.signals DESC, s.bursts DESC
    LIMIT 25
  ) q;

  RETURN v_result;
END;
$function$;