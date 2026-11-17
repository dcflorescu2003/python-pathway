CREATE OR REPLACE FUNCTION public.get_student_competency_coverage(p_user_id uuid)
RETURNS TABLE(specific_id uuid, lessons_total bigint, lessons_done bigint, problems_total bigint, problems_done bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF auth.uid() <> p_user_id
     AND NOT can_teacher_view_student(auth.uid(), p_user_id)
     AND NOT has_role(auth.uid(), 'admin'::app_role)
  THEN RAISE EXCEPTION 'Not authorized'; END IF;

  RETURN QUERY
  WITH done AS (
    SELECT DISTINCT regexp_replace(cl.lesson_id, 'f$', '') AS lid
    FROM completed_lessons cl WHERE cl.user_id = p_user_id
  ),
  les AS (
    SELECT DISTINCT mc.specific_id AS sid, e.lesson_id AS lid
    FROM item_competencies ic
    JOIN microcompetencies mc ON mc.id = ic.microcompetency_id
    JOIN exercises e ON e.id = ic.item_id
    WHERE ic.item_type = 'exercise'
  ),
  prb AS (
    SELECT DISTINCT mc.specific_id AS sid, ic.item_id AS pid
    FROM item_competencies ic
    JOIN microcompetencies mc ON mc.id = ic.microcompetency_id
    WHERE ic.item_type = 'problem'
  ),
  ls AS (
    SELECT les.sid, count(*) AS t, count(*) FILTER (WHERE EXISTS (SELECT 1 FROM done d WHERE d.lid = les.lid)) AS dn
    FROM les GROUP BY les.sid
  ),
  ps AS (
    SELECT prb.sid, count(*) AS t, count(*) FILTER (WHERE EXISTS (SELECT 1 FROM done d WHERE d.lid = 'problem-' || prb.pid)) AS dn
    FROM prb GROUP BY prb.sid
  )
  SELECT s.id, COALESCE(ls.t,0), COALESCE(ls.dn,0), COALESCE(ps.t,0), COALESCE(ps.dn,0)
  FROM competencies_specific s
  LEFT JOIN ls ON ls.sid = s.id
  LEFT JOIN ps ON ps.sid = s.id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_student_competency_coverage(uuid) TO authenticated;