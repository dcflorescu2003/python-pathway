ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS group_id uuid, ADD COLUMN IF NOT EXISTS group_title text;
UPDATE public.challenges SET group_id = md5(class_id::text || date_trunc('minute', created_at)::text || coalesce(due_date::text,''))::uuid WHERE group_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_group ON public.challenges(group_id);