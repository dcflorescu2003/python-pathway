
CREATE OR REPLACE FUNCTION public.get_submission_review(p_submission_id uuid)
RETURNS TABLE(
  answer_id uuid,
  test_item_id uuid,
  sort_order integer,
  score numeric,
  max_points numeric,
  feedback text,
  answer_data jsonb,
  source_type text,
  item_type text,
  question text,
  statement text,
  options jsonb,
  correct_option_id text,
  is_true boolean,
  blanks jsonb,
  lines jsonb,
  correct_answer text,
  code_template text,
  explanation text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sub record;
  v_scores_released boolean;
  v_is_owner boolean;
  v_is_teacher boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT ts.student_id, ts.submitted_at, ta.scores_released, t.teacher_id
    INTO v_sub
  FROM public.test_submissions ts
  JOIN public.test_assignments ta ON ta.id = ts.assignment_id
  JOIN public.tests t ON t.id = ta.test_id
  WHERE ts.id = p_submission_id;

  IF v_sub IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;

  v_is_owner := (v_sub.student_id = v_uid);
  v_is_teacher := (v_sub.teacher_id = v_uid) OR has_role(v_uid, 'admin'::app_role);
  v_scores_released := COALESCE(v_sub.scores_released, false);

  IF NOT v_is_teacher THEN
    IF NOT v_is_owner THEN RAISE EXCEPTION 'Not authorized'; END IF;
    IF v_sub.submitted_at IS NULL THEN RAISE EXCEPTION 'Submission not finalized'; END IF;
    IF NOT v_scores_released THEN RAISE EXCEPTION 'Scores not released'; END IF;
  END IF;

  RETURN QUERY
  SELECT
    ta.id AS answer_id,
    ti.id AS test_item_id,
    ti.sort_order,
    ta.score,
    COALESCE(ta.max_points, ti.points) AS max_points,
    ta.feedback,
    ta.answer_data,
    ti.source_type,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->>'type' END,
      ee.type,
      CASE WHEN ti.source_type = 'problem' THEN 'problem' END
    ) AS item_type,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->>'question' END,
      ee.question
    ) AS question,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->>'statement' END,
      ee.statement
    ) AS statement,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->'options' END,
      ee.options
    ) AS options,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->>'correct_option_id' END,
      ee.correct_option_id
    ) AS correct_option_id,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' AND (ti.custom_data ? 'is_true') THEN (ti.custom_data->>'is_true')::boolean END,
      ee.is_true
    ) AS is_true,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->'blanks' END,
      ee.blanks
    ) AS blanks,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->'lines' END,
      ee.lines
    ) AS lines,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->>'correct_answer' END,
      NULL
    ) AS correct_answer,
    COALESCE(
      CASE WHEN ti.source_type = 'custom' THEN ti.custom_data->>'code_template' END,
      ee.code_template
    ) AS code_template,
    ee.explanation
  FROM public.test_answers ta
  JOIN public.test_items ti ON ti.id = ta.test_item_id
  LEFT JOIN public.eval_exercises ee
    ON ti.source_type = 'exercise' AND ee.id = ti.source_id
  WHERE ta.submission_id = p_submission_id
  ORDER BY ti.sort_order;
END;
$$;

REVOKE ALL ON FUNCTION public.get_submission_review(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_submission_review(uuid) TO authenticated;
