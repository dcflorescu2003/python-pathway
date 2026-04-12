
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service role (auth.uid() is null) and admin users to modify privileged columns
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_premium := OLD.is_premium;
    NEW.is_teacher := OLD.is_teacher;
    NEW.teacher_status := OLD.teacher_status;
  END IF;
  RETURN NEW;
END;
$function$;
