CREATE POLICY "Users can delete their own completed lessons"
ON public.completed_lessons
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);