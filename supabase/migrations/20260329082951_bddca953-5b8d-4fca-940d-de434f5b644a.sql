
-- Allow teachers to read completed_lessons for students in their classes
CREATE POLICY "Teachers can view student completed lessons"
ON completed_lessons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM class_members cm
    JOIN teacher_classes tc ON tc.id = cm.class_id
    WHERE cm.student_id = completed_lessons.user_id
    AND tc.teacher_id = auth.uid()
  )
);
