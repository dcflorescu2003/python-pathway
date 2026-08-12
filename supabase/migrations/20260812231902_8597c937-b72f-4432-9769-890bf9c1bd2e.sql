ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_manual_until timestamptz,
  ADD COLUMN IF NOT EXISTS premium_manual_by uuid;

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.bypass_profile_protection', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_premium := OLD.is_premium;
    NEW.is_teacher := OLD.is_teacher;
    NEW.teacher_status := OLD.teacher_status;
    NEW.premium_manual := OLD.premium_manual;
    NEW.premium_manual_until := OLD.premium_manual_until;
    NEW.premium_manual_by := OLD.premium_manual_by;
    -- Anti-fraudă: progresul se acordă exclusiv prin award_progress / record_activity
    NEW.xp := OLD.xp;
    NEW.streak := OLD.streak;
    NEW.best_streak := OLD.best_streak;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_premium(p_user_id uuid, p_premium boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  PERFORM set_config('app.bypass_profile_protection', 'true', true);

  IF p_premium THEN
    UPDATE public.profiles
    SET is_premium = true,
        premium_manual = true,
        premium_manual_until = NULL,
        premium_manual_by = auth.uid()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET is_premium = false,
        premium_manual = false,
        premium_manual_until = NULL,
        premium_manual_by = NULL
    WHERE user_id = p_user_id;
  END IF;
END;
$function$;