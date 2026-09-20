CREATE INDEX idx_notifications_read_created ON public.notifications (read, created_at DESC);
CREATE INDEX idx_exercises_sort_order ON public.exercises (sort_order, id);