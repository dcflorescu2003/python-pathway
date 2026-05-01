
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_life_refill_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_comeback_shown_at date,
  ADD COLUMN IF NOT EXISTS last_evening_reminder_at date,
  ADD COLUMN IF NOT EXISTS last_weekly_reminder_at date,
  ADD COLUMN IF NOT EXISTS last_teacher_reminder_at date,
  ADD COLUMN IF NOT EXISTS lives_refilled_dialog_shown_at date;

CREATE OR REPLACE FUNCTION public.mark_lives_refilled()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (OLD.lives IS DISTINCT FROM NEW.lives) AND NEW.lives = 5 AND COALESCE(OLD.lives, 0) < 5 THEN
    NEW.last_life_refill_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_mark_lives_refilled ON public.profiles;
CREATE TRIGGER profiles_mark_lives_refilled
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.mark_lives_refilled();
