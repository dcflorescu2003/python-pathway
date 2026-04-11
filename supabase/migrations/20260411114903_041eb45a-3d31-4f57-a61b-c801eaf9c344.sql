CREATE POLICY "Students can view assigned tests"
ON public.tests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.test_assignments ta
    JOIN public.class_members cm ON cm.class_id = ta.class_id
    WHERE ta.test_id = tests.id
      AND cm.student_id = auth.uid()
  )
);