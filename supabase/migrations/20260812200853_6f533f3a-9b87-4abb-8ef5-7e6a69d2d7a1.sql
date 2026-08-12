-- 1. Protejează xp / streak / best_streak împotriva scrierii directe din client
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.bypass_profile_protection', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_premium := OLD.is_premium;
    NEW.is_teacher := OLD.is_teacher;
    NEW.teacher_status := OLD.teacher_status;
    -- Anti-fraudă: progresul se acordă exclusiv prin award_progress / record_activity
    NEW.xp := OLD.xp;
    NEW.streak := OLD.streak;
    NEW.best_streak := OLD.best_streak;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Validare pe completed_lessons (item real + scor plauzibil)
CREATE OR REPLACE FUNCTION public.validate_completed_lesson()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_exists boolean;
BEGIN
  IF NEW.score IS NULL OR NEW.score < 0 OR NEW.score > 100 THEN
    RAISE EXCEPTION 'Scor invalid: %', NEW.score;
  END IF;

  IF NEW.lesson_id LIKE 'problem-%' THEN
    SELECT EXISTS(SELECT 1 FROM public.problems WHERE id = replace(NEW.lesson_id, 'problem-', '')) INTO v_exists;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.lessons WHERE id = NEW.lesson_id)
        OR EXISTS(SELECT 1 FROM public.manual_lessons WHERE id = NEW.lesson_id) INTO v_exists;
  END IF;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Item inexistent: %', NEW.lesson_id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_completed_lesson ON public.completed_lessons;
CREATE TRIGGER validate_completed_lesson
BEFORE INSERT OR UPDATE ON public.completed_lessons
FOR EACH ROW EXECUTE FUNCTION public.validate_completed_lesson();

