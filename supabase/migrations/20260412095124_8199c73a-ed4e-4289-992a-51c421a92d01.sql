
-- Phase 1: Add teacher_status column
ALTER TABLE public.profiles ADD COLUMN teacher_status text DEFAULT null;

-- Migrate existing teachers
UPDATE public.profiles SET teacher_status = 'verified' WHERE is_teacher = true;

-- Phase 2: Update lives system
ALTER TABLE public.profiles ALTER COLUMN lives SET DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN lives_updated_at timestamptz DEFAULT now();

-- Update all existing users to 5 lives and set lives_updated_at
UPDATE public.profiles SET lives_updated_at = now() WHERE lives_updated_at IS NULL;

-- Create helper function for verified teacher check
CREATE OR REPLACE FUNCTION public.is_verified_teacher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND teacher_status = 'verified'
  );
$$;

-- Update the trigger to also protect teacher_status
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_premium := OLD.is_premium;
    NEW.is_teacher := OLD.is_teacher;
    NEW.teacher_status := OLD.teacher_status;
  END IF;
  RETURN NEW;
END;
$$;
