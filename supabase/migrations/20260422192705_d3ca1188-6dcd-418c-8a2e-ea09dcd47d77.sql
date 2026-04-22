
ALTER TABLE public.test_assignments
  ADD COLUMN window_minutes integer DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.get_test_items_for_student(p_assignment_id uuid, p_variant text)
 RETURNS TABLE(id uuid, test_id uuid, sort_order integer, source_type text, source_id text, points integer, question text, item_type text, options jsonb, blanks jsonb, lines jsonb, pairs jsonb, statement text, code_template text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_test_id uuid;
  v_assignment record;
BEGIN
  -- Get assignment with test_id and window check
  SELECT ta.test_id, ta.assigned_at, ta.window_minutes
  INTO v_assignment
  FROM public.test_assignments ta
  JOIN public.class_members cm ON cm.class_id = ta.class_id
  WHERE ta.id = p_assignment_id AND cm.student_id = auth.uid();
  
  IF v_assignment IS NULL THEN
    RETURN;
  END IF;

  -- Check if test window has expired
  IF v_assignment.window_minutes IS NOT NULL
     AND v_assignment.assigned_at + (v_assignment.window_minutes || ' minutes')::interval < now()
  THEN
    RETURN; -- test expired, return nothing
  END IF;

  v_test_id := v_assignment.test_id;

  RETURN QUERY
  SELECT 
    ti.id,
    ti.test_id,
    ti.sort_order,
    ti.source_type,
    ti.source_id,
    ti.points,
    CASE 
      WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'question')::text
      ELSE NULL
    END as question,
    CASE 
      WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'type')::text
      ELSE NULL
    END as item_type,
    CASE 
      WHEN ti.source_type = 'custom' THEN ti.custom_data->'options'
      ELSE NULL
    END as options,
    CASE 
      WHEN ti.source_type = 'custom' THEN ti.custom_data->'blanks'
      ELSE NULL
    END as blanks,
    CASE 
      WHEN ti.source_type = 'custom' THEN ti.custom_data->'lines'
      ELSE NULL
    END as lines,
    CASE 
      WHEN ti.source_type = 'custom' THEN ti.custom_data->'pairs'
      ELSE NULL
    END as pairs,
    CASE 
      WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'statement')::text
      ELSE NULL
    END as statement,
    CASE 
      WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'code_template')::text
      ELSE NULL
    END as code_template
  FROM public.test_items ti
  WHERE ti.test_id = v_test_id
    AND (ti.variant = p_variant OR ti.variant = 'both')
  ORDER BY ti.sort_order;
END;
$function$;
