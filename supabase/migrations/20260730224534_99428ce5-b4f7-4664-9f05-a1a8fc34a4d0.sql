-- Garantir que funções de PIN não sejam executáveis por anon/public
REVOKE EXECUTE ON FUNCTION public.cleanup_admin_pin_sessions() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_admin_pin_sessions() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.ensure_master_pin_configured() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_master_pin_configured() TO authenticated, service_role;

-- Garantir que outras funções admin_pin também esteam restritas
REVOKE EXECUTE ON FUNCTION public.create_admin_pin_session(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_admin_pin_session(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.verify_admin_pin_session(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin_session(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.revoke_admin_pin_session(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.revoke_admin_pin_session(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_admin_pin(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_admin_pin(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_admin_pin_with_password(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reset_admin_pin_with_password(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_admin_pin_as_master(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reset_admin_pin_as_master(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.count_recent_failed_pin_attempts(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.count_recent_failed_pin_attempts(uuid) TO authenticated;
