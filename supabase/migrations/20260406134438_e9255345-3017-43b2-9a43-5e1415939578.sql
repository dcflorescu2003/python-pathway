CREATE TABLE public.manual_lessons (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read manual_lessons" ON public.manual_lessons
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert manual_lessons" ON public.manual_lessons
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update manual_lessons" ON public.manual_lessons
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete manual_lessons" ON public.manual_lessons
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.manual_exercises (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES public.manual_lessons(id) ON DELETE CASCADE,
  type text NOT NULL,
  question text NOT NULL,
  options jsonb,
  correct_option_id text,
  code_template text,
  blanks jsonb,
  lines jsonb,
  statement text,
  is_true boolean,
  explanation text,
  pairs jsonb,
  xp integer NOT NULL DEFAULT 5,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.manual_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read manual_exercises" ON public.manual_exercises
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert manual_exercises" ON public.manual_exercises
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update manual_exercises" ON public.manual_exercises
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete manual_exercises" ON public.manual_exercises
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));