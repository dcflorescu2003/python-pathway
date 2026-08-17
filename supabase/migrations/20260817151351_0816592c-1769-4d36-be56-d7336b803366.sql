-- Remove unrestricted student UPDATE access on grading tables.
DROP POLICY IF EXISTS "Students can update own submissions" ON public.test_submissions;
DROP POLICY IF EXISTS "Students can update own answers" ON public.test_answers;

-- Defense in depth: block grading columns from being changed by anyone
-- other than teachers/owners of the test or the service role (grader).
CREATE OR REPLACE FUNCTION public.protect_submission_grading_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_teacher boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / internal grader
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.test_assignments ta
    JOIN public.tests t ON t.id = ta.test_id
    WHERE ta.id = NEW.assignment_id AND t.teacher_id = auth.uid()
  ) INTO is_teacher;

  IF is_teacher THEN
    RETURN NEW;
  END IF;

  NEW.total_score := OLD.total_score;
  NEW.max_score := OLD.max_score;
  NEW.auto_graded := OLD.auto_graded;
  NEW.late_submission := OLD.late_submission;
  NEW.student_id := OLD.student_id;
  NEW.assignment_id := OLD.assignment_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_submission_grading_columns_trg ON public.test_submissions;
CREATE TRIGGER protect_submission_grading_columns_trg
BEFORE UPDATE ON public.test_submissions
FOR EACH ROW EXECUTE FUNCTION public.protect_submission_grading_columns();

CREATE OR REPLACE FUNCTION public.protect_answer_grading_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_teacher boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.test_submissions ts
    JOIN public.test_assignments ta ON ta.id = ts.assignment_id
    JOIN public.tests t ON t.id = ta.test_id
    WHERE ts.id = NEW.submission_id AND t.teacher_id = auth.uid()
  ) INTO is_teacher;

  IF is_teacher THEN
    RETURN NEW;
  END IF;

  NEW.score := OLD.score;
  NEW.max_points := OLD.max_points;
  NEW.feedback := OLD.feedback;
  NEW.ai_reviewed := OLD.ai_reviewed;
  NEW.submission_id := OLD.submission_id;
  NEW.test_item_id := OLD.test_item_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_answer_grading_columns_trg ON public.test_answers;
CREATE TRIGGER protect_answer_grading_columns_trg
BEFORE UPDATE ON public.test_answers
FOR EACH ROW EXECUTE FUNCTION public.protect_answer_grading_columns();