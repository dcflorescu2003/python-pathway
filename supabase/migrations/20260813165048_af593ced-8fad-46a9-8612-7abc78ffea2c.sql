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
  v_valid boolean;
  v_cloud_score integer;
  v_restored integer := 0;
  v_existing integer := 0;
  v_skipped integer := 0;
  v_unknown text[] := '{}';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN jsonb_build_object(
      'restored', 0,
      'existing', 0,
      'skipped', 0,
      'unknown_ids', '[]'::jsonb
    );
  END IF;

  IF jsonb_array_length(p_items) > 1000 THEN
    RAISE EXCEPTION 'Too many progress items';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_id := nullif(trim(v_item->>'lesson_id'), '');
    BEGIN
      v_score := greatest(0, least(coalesce((v_item->>'score')::integer, 0), 100));
    EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      v_score := 0;
    END;

    IF v_id IS NULL THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    IF v_id LIKE 'problem-%' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.problems WHERE id = replace(v_id, 'problem-', '')
      ) INTO v_valid;
    ELSE
      SELECT EXISTS(SELECT 1 FROM public.lessons WHERE id = v_id)
          OR EXISTS(SELECT 1 FROM public.manual_lessons WHERE id = v_id)
      INTO v_valid;
    END IF;

    IF NOT v_valid THEN
      v_skipped := v_skipped + 1;
      IF coalesce(array_length(v_unknown, 1), 0) < 50 THEN
        v_unknown := v_unknown || v_id;
      END IF;
      CONTINUE;
    END IF;

    SELECT score INTO v_cloud_score
    FROM public.completed_lessons
    WHERE user_id = v_uid AND lesson_id = v_id;

    IF FOUND AND v_cloud_score >= v_score THEN
      v_existing := v_existing + 1;
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
    'existing', v_existing,
    'skipped', v_skipped,
    'unknown_ids', to_jsonb(v_unknown)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.restore_progress(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_progress(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_progress(jsonb) TO service_role;