CREATE TABLE public.competencies_general (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.competencies_specific (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  general_id uuid NOT NULL REFERENCES public.competencies_general(id) ON DELETE CASCADE,
  grade smallint NOT NULL DEFAULT 9,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_competencies_specific_general ON public.competencies_specific(general_id);
CREATE INDEX idx_competencies_specific_grade ON public.competencies_specific(grade);

CREATE TABLE public.microcompetencies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  specific_id uuid NOT NULL REFERENCES public.competencies_specific(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'A',
  grade smallint NOT NULL DEFAULT 9,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_microcompetencies_specific ON public.microcompetencies(specific_id);
CREATE INDEX idx_microcompetencies_category ON public.microcompetencies(category);
CREATE INDEX idx_microcompetencies_grade ON public.microcompetencies(grade);

CREATE TABLE public.item_competencies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type text NOT NULL,
  item_id text NOT NULL,
  microcompetency_id uuid NOT NULL REFERENCES public.microcompetencies(id) ON DELETE CASCADE,
  weight numeric(4,2) NOT NULL DEFAULT 1.00,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT item_competencies_item_type_check CHECK (item_type IN ('exercise','eval_exercise','manual_exercise','problem','test_item','predefined_test_item')),
  CONSTRAINT item_competencies_weight_check CHECK (weight > 0 AND weight <= 1),
  CONSTRAINT item_competencies_unique UNIQUE (item_type, item_id, microcompetency_id)
);
CREATE INDEX idx_item_competencies_item ON public.item_competencies(item_type, item_id);
CREATE INDEX idx_item_competencies_micro ON public.item_competencies(microcompetency_id);

CREATE TABLE public.student_competency_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  microcompetency_id uuid NOT NULL REFERENCES public.microcompetencies(id) ON DELETE CASCADE,
  attempts integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  score_sum numeric(10,2) NOT NULL DEFAULT 0,
  max_sum numeric(10,2) NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_competency_scores_unique UNIQUE (user_id, microcompetency_id)
);
CREATE INDEX idx_student_competency_scores_user ON public.student_competency_scores(user_id);

CREATE TABLE public.student_competency_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  manual_level numeric(3,2),
  note text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_competency_notes_target_type_check CHECK (target_type IN ('general','specific','microcompetency')),
  CONSTRAINT student_competency_notes_manual_level_check CHECK (manual_level IS NULL OR (manual_level >= 0 AND manual_level <= 1)),
  CONSTRAINT student_competency_notes_unique UNIQUE (student_id, teacher_id, target_type, target_id)
);
CREATE INDEX idx_student_competency_notes_student ON public.student_competency_notes(student_id);
CREATE INDEX idx_student_competency_notes_teacher ON public.student_competency_notes(teacher_id);

CREATE OR REPLACE FUNCTION public.can_teacher_view_student(p_teacher_id uuid, p_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members cm
    JOIN public.teacher_classes tc ON tc.id = cm.class_id
    WHERE cm.student_id = p_student_id AND tc.teacher_id = p_teacher_id
  );
$$;

CREATE OR REPLACE FUNCTION public.teacher_owns_test_item(p_teacher_id uuid, p_test_item_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.test_items ti
    JOIN public.tests t ON t.id = ti.test_id
    WHERE ti.id::text = p_test_item_id
      AND t.teacher_id = p_teacher_id
      AND ti.source_type = 'custom'
  );
$$;

ALTER TABLE public.competencies_general ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read competencies_general" ON public.competencies_general FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage competencies_general" ON public.competencies_general FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.competencies_specific ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read competencies_specific" ON public.competencies_specific FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage competencies_specific" ON public.competencies_specific FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.microcompetencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read microcompetencies" ON public.microcompetencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage microcompetencies" ON public.microcompetencies FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.item_competencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read item_competencies" ON public.item_competencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert any item_competencies" ON public.item_competencies FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update any item_competencies" ON public.item_competencies FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete any item_competencies" ON public.item_competencies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Teachers can insert competencies for own custom test items" ON public.item_competencies FOR INSERT TO authenticated WITH CHECK (item_type = 'test_item' AND teacher_owns_test_item(auth.uid(), item_id));
CREATE POLICY "Teachers can update competencies for own custom test items" ON public.item_competencies FOR UPDATE TO authenticated USING (item_type = 'test_item' AND teacher_owns_test_item(auth.uid(), item_id)) WITH CHECK (item_type = 'test_item' AND teacher_owns_test_item(auth.uid(), item_id));
CREATE POLICY "Teachers can delete competencies for own custom test items" ON public.item_competencies FOR DELETE TO authenticated USING (item_type = 'test_item' AND teacher_owns_test_item(auth.uid(), item_id));

