CREATE TABLE public.skip_unlocked_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.skip_unlocked_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skip unlocks"
  ON public.skip_unlocked_lessons
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skip unlocks"
  ON public.skip_unlocked_lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_skip_unlocked_lessons_user ON public.skip_unlocked_lessons(user_id);