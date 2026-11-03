CREATE TABLE public.class_co_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, teacher_id)
);
GRANT SELECT ON public.class_co_teachers TO authenticated;
GRANT ALL ON public.class_co_teachers TO service_role;
ALTER TABLE public.class_co_teachers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.class_co_teacher_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.class_co_teacher_invites TO authenticated;
GRANT ALL ON public.class_co_teacher_invites TO service_role;
ALTER TABLE public.class_co_teacher_invites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_class_owner(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teacher_classes WHERE id = _class_id AND teacher_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teacher_classes WHERE id = _class_id AND teacher_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.class_co_teachers WHERE class_id = _class_id AND teacher_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.can_teacher_view_student(p_teacher_id uuid, p_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members cm
    WHERE cm.student_id = p_student_id AND public.is_class_teacher(cm.class_id, p_teacher_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_grade_assignment(_assignment_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.test_assignments ta JOIN public.tests t ON t.id = ta.test_id
    WHERE ta.id = _assignment_id
      AND (t.teacher_id = _user_id OR public.is_class_teacher(ta.class_id, _user_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.can_teacher_view_test(_test_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.test_assignments ta
    WHERE ta.test_id = _test_id AND public.is_class_teacher(ta.class_id, _user_id)
  );
$$;

-- Policies for new tables
CREATE POLICY "Class teachers see co-teachers" ON public.class_co_teachers FOR SELECT TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()));
CREATE POLICY "Owners see invites" ON public.class_co_teacher_invites FOR SELECT TO authenticated
  USING (public.is_class_owner(class_id, auth.uid()));

-- Co-teachers can see the class
CREATE POLICY "Co-teachers can select classes" ON public.teacher_classes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.class_co_teachers c WHERE c.class_id = teacher_classes.id AND c.teacher_id = auth.uid()));

-- Removing students stays owner-only
DROP POLICY IF EXISTS "Teachers can remove class members" ON public.class_members;
CREATE POLICY "Teachers can remove class members" ON public.class_members FOR DELETE TO authenticated
  USING (public.is_class_owner(class_id, auth.uid()));

-- Challenges: any class teacher
DROP POLICY IF EXISTS "Teachers can delete challenges" ON public.challenges;
DROP POLICY IF EXISTS "Teachers can insert challenges" ON public.challenges;
DROP POLICY IF EXISTS "Teachers can select challenges" ON public.challenges;
CREATE POLICY "Teachers can delete challenges" ON public.challenges FOR DELETE TO authenticated USING (public.is_class_teacher(class_id, auth.uid()));
CREATE POLICY "Teachers can insert challenges" ON public.challenges FOR INSERT TO authenticated WITH CHECK (public.is_class_teacher(class_id, auth.uid()));
CREATE POLICY "Teachers can select challenges" ON public.challenges FOR SELECT TO authenticated USING (public.is_class_teacher(class_id, auth.uid()));

-- Completed lessons
DROP POLICY IF EXISTS "Teachers can view student completed lessons" ON public.completed_lessons;
CREATE POLICY "Teachers can view student completed lessons" ON public.completed_lessons FOR SELECT TO authenticated
  USING (public.can_teacher_view_student(auth.uid(), user_id));

-- Test assignments: class teachers can see and release scores
CREATE POLICY "Class teachers can view class assignments" ON public.test_assignments FOR SELECT TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()));
CREATE POLICY "Class teachers can update class assignments" ON public.test_assignments FOR UPDATE TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid())) WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

-- Tests / items visible to co-teachers of a class where assigned
CREATE POLICY "Class teachers can view assigned tests" ON public.tests FOR SELECT TO authenticated
  USING (public.can_teacher_view_test(id, auth.uid()));
CREATE POLICY "Class teachers can view assigned test items" ON public.test_items FOR SELECT TO authenticated
  USING (public.can_teacher_view_test(test_id, auth.uid()));

-- Submissions & answers
CREATE POLICY "Class teachers can view submissions" ON public.test_submissions FOR SELECT TO authenticated
  USING (public.can_grade_assignment(assignment_id, auth.uid()));
CREATE POLICY "Class teachers can update submissions" ON public.test_submissions FOR UPDATE TO authenticated
  USING (public.can_grade_assignment(assignment_id, auth.uid()));
CREATE POLICY "Class teachers can delete submissions" ON public.test_submissions FOR DELETE TO authenticated
  USING (public.can_grade_assignment(assignment_id, auth.uid()));
