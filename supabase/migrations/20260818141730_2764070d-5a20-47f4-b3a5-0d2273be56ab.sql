REVOKE EXECUTE ON FUNCTION public.admin_recompute_xp(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recompute_xp(uuid) TO authenticated;