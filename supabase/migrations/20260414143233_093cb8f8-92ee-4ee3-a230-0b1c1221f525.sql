
-- Capitole din banca de evaluare
CREATE TABLE public.eval_chapters (
  id text PRIMARY KEY,
  title text NOT NULL,
  icon text NOT NULL DEFAULT '📝',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.eval_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage eval_chapters" ON public.eval_chapters
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read eval_chapters" ON public.eval_chapters
  FOR SELECT TO authenticated
  USING (true);

-- Lecții din banca de evaluare
CREATE TABLE public.eval_lessons (
  id text PRIMARY KEY,
  chapter_id text NOT NULL REFERENCES eval_chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.eval_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage eval_lessons" ON public.eval_lessons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read eval_lessons" ON public.eval_lessons
  FOR SELECT TO authenticated
  USING (true);

-- Exerciții din banca de evaluare
CREATE TABLE public.eval_exercises (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES eval_lessons(id) ON DELETE CASCADE,
  type text NOT NULL,
  question text NOT NULL,
  options jsonb,
  correct_option_id text,
  blanks jsonb,
  lines jsonb,
  statement text,
  is_true boolean,
  explanation text,
  sort_order integer NOT NULL DEFAULT 0
);

-- Use a validation trigger instead of CHECK constraint for type
CREATE OR REPLACE FUNCTION public.validate_eval_exercise_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type NOT IN ('quiz', 'fill', 'order', 'truefalse') THEN
    RAISE EXCEPTION 'eval_exercises type must be quiz, fill, order, or truefalse';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_eval_exercise_type_trigger
  BEFORE INSERT OR UPDATE ON public.eval_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_eval_exercise_type();

ALTER TABLE public.eval_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage eval_exercises" ON public.eval_exercises
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read eval_exercises" ON public.eval_exercises
  FOR SELECT TO authenticated
  USING (true);

-- Teste predefinite
CREATE TABLE public.predefined_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'mediu',
  time_limit_minutes integer,
  variant_mode text NOT NULL DEFAULT 'shuffle',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.predefined_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage predefined_tests" ON public.predefined_tests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read predefined_tests" ON public.predefined_tests
  FOR SELECT TO authenticated
  USING (true);

-- Itemii testelor predefinite
CREATE TABLE public.predefined_test_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES predefined_tests(id) ON DELETE CASCADE,
  variant text NOT NULL DEFAULT 'both',
  sort_order integer NOT NULL DEFAULT 0,
  source_type text NOT NULL,
  source_id text,
  custom_data jsonb,
  points integer NOT NULL DEFAULT 10
);

ALTER TABLE public.predefined_test_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage predefined_test_items" ON public.predefined_test_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read predefined_test_items" ON public.predefined_test_items
  FOR SELECT TO authenticated
  USING (true);
