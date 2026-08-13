REVOKE EXECUTE ON FUNCTION public.restore_progress(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_progress(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_progress(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_progress(jsonb) TO service_role;