CREATE POLICY "Class teachers can view answers" ON public.test_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.test_submissions ts WHERE ts.id = test_answers.submission_id AND public.can_grade_assignment(ts.assignment_id, auth.uid())));
CREATE POLICY "Class teachers can update answers" ON public.test_answers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.test_submissions ts WHERE ts.id = test_answers.submission_id AND public.can_grade_assignment(ts.assignment_id, auth.uid())));
CREATE POLICY "Class teachers can delete answers" ON public.test_answers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.test_submissions ts WHERE ts.id = test_answers.submission_id AND public.can_grade_assignment(ts.assignment_id, auth.uid())));

-- Grading triggers
CREATE OR REPLACE FUNCTION public.protect_answer_grading_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.test_submissions ts WHERE ts.id = NEW.submission_id
             AND public.can_grade_assignment(ts.assignment_id, auth.uid())) THEN
    RETURN NEW;
  END IF;
  NEW.score := OLD.score; NEW.max_points := OLD.max_points; NEW.feedback := OLD.feedback;
  NEW.ai_reviewed := OLD.ai_reviewed; NEW.submission_id := OLD.submission_id; NEW.test_item_id := OLD.test_item_id;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.protect_submission_grading_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.can_grade_assignment(NEW.assignment_id, auth.uid()) THEN RETURN NEW; END IF;
  NEW.total_score := OLD.total_score; NEW.max_score := OLD.max_score; NEW.auto_graded := OLD.auto_graded;
  NEW.late_submission := OLD.late_submission; NEW.student_id := OLD.student_id; NEW.assignment_id := OLD.assignment_id;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.get_class_basic_info(p_class_id uuid)
