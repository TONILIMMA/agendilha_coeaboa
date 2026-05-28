REVOKE ALL ON FUNCTION public.is_admin_or_master(uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats(text, text, text) FROM public;

GRANT EXECUTE ON FUNCTION public.is_admin_or_master(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(text, text, text) TO authenticated;
