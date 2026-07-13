
-- 1. New columns on test_submissions
ALTER TABLE public.test_submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS draft_answers jsonb,
  ADD COLUMN IF NOT EXISTS draft_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS leave_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_submission boolean NOT NULL DEFAULT false;

-- Backfill status for existing rows
UPDATE public.test_submissions
   SET status = 'submitted'
 WHERE submitted_at IS NOT NULL AND status = 'in_progress';

-- 2. anti_cheat_mode on tests
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS anti_cheat_mode text NOT NULL DEFAULT 'normal';

-- 3. RPC: save draft answers server-side (student only, own in-progress submission)
CREATE OR REPLACE FUNCTION public.save_submission_draft(
  p_submission_id uuid,
  p_answers jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT student_id, submitted_at, status
    INTO v_sub
    FROM public.test_submissions
   WHERE id = p_submission_id;

  IF v_sub IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF v_sub.student_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_sub.submitted_at IS NOT NULL THEN RAISE EXCEPTION 'Already submitted'; END IF;

  UPDATE public.test_submissions
     SET draft_answers = p_answers,
         draft_updated_at = now()
   WHERE id = p_submission_id;
END;
$$;

-- 4. RPC: mark own submission as interrupted (safe from client)
CREATE OR REPLACE FUNCTION public.mark_submission_interrupted(
  p_submission_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT student_id, submitted_at, status
    INTO v_sub
    FROM public.test_submissions
   WHERE id = p_submission_id;

  IF v_sub IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF v_sub.student_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_sub.submitted_at IS NOT NULL THEN RETURN; END IF;

  UPDATE public.test_submissions
     SET status = 'interrupted'
   WHERE id = p_submission_id AND status <> 'submitted';
END;
$$;

-- 5. RPC: increment leave counter (client can only increment its own)
CREATE OR REPLACE FUNCTION public.increment_leave_count(
  p_submission_id uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_new_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT student_id, submitted_at
    INTO v_sub
    FROM public.test_submissions
   WHERE id = p_submission_id;

  IF v_sub IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF v_sub.student_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_sub.submitted_at IS NOT NULL THEN RETURN 0; END IF;

  UPDATE public.test_submissions
     SET leave_count = leave_count + 1
   WHERE id = p_submission_id
  RETURNING leave_count INTO v_new_count;

  RETURN v_new_count;
END;
$$;

-- 6. RPC: teacher allows student to RESUME an interrupted submission
--    (keeps started_at, draft_answers, leave_count; clears status to in_progress)
CREATE OR REPLACE FUNCTION public.resume_interrupted_submission(
  p_submission_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid;
  v_sub record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT ts.submitted_at, ts.status, t.teacher_id
    INTO v_sub
    FROM public.test_submissions ts
    JOIN public.test_assignments ta ON ta.id = ts.assignment_id
    JOIN public.tests t ON t.id = ta.test_id
   WHERE ts.id = p_submission_id;

  IF v_sub IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF v_sub.teacher_id <> auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_sub.submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Submission already finalized — use restart instead';
  END IF;

  UPDATE public.test_submissions
     SET status = 'in_progress'
   WHERE id = p_submission_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_submission_draft(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_submission_interrupted(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_leave_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_interrupted_submission(uuid) TO authenticated;
