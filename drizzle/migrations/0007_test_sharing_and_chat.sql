CREATE TABLE public.test_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  shared_with uuid NOT NULL,
  shared_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (test_id, shared_with)
);
GRANT SELECT ON public.test_shares TO authenticated;
GRANT ALL ON public.test_shares TO service_role;
ALTER TABLE public.test_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or recipient read shares" ON public.test_shares FOR SELECT TO authenticated
  USING (shared_with = auth.uid() OR shared_by = auth.uid());

CREATE TABLE public.test_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX test_messages_test_idx ON public.test_messages(test_id, created_at);

CREATE OR REPLACE FUNCTION public.can_access_test_chat(_test_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tests WHERE id = _test_id AND teacher_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.test_shares WHERE test_id = _test_id AND shared_with = _user_id);
$$;

GRANT SELECT, INSERT ON public.test_messages TO authenticated;
GRANT ALL ON public.test_messages TO service_role;
ALTER TABLE public.test_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read messages" ON public.test_messages FOR SELECT TO authenticated
  USING (public.can_access_test_chat(test_id, auth.uid()));
CREATE POLICY "Participants send messages" ON public.test_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.can_access_test_chat(test_id, auth.uid()));
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_messages;

CREATE OR REPLACE FUNCTION public.can_teacher_view_test(_test_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.test_assignments ta
    WHERE ta.test_id = _test_id AND public.is_class_teacher(ta.class_id, _user_id)
  ) OR EXISTS (
    SELECT 1 FROM public.test_shares s WHERE s.test_id = _test_id AND s.shared_with = _user_id
  );
$$;

