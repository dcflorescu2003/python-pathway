ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS due_date date;
UPDATE public.challenges SET due_date = '2026-11-08' WHERE due_date IS NULL;
GRANT UPDATE ON public.challenges TO authenticated;
CREATE POLICY "Teachers can update own class challenges" ON public.challenges FOR UPDATE TO authenticated USING (public.is_class_teacher(class_id, auth.uid())) WITH CHECK (public.is_class_teacher(class_id, auth.uid()));