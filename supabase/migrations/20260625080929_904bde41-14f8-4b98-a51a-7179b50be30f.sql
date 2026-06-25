
-- Replace direct INSERT into class_members with a secure RPC that requires
-- the teacher's current join code. Students can no longer self-insert.

CREATE OR REPLACE FUNCTION public.join_class_with_code(p_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_class record;
  v_uid uuid := auth.uid();
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

  INSERT INTO public.class_members (class_id, student_id)
  VALUES (v_class.id, v_uid)
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT v_class.id, v_class.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_class_with_code(text) TO authenticated;

-- Remove the permissive student INSERT policy. Students must now use the RPC,
-- which validates the join code server-side before adding membership.
DROP POLICY IF EXISTS "Students can join classes" ON public.class_members;
