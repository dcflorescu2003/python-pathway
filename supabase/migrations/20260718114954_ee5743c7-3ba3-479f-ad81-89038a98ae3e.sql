
-- 1) Persistent roster number on each submission
ALTER TABLE public.test_submissions
  ADD COLUMN IF NOT EXISTS roster_number integer;

-- 2) New combined RPC: returns both variant and roster number for the caller
CREATE OR REPLACE FUNCTION public.get_assigned_slot_for_student(p_assignment_id uuid)
RETURNS TABLE(variant text, roster_number integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_class_id uuid;
  v_index int;
BEGIN
  IF v_uid IS NULL THEN
    variant := 'A'; roster_number := NULL; RETURN NEXT; RETURN;
  END IF;

  SELECT ta.class_id INTO v_class_id
  FROM public.test_assignments ta
  WHERE ta.id = p_assignment_id;

  IF v_class_id IS NULL THEN
    variant := 'A'; roster_number := NULL; RETURN NEXT; RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = v_class_id AND student_id = v_uid
  ) THEN
    variant := 'A'; roster_number := NULL; RETURN NEXT; RETURN;
  END IF;

  WITH roster AS (
    SELECT
      cm.student_id,
      row_number() OVER (
        ORDER BY
          lower(unaccent(coalesce(nullif(btrim(p.last_name), ''), btrim(coalesce(p.display_name, 'Elev'))))) ASC,
          cm.student_id ASC
      ) AS idx
    FROM public.class_members cm
    LEFT JOIN public.profiles p ON p.user_id = cm.student_id
    WHERE cm.class_id = v_class_id
  )
  SELECT idx INTO v_index FROM roster WHERE student_id = v_uid;

  IF v_index IS NULL THEN
    variant := 'A'; roster_number := NULL; RETURN NEXT; RETURN;
  END IF;

  variant := CASE WHEN ((v_index - 1) % 2) = 0 THEN 'A' ELSE 'B' END;
  roster_number := v_index;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_assigned_slot_for_student(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_assigned_slot_for_student(uuid) TO authenticated;

-- 3) Teacher-facing RPC: full allocation list for an assignment
CREATE OR REPLACE FUNCTION public.get_test_roster_allocations(p_assignment_id uuid)
RETURNS TABLE(
  student_id uuid,
  display_name text,
  first_name text,
  last_name text,
  roster_number integer,
  variant text,
  status text,
  submitted_at timestamptz,
  submission_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_class_id uuid;
  v_teacher_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT ta.class_id, t.teacher_id
    INTO v_class_id, v_teacher_id
  FROM public.test_assignments ta
  JOIN public.tests t ON t.id = ta.test_id
  WHERE ta.id = p_assignment_id;

  IF v_class_id IS NULL THEN RAISE EXCEPTION 'Assignment not found'; END IF;

  IF v_teacher_id <> v_uid AND NOT has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH roster AS (
    SELECT
      cm.student_id,
      p.display_name,
      p.first_name,
      p.last_name,
      row_number() OVER (
        ORDER BY
          lower(unaccent(coalesce(nullif(btrim(p.last_name), ''), btrim(coalesce(p.display_name, 'Elev'))))) ASC,
          cm.student_id ASC
      )::integer AS idx
    FROM public.class_members cm
    LEFT JOIN public.profiles p ON p.user_id = cm.student_id
    WHERE cm.class_id = v_class_id
  )
  SELECT
    r.student_id,
    r.display_name,
    r.first_name,
    r.last_name,
    COALESCE(ts.roster_number, r.idx) AS roster_number,
    COALESCE(ts.variant, CASE WHEN ((r.idx - 1) % 2) = 0 THEN 'A' ELSE 'B' END) AS variant,
    COALESCE(
      CASE WHEN ts.submitted_at IS NOT NULL THEN 'submitted' ELSE ts.status END,
      'not_started'
    ) AS status,
    ts.submitted_at,
    ts.id AS submission_id
  FROM roster r
  LEFT JOIN public.test_submissions ts
    ON ts.assignment_id = p_assignment_id AND ts.student_id = r.student_id
  ORDER BY r.idx;
END;
$$;

REVOKE ALL ON FUNCTION public.get_test_roster_allocations(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_test_roster_allocations(uuid) TO authenticated;