-- Colleagues = other teachers (owner or co-teacher) of any class where I teach
CREATE OR REPLACE FUNCTION public.get_my_colleagues()
RETURNS TABLE(user_id uuid, display_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH my_classes AS (
    SELECT id FROM public.teacher_classes WHERE teacher_id = auth.uid()
    UNION SELECT class_id FROM public.class_co_teachers WHERE teacher_id = auth.uid()
  ), others AS (
    SELECT tc.teacher_id AS uid FROM public.teacher_classes tc JOIN my_classes m ON m.id = tc.id
    UNION SELECT ct.teacher_id FROM public.class_co_teachers ct JOIN my_classes m ON m.id = ct.class_id
  )
  SELECT o.uid, COALESCE(NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.display_name, 'Profesor')
  FROM others o LEFT JOIN public.profiles p ON p.user_id = o.uid
  WHERE o.uid <> auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.share_test(p_test_id uuid, p_teacher_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title text; v_name text; v_new uuid[];
BEGIN
  SELECT title INTO v_title FROM public.tests WHERE id = p_test_id AND teacher_id = auth.uid();
  IF v_title IS NULL THEN RAISE EXCEPTION 'Doar autorul poate partaja testul'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(COALESCE(p_teacher_ids,'{}')) t(id)
             WHERE t.id NOT IN (SELECT user_id FROM public.get_my_colleagues())) THEN
    RAISE EXCEPTION 'Poți partaja doar cu co-profesorii tăi';
  END IF;
  DELETE FROM public.test_shares WHERE test_id = p_test_id AND NOT (shared_with = ANY(COALESCE(p_teacher_ids,'{}')));
  WITH ins AS (
    INSERT INTO public.test_shares(test_id, shared_with, shared_by)
    SELECT p_test_id, t.id, auth.uid() FROM unnest(COALESCE(p_teacher_ids,'{}')) t(id)
    ON CONFLICT (test_id, shared_with) DO NOTHING
    RETURNING shared_with
  ) SELECT array_agg(shared_with) INTO v_new FROM ins;
  IF v_new IS NOT NULL THEN
    SELECT COALESCE(NULLIF(trim(concat_ws(' ', first_name, last_name)), ''), display_name, 'Un coleg')
      INTO v_name FROM public.profiles WHERE user_id = auth.uid();
    INSERT INTO public.notifications(user_id, title, body, link)
    SELECT u, 'Test partajat cu tine', v_name || ' a partajat testul „' || v_title || '”.',
           '/auth?tab=tests&test=' || p_test_id
    FROM unnest(v_new) u;
  END IF;
  RETURN jsonb_build_object('new_recipients', COALESCE(to_jsonb(v_new), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.get_shared_tests()
RETURNS TABLE(id uuid, title text, created_at timestamptz, time_limit_minutes integer, variant_mode text, owner_name text, shared_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.title, t.created_at, t.time_limit_minutes, t.variant_mode,
         COALESCE(NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.display_name, 'Profesor'),
         s.created_at
  FROM public.test_shares s JOIN public.tests t ON t.id = s.test_id
  LEFT JOIN public.profiles p ON p.user_id = t.teacher_id
  WHERE s.shared_with = auth.uid()
  ORDER BY s.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_test_messages(p_test_id uuid)
RETURNS TABLE(id uuid, sender_id uuid, sender_name text, body text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.sender_id,
         COALESCE(NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.display_name, 'Profesor'),
         m.body, m.created_at
  FROM public.test_messages m LEFT JOIN public.profiles p ON p.user_id = m.sender_id
  WHERE m.test_id = p_test_id AND public.can_access_test_chat(p_test_id, auth.uid())
  ORDER BY m.created_at;
$$;

CREATE OR REPLACE FUNCTION public.duplicate_test(p_test_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new uuid;
BEGIN
  IF NOT public.can_access_test_chat(p_test_id, auth.uid()) THEN
    RAISE EXCEPTION 'Nu ai acces la acest test';
  END IF;
  INSERT INTO public.tests(teacher_id, title, time_limit_minutes, variant_mode, allow_run_tests,
    ai_grading_item_ids, require_fullscreen, office_points, anti_cheat_mode)
  SELECT auth.uid(), title || ' (copie)', time_limit_minutes, variant_mode, allow_run_tests,
    ai_grading_item_ids, require_fullscreen, office_points, anti_cheat_mode
  FROM public.tests WHERE id = p_test_id
  RETURNING id INTO v_new;
  INSERT INTO public.test_items(test_id, variant, sort_order, source_type, source_id, custom_data, points)
  SELECT v_new, variant, sort_order, source_type, source_id, custom_data, points
  FROM public.test_items WHERE test_id = p_test_id;
  RETURN v_new;
END $$;

-- Notify other participants, at most once per 10 minutes per test per recipient
CREATE OR REPLACE FUNCTION public.notify_test_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title text; v_name text; v_link text;
BEGIN
  SELECT title INTO v_title FROM public.tests WHERE id = NEW.test_id;
  SELECT COALESCE(NULLIF(trim(concat_ws(' ', first_name, last_name)), ''), display_name, 'Un coleg')
    INTO v_name FROM public.profiles WHERE user_id = NEW.sender_id;
  v_link := '/auth?tab=tests&test=' || NEW.test_id;
  INSERT INTO public.notifications(user_id, title, body, link)
  SELECT r.uid, 'Mesaj nou: ' || v_title, v_name || ': ' || left(NEW.body, 120), v_link
  FROM (
    SELECT teacher_id AS uid FROM public.tests WHERE id = NEW.test_id
    UNION SELECT shared_with FROM public.test_shares WHERE test_id = NEW.test_id
  ) r
  WHERE r.uid <> NEW.sender_id
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = r.uid AND n.link = v_link AND n.title LIKE 'Mesaj nou:%'
        AND n.created_at > now() - interval '10 minutes'
    );
  RETURN NEW;
END $$;
CREATE TRIGGER test_messages_notify AFTER INSERT ON public.test_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_test_message();

REVOKE EXECUTE ON FUNCTION public.notify_test_message() FROM PUBLIC, anon, authenticated;