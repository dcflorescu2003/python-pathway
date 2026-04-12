
-- Function to allow users to request teacher status (bypasses trigger)
CREATE OR REPLACE FUNCTION public.request_teacher_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if current status is null
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (teacher_status IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Teacher status already set';
  END IF;

  UPDATE public.profiles 
  SET teacher_status = 'pending', is_teacher = true
  WHERE user_id = auth.uid();
END;
$$;
