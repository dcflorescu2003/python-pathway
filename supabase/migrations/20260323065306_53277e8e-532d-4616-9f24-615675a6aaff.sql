
-- Content tables for chapters, lessons, exercises
CREATE TABLE public.chapters (
  id text PRIMARY KEY,
  number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '📘',
  color text NOT NULL DEFAULT '200 100% 50%',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id text PRIMARY KEY,
  chapter_id text NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 20,
  is_premium boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.exercises (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('quiz', 'fill', 'order', 'truefalse')),
  question text NOT NULL,
  options jsonb,
  correct_option_id text,
  code_template text,
  blanks jsonb,
  lines jsonb,
  statement text,
  is_true boolean,
  explanation text,
  xp integer NOT NULL DEFAULT 5,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.problem_chapters (
  id text PRIMARY KEY,
  title text NOT NULL,
  icon text NOT NULL DEFAULT '📘'
);

CREATE TABLE public.problems (
  id text PRIMARY KEY,
  chapter_id text NOT NULL REFERENCES public.problem_chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'ușor',
  xp_reward integer NOT NULL DEFAULT 10,
  test_cases jsonb NOT NULL DEFAULT '[]'::jsonb,
  hint text,
  solution text NOT NULL DEFAULT ''
);

-- RLS: SELECT for all authenticated, mutations restricted
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- SELECT policies - allow all authenticated users
CREATE POLICY "Authenticated users can read chapters" ON public.chapters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read exercises" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read problem_chapters" ON public.problem_chapters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read problems" ON public.problems FOR SELECT TO authenticated USING (true);
