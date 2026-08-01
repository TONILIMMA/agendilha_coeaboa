-- Postgres concede EXECUTE a PUBLIC por padrão: é preciso revogar de PUBLIC.
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_change_request() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_divulgador_request() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_divulgador_request_approval() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_profile_phone_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_user_type_self_escalation() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.get_atrativo_internal(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_estabelecimento_internal(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_promotor(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_master(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_atrativo_internal(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_estabelecimento_internal(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_promotor(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_master(uuid) TO authenticated, service_role;