RETURNS TABLE(id uuid, name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tc.id, tc.name FROM public.teacher_classes tc
  WHERE tc.id = p_class_id AND (public.is_class_teacher(tc.id, auth.uid()) OR public.is_class_member(tc.id, auth.uid()))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_test_roster_allocations(p_assignment_id uuid)
 RETURNS TABLE(student_id uuid, display_name text, first_name text, last_name text, roster_number integer, variant text, status text, submitted_at timestamp with time zone, submission_id uuid)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_class_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT ta.class_id INTO v_class_id FROM public.test_assignments ta WHERE ta.id = p_assignment_id;
  IF v_class_id IS NULL THEN RAISE EXCEPTION 'Assignment not found'; END IF;
  IF NOT public.can_grade_assignment(p_assignment_id, v_uid) AND NOT has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH roster AS (
    SELECT cm.student_id, p.display_name, p.first_name, p.last_name,
      row_number() OVER (
        ORDER BY lower(coalesce(nullif(btrim(p.last_name), ''), btrim(coalesce(p.display_name, 'Elev')))) ASC, cm.student_id ASC
      )::integer AS idx
    FROM public.class_members cm
    LEFT JOIN public.profiles p ON p.user_id = cm.student_id
    WHERE cm.class_id = v_class_id
  )
  SELECT r.student_id, r.display_name, r.first_name, r.last_name,
    COALESCE(ts.roster_number, r.idx) AS roster_number,
    COALESCE(ts.variant, CASE WHEN ((r.idx - 1) % 2) = 0 THEN 'A' ELSE 'B' END) AS variant,
    COALESCE(CASE WHEN ts.submitted_at IS NOT NULL THEN 'submitted' ELSE ts.status END, 'not_started') AS status,
    ts.submitted_at, ts.id AS submission_id
  FROM roster r
  LEFT JOIN public.test_submissions ts ON ts.assignment_id = p_assignment_id AND ts.student_id = r.student_id
  ORDER BY r.idx;
END;
$function$;

-- Invite / accept / remove / leave / list
CREATE OR REPLACE FUNCTION public.create_co_teacher_invite(p_class_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text; v_exp timestamptz; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
BEGIN
  IF NOT public.is_class_owner(p_class_id, auth.uid()) THEN RAISE EXCEPTION 'Doar titularul clasei poate invita co-profesori'; END IF;
  IF (SELECT count(*) FROM public.class_co_teachers WHERE class_id = p_class_id) >= 3 THEN
    RAISE EXCEPTION 'Clasa are deja numărul maxim de 3 co-profesori';
  END IF;
  LOOP
    v_code := 'PROF-';
    FOR i IN 1..6 LOOP v_code := v_code || substr(chars, 1 + floor(random()*length(chars))::int, 1); END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.class_co_teacher_invites WHERE code = v_code);
  END LOOP;
  INSERT INTO public.class_co_teacher_invites(class_id, code, created_by)
  VALUES (p_class_id, v_code, auth.uid()) RETURNING expires_at INTO v_exp;
  RETURN jsonb_build_object('code', v_code, 'expires_at', v_exp);
END; $$;

CREATE OR REPLACE FUNCTION public.accept_co_teacher_invite(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid(); v_inv record; v_class record; v_name text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_verified_teacher(v_uid) THEN RAISE EXCEPTION 'Doar profesorii verificați pot deveni co-profesori'; END IF;
  SELECT * INTO v_inv FROM public.class_co_teacher_invites WHERE code = upper(btrim(p_code)) FOR UPDATE;
  IF v_inv IS NULL THEN RAISE EXCEPTION 'Cod invalid'; END IF;
  IF v_inv.used_by IS NOT NULL THEN RAISE EXCEPTION 'Codul a fost deja folosit'; END IF;
  IF v_inv.expires_at < now() THEN RAISE EXCEPTION 'Codul a expirat'; END IF;
  SELECT * INTO v_class FROM public.teacher_classes WHERE id = v_inv.class_id;
  IF v_class.teacher_id = v_uid THEN RAISE EXCEPTION 'Ești deja titularul acestei clase'; END IF;
  IF EXISTS (SELECT 1 FROM public.class_co_teachers WHERE class_id = v_class.id AND teacher_id = v_uid) THEN
    RAISE EXCEPTION 'Ești deja co-profesor la această clasă';
  END IF;
  IF (SELECT count(*) FROM public.class_co_teachers WHERE class_id = v_class.id) >= 3 THEN
    RAISE EXCEPTION 'Clasa are deja numărul maxim de 3 co-profesori';
  END IF;
  INSERT INTO public.class_co_teachers(class_id, teacher_id, added_by) VALUES (v_class.id, v_uid, v_inv.created_by);
  UPDATE public.class_co_teacher_invites SET used_by = v_uid, used_at = now() WHERE id = v_inv.id;
  SELECT coalesce(nullif(display_name,''), nickname, 'Un coleg') INTO v_name FROM public.profiles WHERE user_id = v_uid;
  INSERT INTO public.notifications(user_id, title, body) VALUES
    (v_class.teacher_id, 'Co-profesor nou', v_name || ' predă acum împreună cu tine la clasa ' || v_class.name || '.'),
    (v_uid, 'Ai fost adăugat ca co-profesor', 'Poți vedea elevii, da teme și nota testele la clasa ' || v_class.name || '.');
  RETURN jsonb_build_object('class_id', v_class.id, 'name', v_class.name);
END; $$;

CREATE OR REPLACE FUNCTION public.remove_co_teacher(p_class_id uuid, p_teacher_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  IF NOT (public.is_class_owner(p_class_id, auth.uid()) OR p_teacher_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.class_co_teachers WHERE class_id = p_class_id AND teacher_id = p_teacher_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT name INTO v_name FROM public.teacher_classes WHERE id = p_class_id;
  IF p_teacher_id = auth.uid() THEN
    INSERT INTO public.notifications(user_id, title, body)
    SELECT teacher_id, 'Co-profesor plecat', 'Un co-profesor a părăsit clasa ' || name || '.' FROM public.teacher_classes WHERE id = p_class_id;
  ELSE
    INSERT INTO public.notifications(user_id, title, body)
    VALUES (p_teacher_id, 'Nu mai ești co-profesor', 'Ai fost eliminat de la clasa ' || coalesce(v_name,'') || '.');
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.get_class_teachers(p_class_id uuid)
RETURNS TABLE(user_id uuid, display_name text, role text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tc.teacher_id, p.display_name, 'owner'::text
  FROM public.teacher_classes tc LEFT JOIN public.profiles p ON p.user_id = tc.teacher_id
  WHERE tc.id = p_class_id AND public.is_class_teacher(p_class_id, auth.uid())
  UNION ALL
  SELECT c.teacher_id, p.display_name, 'co'::text
  FROM public.class_co_teachers c LEFT JOIN public.profiles p ON p.user_id = c.teacher_id
  WHERE c.class_id = p_class_id AND public.is_class_teacher(p_class_id, auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.create_co_teacher_invite(uuid), public.accept_co_teacher_invite(text), public.remove_co_teacher(uuid, uuid), public.get_class_teachers(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_co_teacher_invite(uuid), public.accept_co_teacher_invite(text), public.remove_co_teacher(uuid, uuid), public.get_class_teachers(uuid) TO authenticated;