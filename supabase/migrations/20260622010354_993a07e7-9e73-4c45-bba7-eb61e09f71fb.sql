
-- Revoga acesso via API às tabelas depreciadas
REVOKE ALL ON public.app_user_roles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.app_roles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.app_role_permissions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.app_permissions FROM PUBLIC, anon, authenticated;

-- Garante service_role para migração futura
GRANT ALL ON public.app_user_roles TO service_role;
GRANT ALL ON public.app_roles TO service_role;
GRANT ALL ON public.app_role_permissions TO service_role;
GRANT ALL ON public.app_permissions TO service_role;

-- Remove a função depreciada has_app_permission que dependia das tabelas antigas
-- (substituída por has_permission baseada em collaborators + user_roles)
DROP FUNCTION IF EXISTS public.has_app_permission(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_permissions(uuid) CASCADE;
