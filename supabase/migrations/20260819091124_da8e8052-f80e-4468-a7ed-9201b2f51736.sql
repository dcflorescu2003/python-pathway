DO $$
DECLARE
  v_uid uuid;
  v_xp integer;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'dcflorescu2003@gmail.com';
  IF v_uid IS NULL THEN RAISE NOTICE 'user not found'; RETURN; END IF;

  INSERT INTO public.completed_lessons (user_id, lesson_id, score, completed_at)
  SELECT v_uid, l.id, 100, now() FROM public.lessons l
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET score = greatest(public.completed_lessons.score, 100);

  INSERT INTO public.completed_lessons (user_id, lesson_id, score, completed_at)
  SELECT v_uid, 'problem-' || p.id, 100, now() FROM public.problems p
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET score = greatest(public.completed_lessons.score, 100);

  SELECT coalesce(sum(CASE WHEN c.lesson_id LIKE 'problem-%' THEN coalesce(pb.xp_reward,0)
                           ELSE coalesce(l.xp_reward,0) END),0)::integer
  INTO v_xp
  FROM public.completed_lessons c
  LEFT JOIN public.lessons l ON l.id = c.lesson_id
  LEFT JOIN public.problems pb ON 'problem-' || pb.id = c.lesson_id
  WHERE c.user_id = v_uid;

  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles SET xp = v_xp WHERE user_id = v_uid;
  PERFORM set_config('app.bypass_profile_protection', 'false', true);
END $$;