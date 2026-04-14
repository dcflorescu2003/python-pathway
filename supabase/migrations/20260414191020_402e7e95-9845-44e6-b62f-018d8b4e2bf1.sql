ALTER TABLE public.test_assignments
  ADD COLUMN IF NOT EXISTS scores_released boolean NOT NULL DEFAULT false;

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS ai_grading_item_ids text[] NOT NULL DEFAULT '{}';