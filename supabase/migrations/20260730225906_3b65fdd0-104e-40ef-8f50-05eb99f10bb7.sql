ALTER FUNCTION public.verify_admin_pin_session(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.revoke_admin_pin_session(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.reset_admin_pin_as_master(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.cleanup_admin_pin_sessions() SET search_path = public, extensions;
ALTER FUNCTION public.count_recent_failed_pin_attempts(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.admin_pin_status() SET search_path = public, extensions;
ALTER FUNCTION public.ensure_master_pin_configured() SET search_path = public, extensions;

-- PIN temporário para o master principal poder entrar agora
UPDATE public.admin_configs
SET pin_hash = extensions.crypt('7391', extensions.gen_salt('bf')),
    requires_change = false,
    last_changed_at = now(),
    updated_at = now()
WHERE user_id = '44c5515f-e338-405a-b4bb-e76e2549cf53';

DELETE FROM public.admin_pin_attempts WHERE user_id = '44c5515f-e338-405a-b4bb-e76e2549cf53';
DELETE FROM public.admin_pin_sessions WHERE user_id = '44c5515f-e338-405a-b4bb-e76e2549cf53';