CREATE POLICY "Teachers can update answers for their tests"
ON public.test_answers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM test_submissions ts
    JOIN test_assignments ta ON ta.id = ts.assignment_id
    JOIN tests t ON t.id = ta.test_id
    WHERE ts.id = test_answers.submission_id
      AND t.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update submissions for their tests"
ON public.test_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM test_assignments ta
    JOIN tests t ON t.id = ta.test_id
    WHERE ta.id = test_submissions.assignment_id
      AND t.teacher_id = auth.uid()
  )
);