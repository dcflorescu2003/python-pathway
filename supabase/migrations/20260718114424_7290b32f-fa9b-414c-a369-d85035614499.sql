
CREATE OR REPLACE FUNCTION public.get_assigned_variant_for_student(p_assignment_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_class_id uuid;
  v_index int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 'A';
  END IF;

  SELECT ta.class_id INTO v_class_id
  FROM public.test_assignments ta
  WHERE ta.id = p_assignment_id;

  IF v_class_id IS NULL THEN
    RETURN 'A';
  END IF;

  -- Verify caller is a member of the class
  IF NOT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = v_class_id AND student_id = v_uid
  ) THEN
    RETURN 'A';
  END IF;

  WITH roster AS (
    SELECT
      cm.student_id,
      row_number() OVER (
        ORDER BY
          lower(unaccent(coalesce(nullif(btrim(p.last_name), ''), btrim(coalesce(p.display_name, 'Elev'))))) ASC,
          cm.student_id ASC
      ) - 1 AS idx
    FROM public.class_members cm
    LEFT JOIN public.profiles p ON p.user_id = cm.student_id
    WHERE cm.class_id = v_class_id
  )
  SELECT idx INTO v_index FROM roster WHERE student_id = v_uid;

  IF v_index IS NULL THEN
    RETURN 'A';
  END IF;

  RETURN CASE WHEN (v_index % 2) = 0 THEN 'A' ELSE 'B' END;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_assigned_variant_for_student(uuid) TO authenticated;
