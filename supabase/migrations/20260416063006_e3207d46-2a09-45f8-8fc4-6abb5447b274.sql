CREATE POLICY "Teachers can notify class students"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_members cm
    JOIN public.teacher_classes tc ON tc.id = cm.class_id
    WHERE cm.student_id = notifications.user_id
      AND tc.teacher_id = auth.uid()
  )
);