ALTER TABLE public.student_competency_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own competency scores" ON public.student_competency_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Teachers view competency scores of own students" ON public.student_competency_scores FOR SELECT TO authenticated USING (can_teacher_view_student(auth.uid(), user_id));
CREATE POLICY "Admins view all competency scores" ON public.student_competency_scores FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.student_competency_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own notes" ON public.student_competency_notes FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Teachers manage notes for own students" ON public.student_competency_notes FOR ALL TO authenticated USING (auth.uid() = teacher_id AND can_teacher_view_student(auth.uid(), student_id)) WITH CHECK (auth.uid() = teacher_id AND can_teacher_view_student(auth.uid(), student_id));
CREATE POLICY "Admins view all notes" ON public.student_competency_notes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.recalculate_competency_scores(p_user_id uuid, p_items jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item record;
  v_mapping record;
  v_total_weight numeric;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to update scores for another user';
  END IF;

  FOR v_item IN
    SELECT (elem->>'item_type')::text AS item_type,
           (elem->>'item_id')::text AS item_id,
           COALESCE((elem->>'score')::numeric, 0) AS score,
           COALESCE((elem->>'max_score')::numeric, 0) AS max_score
    FROM jsonb_array_elements(p_items) AS elem
  LOOP
    SELECT COALESCE(SUM(weight), 0) INTO v_total_weight
    FROM public.item_competencies
    WHERE item_type = v_item.item_type AND item_id = v_item.item_id;

    IF v_total_weight = 0 THEN CONTINUE; END IF;

    FOR v_mapping IN
      SELECT microcompetency_id, weight FROM public.item_competencies
      WHERE item_type = v_item.item_type AND item_id = v_item.item_id
    LOOP
      INSERT INTO public.student_competency_scores (user_id, microcompetency_id, attempts, correct, score_sum, max_sum, last_updated)
      VALUES (
        p_user_id, v_mapping.microcompetency_id, 1,
        CASE WHEN v_item.max_score > 0 AND v_item.score >= v_item.max_score THEN 1 ELSE 0 END,
        v_item.score * (v_mapping.weight / v_total_weight),
        v_item.max_score * (v_mapping.weight / v_total_weight),
        now()
      )
      ON CONFLICT (user_id, microcompetency_id) DO UPDATE SET
        attempts = student_competency_scores.attempts + 1,
        correct = student_competency_scores.correct + CASE WHEN v_item.max_score > 0 AND v_item.score >= v_item.max_score THEN 1 ELSE 0 END,
        score_sum = student_competency_scores.score_sum + (v_item.score * (v_mapping.weight / v_total_weight)),
        max_sum = student_competency_scores.max_sum + (v_item.max_score * (v_mapping.weight / v_total_weight)),
        last_updated = now();
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_competency_profile(p_user_id uuid)
RETURNS TABLE (
  general_id uuid, general_code text, general_title text,
  specific_id uuid, specific_code text, specific_title text,
  attempts bigint, score_sum numeric, max_sum numeric, mastery numeric
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF auth.uid() <> p_user_id
     AND NOT can_teacher_view_student(auth.uid(), p_user_id)
     AND NOT has_role(auth.uid(), 'admin'::app_role)
  THEN RAISE EXCEPTION 'Not authorized to view this profile'; END IF;

  RETURN QUERY
  SELECT g.id, g.code, g.title, s.id, s.code, s.title,
    COALESCE(SUM(sc.attempts), 0)::bigint,
    COALESCE(SUM(sc.score_sum), 0)::numeric,
    COALESCE(SUM(sc.max_sum), 0)::numeric,
    CASE WHEN COALESCE(SUM(sc.max_sum), 0) > 0
         THEN (SUM(sc.score_sum) / SUM(sc.max_sum))::numeric
         ELSE NULL END
  FROM public.competencies_general g
  JOIN public.competencies_specific s ON s.general_id = g.id
  LEFT JOIN public.microcompetencies m ON m.specific_id = s.id
  LEFT JOIN public.student_competency_scores sc
    ON sc.microcompetency_id = m.id AND sc.user_id = p_user_id
  GROUP BY g.id, g.code, g.title, g.sort_order, s.id, s.code, s.title, s.sort_order
  ORDER BY g.sort_order, s.sort_order;
END;
$$;

CREATE TRIGGER update_student_competency_notes_updated_at
BEFORE UPDATE ON public.student_competency_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();