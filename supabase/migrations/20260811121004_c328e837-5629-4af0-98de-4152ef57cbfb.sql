CREATE OR REPLACE FUNCTION public.admin_get_stats(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer := greatest(1, least(coalesce(p_days, 30), 365));
  v_from timestamptz := now() - (v_days || ' days')::interval;
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'days', v_days,
    'summary', (
      SELECT jsonb_build_object(
        'total_users', count(*),
        'premium_users', count(*) FILTER (WHERE is_premium),
        'teachers', count(*) FILTER (WHERE is_teacher),
        'verified_teachers', count(*) FILTER (WHERE teacher_status = 'verified'),
        'active_today', count(*) FILTER (WHERE last_activity_date >= current_date),
        'active_7d', count(*) FILTER (WHERE last_activity_date >= current_date - 6),
        'active_30d', count(*) FILTER (WHERE last_activity_date >= current_date - 29),
        'new_users_period', count(*) FILTER (WHERE created_at >= v_from)
      )
      FROM public.profiles
    ),
    'activity', (
      SELECT jsonb_build_object(
        'lessons_today', count(*) FILTER (WHERE completed_at >= current_date AND lesson_id NOT LIKE 'problem-%'),
        'lessons_7d', count(*) FILTER (WHERE completed_at >= current_date - 6 AND lesson_id NOT LIKE 'problem-%'),
        'lessons_period', count(*) FILTER (WHERE completed_at >= v_from AND lesson_id NOT LIKE 'problem-%'),
        'problems_today', count(*) FILTER (WHERE completed_at >= current_date AND lesson_id LIKE 'problem-%'),
        'problems_7d', count(*) FILTER (WHERE completed_at >= current_date - 6 AND lesson_id LIKE 'problem-%'),
        'problems_period', count(*) FILTER (WHERE completed_at >= v_from AND lesson_id LIKE 'problem-%'),
        'avg_score_period', round(coalesce(avg(score) FILTER (WHERE completed_at >= v_from AND lesson_id NOT LIKE 'problem-%'), 0)::numeric, 1)
      )
      FROM public.completed_lessons
    ),
    'submissions', (
      SELECT jsonb_build_object(
        'total', count(*),
        'period', count(*) FILTER (WHERE started_at >= v_from),
        'submitted_period', count(*) FILTER (WHERE submitted_at >= v_from)
      )
      FROM public.test_submissions
    ),
    'daily', (
      SELECT coalesce(jsonb_agg(x ORDER BY x->>'day'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'day', to_char(d.day, 'YYYY-MM-DD'),
          'lessons', coalesce(l.lessons, 0),
          'problems', coalesce(l.problems, 0),
          'active_users', coalesce(l.users, 0)
        ) AS x
        FROM generate_series((current_date - (v_days - 1))::timestamp, current_date::timestamp, interval '1 day') AS g(day)
        CROSS JOIN LATERAL (SELECT g.day::date AS day) d
        LEFT JOIN (
          SELECT completed_at::date AS day,
                 count(*) FILTER (WHERE lesson_id NOT LIKE 'problem-%') AS lessons,
                 count(*) FILTER (WHERE lesson_id LIKE 'problem-%') AS problems,
                 count(DISTINCT user_id) AS users
          FROM public.completed_lessons
          WHERE completed_at >= v_from
          GROUP BY 1
        ) l ON l.day = d.day
      ) s
    ),
    'top_lessons', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'id', cl.lesson_id,
          'title', coalesce(le.title, cl.lesson_id),
          'count', count(*),
          'avg_score', round(avg(cl.score)::numeric, 1)
        ) AS x
        FROM public.completed_lessons cl
        LEFT JOIN public.lessons le ON le.id = cl.lesson_id
        WHERE cl.completed_at >= v_from AND cl.lesson_id NOT LIKE 'problem-%'
        GROUP BY cl.lesson_id, le.title
        ORDER BY count(*) DESC
        LIMIT 10
      ) s
    ),
    'top_problems', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'id', replace(cl.lesson_id, 'problem-', ''),
          'title', coalesce(p.title, replace(cl.lesson_id, 'problem-', '')),
          'count', count(*)
        ) AS x
        FROM public.completed_lessons cl
        LEFT JOIN public.problems p ON p.id = replace(cl.lesson_id, 'problem-', '')
        WHERE cl.completed_at >= v_from AND cl.lesson_id LIKE 'problem-%'
        GROUP BY cl.lesson_id, p.title
        ORDER BY count(*) DESC
        LIMIT 10
      ) s
    ),
    'by_chapter', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'chapter', coalesce(ch.title, 'Necunoscut'),
          'count', count(*),
          'avg_score', round(avg(cl.score)::numeric, 1)
        ) AS x
        FROM public.completed_lessons cl
        JOIN public.lessons le ON le.id = cl.lesson_id
        JOIN public.chapters ch ON ch.id = le.chapter_id
        WHERE cl.completed_at >= v_from
        GROUP BY ch.id, ch.title, ch.number
        ORDER BY ch.number
      ) s
    ),
    'top_users', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'user_id', pr.user_id,
          'name', coalesce(nullif(trim(coalesce(pr.last_name,'') || ' ' || coalesce(pr.first_name,'')), ''), pr.display_name, pr.nickname, '—'),
          'nickname', pr.nickname,
          'xp', pr.xp,
          'streak', pr.streak,
          'is_premium', pr.is_premium,
          'is_teacher', pr.is_teacher,
          'last_activity_date', pr.last_activity_date,
          'items_period', coalesce(a.cnt, 0)
        ) AS x
        FROM public.profiles pr
        LEFT JOIN (
          SELECT user_id, count(*) AS cnt
          FROM public.completed_lessons
          WHERE completed_at >= v_from
          GROUP BY user_id
        ) a ON a.user_id = pr.user_id
        ORDER BY coalesce(a.cnt, 0) DESC, pr.xp DESC
        LIMIT 20
      ) s
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_stats(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_stats(integer) TO authenticated;