
CREATE OR REPLACE FUNCTION public.deactivate_teacher_mode()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = v_uid AND is_teacher = true
  ) THEN
    RAISE EXCEPTION 'Not a teacher';
  END IF;

  -- Delete test answers for submissions on this teacher's tests
  DELETE FROM public.test_answers
  WHERE submission_id IN (
    SELECT ts.id FROM public.test_submissions ts
    JOIN public.test_assignments ta ON ta.id = ts.assignment_id
    JOIN public.tests t ON t.id = ta.test_id
    WHERE t.teacher_id = v_uid
  );

  -- Delete test submissions
  DELETE FROM public.test_submissions
  WHERE assignment_id IN (
    SELECT ta.id FROM public.test_assignments ta
    JOIN public.tests t ON t.id = ta.test_id
    WHERE t.teacher_id = v_uid
  );

  -- Delete test items and assignments
  DELETE FROM public.test_items WHERE test_id IN (SELECT id FROM public.tests WHERE teacher_id = v_uid);
  DELETE FROM public.test_assignments WHERE test_id IN (SELECT id FROM public.tests WHERE teacher_id = v_uid);
  DELETE FROM public.tests WHERE teacher_id = v_uid;

  -- Delete challenges and class members, then classes
  DELETE FROM public.challenges WHERE class_id IN (SELECT id FROM public.teacher_classes WHERE teacher_id = v_uid);
  DELETE FROM public.class_members WHERE class_id IN (SELECT id FROM public.teacher_classes WHERE teacher_id = v_uid);
  DELETE FROM public.teacher_classes WHERE teacher_id = v_uid;

  -- Delete verification messages before requests
  DELETE FROM public.teacher_verification_messages
  WHERE request_id IN (SELECT id FROM public.teacher_verification_requests WHERE user_id = v_uid);
  DELETE FROM public.teacher_verification_requests WHERE user_id = v_uid;

  -- Delete referral codes
  DELETE FROM public.teacher_referral_codes WHERE teacher_id = v_uid;

  -- Reset profile
  UPDATE public.profiles
  SET teacher_status = NULL, is_teacher = false, verification_method = NULL
  WHERE user_id = v_uid;
END;
$function$;
