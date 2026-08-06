GRANT EXECUTE ON FUNCTION public.is_admin_or_master(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_master(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_promotor(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO anon;