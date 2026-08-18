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

  IF auth.uid() IS NOT NULL THEN
    -- Progresul se acordă exclusiv prin award_progress / record_activity,
    -- inclusiv pentru administratori (clienți vechi pot trimite XP local umflat).
    NEW.xp := OLD.xp;
    NEW.streak := OLD.streak;
    NEW.best_streak := OLD.best_streak;

    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.is_premium := OLD.is_premium;
      NEW.is_teacher := OLD.is_teacher;
      NEW.teacher_status := OLD.teacher_status;
      NEW.premium_manual := OLD.premium_manual;
      NEW.premium_manual_until := OLD.premium_manual_until;
      NEW.premium_manual_by := OLD.premium_manual_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_recompute_xp(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old integer;
  v_new integer;
BEGIN
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT xp INTO v_old FROM public.profiles WHERE user_id = p_user_id;
  IF v_old IS NULL THEN
    RAISE EXCEPTION 'Profil inexistent';
  END IF;

  SELECT coalesce(sum(
    CASE
      WHEN c.lesson_id LIKE 'problem-%' THEN coalesce(pr.xp_reward, 0)
      ELSE coalesce(l.xp_reward, 0)
    END
  ), 0)::integer
  INTO v_new
  FROM public.completed_lessons c
  LEFT JOIN public.lessons l ON l.id = c.lesson_id
  LEFT JOIN public.problems pr ON 'problem-' || pr.id = c.lesson_id
  WHERE c.user_id = p_user_id;

  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles SET xp = v_new WHERE user_id = p_user_id;
  PERFORM set_config('app.bypass_profile_protection', 'false', true);

  RETURN jsonb_build_object('old_xp', v_old, 'new_xp', v_new);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_recompute_xp(uuid) TO authenticated;

-- Corectăm imediat contul afectat: XP-ul real din finalizări.
DO $$
DECLARE v_uid uuid := 'e66e2524-f661-44fa-9d73-fa22ea9d04a1'; v_new integer;
BEGIN
  SELECT coalesce(sum(CASE WHEN c.lesson_id LIKE 'problem-%' THEN coalesce(pr.xp_reward,0) ELSE coalesce(l.xp_reward,0) END),0)::integer
  INTO v_new
  FROM public.completed_lessons c
  LEFT JOIN public.lessons l ON l.id = c.lesson_id
  LEFT JOIN public.problems pr ON 'problem-'||pr.id = c.lesson_id
  WHERE c.user_id = v_uid;

  PERFORM set_config('app.bypass_profile_protection','true',true);
  UPDATE public.profiles SET xp = v_new WHERE user_id = v_uid;
  PERFORM set_config('app.bypass_profile_protection','false',true);
END $$;