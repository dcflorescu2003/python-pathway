ALTER TABLE public.problem_chapters ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.problems ADD COLUMN sort_order integer NOT NULL DEFAULT 0;