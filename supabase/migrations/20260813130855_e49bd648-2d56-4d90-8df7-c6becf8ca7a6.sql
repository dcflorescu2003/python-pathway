-- 1) Restaurare progres local -> cloud, fără XP
CREATE OR REPLACE FUNCTION public.restore_progress(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item jsonb;
  v_id text;
  v_score integer;
  v_exists boolean;
  v_restored integer := 0;
  v_skipped integer := 0;
  v_unknown text[] := '{}';
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN jsonb_build_object('restored', 0, 'skipped', 0, 'unknown_ids', '[]'::jsonb);
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_id := v_item->>'lesson_id';
    v_score := greatest(0, least(coalesce((v_item->>'score')::int, 0), 100));
    CONTINUE WHEN v_id IS NULL;

    IF v_id LIKE 'problem-%' THEN
      SELECT EXISTS(SELECT 1 FROM public.problems WHERE id = replace(v_id, 'problem-', '')) INTO v_exists;
    ELSE
      SELECT EXISTS(SELECT 1 FROM public.lessons WHERE id = v_id)
          OR EXISTS(SELECT 1 FROM public.lessons WHERE id = regexp_replace(v_id, 'f$', ''))
          OR EXISTS(SELECT 1 FROM public.manual_lessons WHERE id = v_id)
      INTO v_exists;
    END IF;

    IF NOT v_exists THEN
      v_skipped := v_skipped + 1;
      IF array_length(v_unknown, 1) IS NULL OR array_length(v_unknown, 1) < 50 THEN
        v_unknown := v_unknown || v_id;
      END IF;
      CONTINUE;
    END IF;

    INSERT INTO public.completed_lessons (user_id, lesson_id, score, completed_at)
    VALUES (v_uid, v_id, v_score, now())
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET score = greatest(public.completed_lessons.score, EXCLUDED.score);

    v_restored := v_restored + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'restored', v_restored,
    'skipped', v_skipped,
    'unknown_ids', to_jsonb(v_unknown)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_progress(jsonb) TO authenticated;

-- 2) Semnale suspecte v2 (comportamentale, pe fereastră de timp)
DROP FUNCTION IF EXISTS public.admin_get_anomalies();

CREATE OR REPLACE FUNCTION public.admin_get_anomalies(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_days integer := greatest(1, least(coalesce(p_days, 30), 365));
  v_from timestamptz := (current_date - (v_days - 1))::timestamptz;
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  WITH ev AS (
    SELECT cl.user_id,
           cl.completed_at,
           cl.score,
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
  scored AS (
    SELECT a.*,
           pr.xp, pr.nickname,
           coalesce(nullif(trim(coalesce(pr.last_name,'') || ' ' || coalesce(pr.first_name,'')), ''),
                    pr.display_name, pr.nickname, '—') AS name,
           round(a.items::numeric / greatest(a.active_days, 1), 1) AS items_per_day,
           (CASE WHEN a.bursts >= 5 THEN 1 ELSE 0 END)
         + (CASE WHEN a.max_per_hour >= 40 THEN 1 ELSE 0 END)
         + (CASE WHEN a.fast_perfect >= 5 THEN 1 ELSE 0 END)
         + (CASE WHEN a.items::numeric / greatest(a.active_days, 1) >= 80 THEN 1 ELSE 0 END) AS signals
    FROM agg a
    JOIN public.profiles pr ON pr.user_id = a.user_id
    WHERE NOT public.has_role(a.user_id, 'admin')
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
$$;