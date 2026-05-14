ALTER TABLE public.predefined_test_items ALTER COLUMN points TYPE numeric(6,2);
ALTER TABLE public.test_items ALTER COLUMN points TYPE numeric(6,2);
ALTER TABLE public.test_answers ALTER COLUMN score TYPE numeric(6,2);
ALTER TABLE public.test_answers ALTER COLUMN max_points TYPE numeric(6,2);
ALTER TABLE public.test_submissions ALTER COLUMN total_score TYPE numeric(8,2);
ALTER TABLE public.test_submissions ALTER COLUMN max_score TYPE numeric(8,2);
ALTER TABLE public.tests ALTER COLUMN office_points TYPE numeric(6,2);