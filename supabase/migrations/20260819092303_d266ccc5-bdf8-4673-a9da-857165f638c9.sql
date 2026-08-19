CREATE OR REPLACE FUNCTION public.award_progress(
  p_item_id text,
  p_score integer,
  p_allow_redo boolean DEFAULT true,
  p_via_solution boolean DEFAULT false,
  p_client_version text DEFAULT NULL
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
  v_min_version constant numeric := 1.117;
  v_client numeric;
  v_stale boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  BEGIN
    v_client := nullif(regexp_replace(coalesce(p_client_version, ''), '[^0-9.]', '', 'g'), '')::numeric;
  EXCEPTION WHEN others THEN
    v_client := NULL;
  END;
  v_stale := (v_client IS NULL OR v_client < v_min_version);

  IF p_item_id LIKE 'problem-%' THEN
    SELECT xp_reward INTO v_base
    FROM public.problems
    WHERE id = replace(p_item_id, 'problem-', '');
  ELSE
    SELECT xp_reward INTO v_base
    FROM public.lessons
    WHERE id = p_item_id;

    IF v_base IS NULL AND EXISTS (
      SELECT 1 FROM public.manual_lessons WHERE id = p_item_id
    ) THEN
      v_base := 0;
    END IF;
  END IF;

  IF v_base IS NULL THEN
    RAISE EXCEPTION 'Item inexistent: %', p_item_id;
  END IF;

  SELECT * INTO v_existing
  FROM public.completed_lessons
  WHERE user_id = v_uid AND lesson_id = p_item_id;

  v_first := v_existing.id IS NULL;

  IF EXISTS (
    SELECT 1
    FROM public.challenges ch
    JOIN public.class_members cm ON cm.class_id = ch.class_id
    WHERE cm.student_id = v_uid AND ch.item_id = p_item_id
  ) THEN
    v_bonus := 1.1;
  END IF;

  IF p_via_solution THEN
    v_awarded := CASE WHEN v_first THEN 1 ELSE 0 END;
    v_score := CASE WHEN v_first THEN 0 ELSE coalesce(v_existing.score, 0) END;
  ELSIF v_first THEN
    v_awarded := round(v_base * v_bonus);
  ELSIF p_allow_redo AND v_score > coalesce(v_existing.score, 0) THEN
    v_awarded := round(3 * v_bonus);
  END IF;

  -- Clienți vechi (build-uri de dinaintea corecțiilor de sincronizare):
  -- înregistrăm finalizarea, dar fără XP, ca să nu retrimită istoric umflat.
  IF v_stale THEN
    v_awarded := 0;
  END IF;

  v_best_score := greatest(coalesce(v_existing.score, 0), v_score);

  INSERT INTO public.completed_lessons (user_id, lesson_id, score, completed_at)
  VALUES (v_uid, p_item_id, v_best_score, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET score = greatest(public.completed_lessons.score, EXCLUDED.score);

  SELECT xp, streak, best_streak, last_activity_date INTO v_profile
  FROM public.profiles
  WHERE user_id = v_uid;

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

  SELECT xp, streak INTO v_profile
  FROM public.profiles
  WHERE user_id = v_uid;

  RETURN jsonb_build_object(
    'awarded_xp', v_awarded,
    'total_xp', v_profile.xp,
    'streak', v_profile.streak,
    'streak_increased', v_streak_up,
    'first_time', v_first,
    'score', v_best_score,
    'stale_client', v_stale
  );
END;
$function$;