-- 3. Funcția oficială de acordare a progresului
CREATE OR REPLACE FUNCTION public.award_progress(
  p_item_id text,
  p_score integer,
  p_allow_redo boolean DEFAULT true,
  p_via_solution boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_score integer := greatest(0, least(coalesce(p_score, 0), 100));
  v_base integer;
  v_existing record;
  v_first boolean;
  v_awarded integer := 0;
  v_bonus numeric := 1;
  v_today date := current_date;
  v_profile record;
  v_streak integer;
  v_streak_up boolean := false;
  v_best_score integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- XP de bază, citit de pe server
  IF p_item_id LIKE 'problem-%' THEN
    SELECT xp_reward INTO v_base FROM public.problems WHERE id = replace(p_item_id, 'problem-', '');
  ELSE
    SELECT xp_reward INTO v_base FROM public.lessons WHERE id = p_item_id;
    IF v_base IS NULL AND EXISTS(SELECT 1 FROM public.manual_lessons WHERE id = p_item_id) THEN
      v_base := 0;
    END IF;
  END IF;

  IF v_base IS NULL THEN
    RAISE EXCEPTION 'Item inexistent: %', p_item_id;
  END IF;

  SELECT * INTO v_existing FROM public.completed_lessons
   WHERE user_id = v_uid AND lesson_id = p_item_id;
  v_first := v_existing.id IS NULL;

  -- Bonus provocare (+10%) dacă itemul e provocare într-una din clasele elevului
  IF EXISTS (
    SELECT 1 FROM public.challenges ch
    JOIN public.class_members cm ON cm.class_id = ch.class_id
    WHERE cm.student_id = v_uid AND ch.item_id = p_item_id
  ) THEN
    v_bonus := 1.1;
  END IF;

  IF p_via_solution THEN
    -- A apelat la rezolvare: 1 XP, doar prima dată
    v_awarded := CASE WHEN v_first THEN 1 ELSE 0 END;
    v_score := CASE WHEN v_first THEN 0 ELSE coalesce(v_existing.score, 0) END;
  ELSIF v_first THEN
    v_awarded := round(v_base * v_bonus);
  ELSIF p_allow_redo THEN
    v_awarded := round(3 * v_bonus);
  END IF;

  v_best_score := greatest(coalesce(v_existing.score, 0), v_score);

  INSERT INTO public.completed_lessons (user_id, lesson_id, score, completed_at)
  VALUES (v_uid, p_item_id, v_best_score, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET score = greatest(public.completed_lessons.score, EXCLUDED.score);

  SELECT xp, streak, best_streak, last_activity_date INTO v_profile
    FROM public.profiles WHERE user_id = v_uid;

  v_streak := coalesce(v_profile.streak, 0);
  IF v_profile.last_activity_date IS DISTINCT FROM v_today THEN
    IF v_profile.last_activity_date = v_today - 1 THEN
      v_streak := v_streak + 1;
    ELSE
      v_streak := 1;
    END IF;
    v_streak_up := true;
  END IF;

  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles
     SET xp = coalesce(xp, 0) + v_awarded,
         streak = v_streak,
         best_streak = greatest(coalesce(best_streak, 0), v_streak),
         last_activity_date = v_today
   WHERE user_id = v_uid;
  PERFORM set_config('app.bypass_profile_protection', 'false', true);

  SELECT xp, streak INTO v_profile FROM public.profiles WHERE user_id = v_uid;

  RETURN jsonb_build_object(
    'awarded_xp', v_awarded,
    'total_xp', v_profile.xp,
    'streak', v_profile.streak,
    'streak_increased', v_streak_up,
    'first_time', v_first,
    'score', v_best_score
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.award_progress(text, integer, boolean, boolean) TO authenticated;

-- 4. Înregistrarea activității zilnice (streak) fără XP
CREATE OR REPLACE FUNCTION public.record_activity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := current_date;
  v_profile record;
  v_streak integer;
  v_up boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT streak, last_activity_date INTO v_profile FROM public.profiles WHERE user_id = v_uid;
  v_streak := coalesce(v_profile.streak, 0);

  IF v_profile.last_activity_date IS DISTINCT FROM v_today THEN
    IF v_profile.last_activity_date = v_today - 1 THEN
      v_streak := v_streak + 1;
    ELSE
      v_streak := 1;
    END IF;
    v_up := true;

    PERFORM set_config('app.bypass_profile_protection', 'true', true);
    UPDATE public.profiles
       SET streak = v_streak,
           best_streak = greatest(coalesce(best_streak, 0), v_streak),
           last_activity_date = v_today
     WHERE user_id = v_uid;
    PERFORM set_config('app.bypass_profile_protection', 'false', true);
  END IF;

  RETURN jsonb_build_object('streak', v_streak, 'streak_increased', v_up);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.record_activity() TO authenticated;

-- 5. Blochează scrierea directă în completed_lessons din client
DROP POLICY IF EXISTS "Users can insert their own completed lessons" ON public.completed_lessons;
DROP POLICY IF EXISTS "Users can update their own completed lessons" ON public.completed_lessons;

-- 6. Semnale suspecte în statisticile de admin
CREATE OR REPLACE FUNCTION public.admin_get_anomalies()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  WITH expected AS (
    SELECT cl.user_id,
           sum(coalesce(l.xp_reward, p.xp_reward, 0)) AS expected_xp,
           count(*) AS items
    FROM public.completed_lessons cl
    LEFT JOIN public.lessons l ON l.id = cl.lesson_id
    LEFT JOIN public.problems p ON ('problem-' || p.id) = cl.lesson_id
    GROUP BY cl.user_id
  ),
  speed AS (
    SELECT user_id,
           count(*) FILTER (WHERE gap < 10) AS bursts,
           max(per_hour) AS max_per_hour
    FROM (
      SELECT user_id,
             extract(epoch FROM completed_at - lag(completed_at) OVER (PARTITION BY user_id ORDER BY completed_at)) AS gap,
             count(*) OVER (PARTITION BY user_id, date_trunc('hour', completed_at)) AS per_hour
      FROM public.completed_lessons
    ) t
    GROUP BY user_id
  )
  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'xp_gap')::int DESC), '[]'::jsonb) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'user_id', pr.user_id,
      'name', coalesce(nullif(trim(coalesce(pr.last_name,'') || ' ' || coalesce(pr.first_name,'')), ''), pr.display_name, pr.nickname, '—'),
      'nickname', pr.nickname,
      'xp', pr.xp,
      'expected_xp', coalesce(e.expected_xp, 0),
      'xp_gap', pr.xp - coalesce(e.expected_xp, 0),
      'items', coalesce(e.items, 0),
      'bursts', coalesce(s.bursts, 0),
      'max_per_hour', coalesce(s.max_per_hour, 0)
    ) AS x
    FROM public.profiles pr
    LEFT JOIN expected e ON e.user_id = pr.user_id
    LEFT JOIN speed s ON s.user_id = pr.user_id
    WHERE pr.xp > 100
      AND (
        pr.xp - coalesce(e.expected_xp, 0) > greatest(100, coalesce(e.expected_xp, 0) * 0.1)
        OR coalesce(s.bursts, 0) >= 3
        OR coalesce(s.max_per_hour, 0) >= 40
      )
    LIMIT 25
  ) q;

  RETURN v_result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_get_anomalies() TO authenticated;