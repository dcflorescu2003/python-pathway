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
          OR EXISTS(SELECT 1 FROM public.manual_lessons WHERE id = v_id) INTO v_exists;
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