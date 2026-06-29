-- Enforce single-class membership per student
ALTER TABLE public.class_members
  ADD CONSTRAINT class_members_student_id_unique UNIQUE (student_id);

-- Update join RPC to give clear error when student is already in another class
CREATE OR REPLACE FUNCTION public.join_class_with_code(p_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_class record;
  v_uid uuid := auth.uid();
  v_existing_class uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT tc.id, tc.name, tc.join_code
    INTO v_class
  FROM public.teacher_classes tc
  WHERE tc.join_code = upper(trim(p_code))
  LIMIT 1;

  IF v_class.id IS NULL THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;

  -- Check if student is already in another class
  SELECT cm.class_id INTO v_existing_class
  FROM public.class_members cm
  WHERE cm.student_id = v_uid
  LIMIT 1;

  IF v_existing_class IS NOT NULL AND v_existing_class <> v_class.id THEN
    RAISE EXCEPTION 'Already enrolled in another class';
  END IF;

  INSERT INTO public.class_members (class_id, student_id)
  VALUES (v_class.id, v_uid)
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT v_class.id, v_class.name;
END;
$function$;