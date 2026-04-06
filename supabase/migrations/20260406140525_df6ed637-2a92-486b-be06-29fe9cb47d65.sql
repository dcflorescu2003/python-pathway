ALTER TABLE public.manual_exercises
  ADD COLUMN test_cases jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN hint text,
  ADD COLUMN solution text NOT NULL DEFAULT '';